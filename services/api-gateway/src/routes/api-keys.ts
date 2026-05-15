import { createHash, randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, ApiKeyEnvironment } from "@trustlayer/database";

const createApiKeySchema = z.object({
  platformId: z.string().min(1),
  environment: z.nativeEnum(ApiKeyEnvironment).default(ApiKeyEnvironment.TEST),
  scopes: z.array(z.string().min(1)).default([
    "tier:read",
    "verification:write"
  ]),
  expiresAt: z.string().datetime().optional()
});

const revokeApiKeySchema = z.object({
  apiKeyId: z.string().min(1)
});

function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

function generateApiKey(environment: ApiKeyEnvironment): string {
  const prefix =
    environment === ApiKeyEnvironment.LIVE ? "tl_live" : "tl_test";

  return `${prefix}_${randomBytes(32).toString("hex")}`;
}

export async function registerApiKeyRoutes(
  app: FastifyInstance
): Promise<void> {
  app.post("/v1/api-keys", async (request, reply) => {
    const parsed = createApiKeySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid API key creation request",
        issues: parsed.error.flatten()
      });
    }

    const data = parsed.data;

    const platform = await prisma.platform.findUnique({
      where: {
        id: data.platformId
      }
    });

    if (!platform) {
      return reply.status(404).send({
        error: "Platform not found"
      });
    }

    if (!platform.organizationId) {
      return reply.status(403).send({
        error: "Platform is not linked to an organization"
      });
    }

    const subscription = await prisma.subscription.findUnique({
      where: {
        organizationId: platform.organizationId
      },
      include: {
        plan: true
      }
    });

    if (!subscription || !subscription.plan.includesApiAccess) {
      return reply.status(403).send({
        error: "API access is not included in the current subscription plan"
      });
    }

    const plaintextKey = generateApiKey(data.environment);
    const keyPrefix = plaintextKey.slice(0, 12);
    const keyHash = hashApiKey(plaintextKey);

    const apiKey = await prisma.apiKey.create({
      data: {
        platformId: platform.id,
        keyPrefix,
        keyHash,
        scopes: data.scopes,
        environment: data.environment,
        expiresAt: data.expiresAt
          ? new Date(data.expiresAt)
          : null
      }
    });

    return reply.status(201).send({
      id: apiKey.id,
      platformId: apiKey.platformId,
      keyPrefix: apiKey.keyPrefix,
      environment: apiKey.environment,
      scopes: apiKey.scopes,
      expiresAt:
        apiKey.expiresAt?.toISOString() ?? null,
      plaintextKey,
      warning:
        "Store this API key now. It will not be shown again."
    });
  });

  app.get("/v1/platforms/:platformId/api-keys", async (request, reply) => {
    const params = z
      .object({
        platformId: z.string().min(1)
      })
      .parse(request.params);

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        platformId: params.platformId
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return reply.status(200).send({
      platformId: params.platformId,
      apiKeys: apiKeys.map((apiKey) => ({
        id: apiKey.id,
        keyPrefix: apiKey.keyPrefix,
        environment: apiKey.environment,
        scopes: apiKey.scopes,
        lastUsedAt:
          apiKey.lastUsedAt?.toISOString() ?? null,
        expiresAt:
          apiKey.expiresAt?.toISOString() ?? null,
        revokedAt:
          apiKey.revokedAt?.toISOString() ?? null,
        createdAt: apiKey.createdAt.toISOString()
      }))
    });
  });

  app.post("/v1/api-keys/revoke", async (request, reply) => {
    const parsed = revokeApiKeySchema.safeParse(
      request.body
    );

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid API key revocation request",
        issues: parsed.error.flatten()
      });
    }

    const apiKey = await prisma.apiKey.update({
      where: {
        id: parsed.data.apiKeyId
      },
      data: {
        revokedAt: new Date()
      }
    });

    return reply.status(200).send({
      id: apiKey.id,
      revokedAt:
        apiKey.revokedAt?.toISOString() ?? null
    });
  });
}
