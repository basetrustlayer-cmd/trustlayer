import neo4j, { type Driver } from "neo4j-driver";
import { z } from "zod";

const fraudGraphConfigSchema = z.object({
  uri: z.string().default("bolt://localhost:7687"),
  username: z.string().default("neo4j"),
  password: z.string().default("trustlayer"),
  authDisabled: z.boolean().default(true)
});

export type FraudGraphConfig = z.input<typeof fraudGraphConfigSchema>;

export type SubjectIdentifierInput = {
  subjectId: string;
  identifierType: "phone" | "email" | "national_id" | "business_registration" | "device" | "bank_account";
  identifierHash: string;
};

export type SharedIdentifierMatch = {
  identifierType: string;
  identifierHash: string;
  subjectIds: string[];
  subjectCount: number;
};

export type FraudGraphRiskAnalytics = {
  subjectId: string;
  sharedIdentifierCount: number;
  connectedSubjectCount: number;
  highestSharedIdentifierSubjectCount: number;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  sharedIdentifiers: SharedIdentifierMatch[];
};

export function getRiskLevel(riskScore: number): FraudGraphRiskAnalytics["riskLevel"] {
  if (riskScore >= 70) return "high";
  if (riskScore >= 35) return "medium";
  return "low";
}

export function calculateGraphRiskScore(matches: SharedIdentifierMatch[]): number {
  const sharedIdentifierCount = matches.length;
  const connectedSubjectCount = new Set(
    matches.flatMap((match) => match.subjectIds)
  ).size;
  const highestSharedIdentifierSubjectCount = Math.max(
    0,
    ...matches.map((match) => match.subjectCount)
  );

  return Math.min(
    100,
    sharedIdentifierCount * 20 +
      connectedSubjectCount * 10 +
      highestSharedIdentifierSubjectCount * 10
  );
}

export class FraudGraphService {
  private readonly driver: Driver;

  constructor(config: FraudGraphConfig = {}) {
    const parsed = fraudGraphConfigSchema.parse(config);

    this.driver = parsed.authDisabled
      ? neo4j.driver(parsed.uri)
      : neo4j.driver(parsed.uri, neo4j.auth.basic(parsed.username, parsed.password));
  }

  async close(): Promise<void> {
    await this.driver.close();
  }

  async upsertSubjectIdentifier(input: SubjectIdentifierInput): Promise<void> {
    const session = this.driver.session();

    try {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MERGE (s:Subject {id: $subjectId})
          MERGE (i:Identifier {type: $identifierType, hash: $identifierHash})
          MERGE (s)-[:USES_IDENTIFIER]->(i)
          SET s.updatedAt = datetime(),
              i.updatedAt = datetime()
          `,
          input
        )
      );
    } finally {
      await session.close();
    }
  }

  async findSharedIdentifiers(subjectId: string): Promise<SharedIdentifierMatch[]> {
    const session = this.driver.session();

    try {
      const result = await session.executeRead((tx) =>
        tx.run(
          `
          MATCH (:Subject {id: $subjectId})-[:USES_IDENTIFIER]->(i:Identifier)<-[:USES_IDENTIFIER]-(other:Subject)
          WITH i, collect(DISTINCT other.id) AS subjectIds
          WHERE size(subjectIds) > 1
          RETURN i.type AS identifierType,
                 i.hash AS identifierHash,
                 subjectIds,
                 size(subjectIds) AS subjectCount
          ORDER BY subjectCount DESC
          `,
          { subjectId }
        )
      );

      return result.records.map((record) => ({
        identifierType: record.get("identifierType"),
        identifierHash: record.get("identifierHash"),
        subjectIds: record.get("subjectIds"),
        subjectCount: Number(record.get("subjectCount"))
      }));
    } finally {
      await session.close();
    }
  }

  async calculateRiskAnalytics(subjectId: string): Promise<FraudGraphRiskAnalytics> {
    const sharedIdentifiers = await this.findSharedIdentifiers(subjectId);
    const riskScore = calculateGraphRiskScore(sharedIdentifiers);
    const connectedSubjectCount = new Set(
      sharedIdentifiers.flatMap((match) => match.subjectIds)
    ).size;
    const highestSharedIdentifierSubjectCount = Math.max(
      0,
      ...sharedIdentifiers.map((match) => match.subjectCount)
    );

    return {
      subjectId,
      sharedIdentifierCount: sharedIdentifiers.length,
      connectedSubjectCount,
      highestSharedIdentifierSubjectCount,
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      sharedIdentifiers
    };
  }
}

export function createFraudGraphServiceFromEnv(): FraudGraphService {
  return new FraudGraphService({
    uri: process.env.NEO4J_URI,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD,
    authDisabled: process.env.NEO4J_AUTH_DISABLED !== "false"
  });
}
