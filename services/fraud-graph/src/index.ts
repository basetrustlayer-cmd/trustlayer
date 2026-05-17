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
}

export function createFraudGraphServiceFromEnv(): FraudGraphService {
  return new FraudGraphService({
    uri: process.env.NEO4J_URI,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD,
    authDisabled: process.env.NEO4J_AUTH_DISABLED !== "false"
  });
}
