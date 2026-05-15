import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@trustlayer/database";

export type ApiKeyAuthContext = {
  apiKeyId: string;
  platformId: string;
  scopes: string[];
};

declare module "fastify" {
  interface FastifyRequest {
    apiKeyAuth?: ApiKeyAuthContext;
  }
}

const PUBLIC_ROUTES = new Set(["/health"]);

function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function extractApiKey(request: FastifyRequest): string | null {
  const authorization = request.headers.authorization;

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  const xApiKey = request.headers["x-api-key"];

  if (typeof xApiKey === "string" && xApiKey.trim().length > 0) {
    return xApiKey.trim();
  }

  return null;
}

function normalizeScopes(scopes: unknown): string[] {
  if (Array.isArray(scopes)) {
    return scopes.filter((scope): scope is string => typeof scope === "string");
  }

  return [];
}

export function requiredScopeForRoute(method: string, path: string): string | null {
  if (!path.startsWith("/v1/")) {
    return null;
  }

  if (method === "GET" && path.startsWith("/v1/tier/")) {
    return "tier:read";
  }

  if (method === "POST" && path === "/v1/verify") {
    return "verification:write";
  }

  return "api:access";
}

export async function apiKeyAuthHook(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const routePath = request.routeOptions.url ?? request.url.split("?")[0];

  if (PUBLIC_ROUTES.has(routePath) || !routePath.startsWith("/v1/")) {
    return;
  }

  const requiredScope = requiredScopeForRoute(request.method, routePath);
  const rawApiKey = extractApiKey(request);

  if (!rawApiKey) {
    await reply.status(401).send({
      error: "Missing API key"
    });
    return;
  }

  const keyHash = hashApiKey(rawApiKey);
  const keyPrefix = rawApiKey.slice(0, 12);

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyPrefix,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
    },
    include: {
      platform: true
    }
  });

  if (!apiKey || !safeEqual(apiKey.keyHash, keyHash)) {
    await reply.status(403).send({
      error: "Invalid API key"
    });
    return;
  }

  if (!apiKey.platform.isActive) {
    await reply.status(403).send({
      error: "Platform is inactive"
    });
    return;
  }

  const scopes = normalizeScopes(apiKey.scopes);

  if (requiredScope && !scopes.includes(requiredScope) && !scopes.includes("*")) {
    await reply.status(403).send({
      error: "API key does not have the required scope",
      requiredScope
    });
    return;
  }

  await prisma.apiKey.update({
    where: {
      id: apiKey.id
    },
    data: {
      lastUsedAt: new Date()
    }
  });

  request.apiKeyAuth = {
    apiKeyId: apiKey.id,
    platformId: apiKey.platformId,
    scopes
  };
}
