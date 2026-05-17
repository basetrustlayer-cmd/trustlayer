import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { recordHttpRequest } from "./metrics.js";

const requestStartTimes = new WeakMap<object, number>();

function getInboundRequestId(value: unknown): string | null {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" && value[0].length > 0 ? value[0] : null;
  }

  return typeof value === "string" && value.length > 0 ? value : null;
}

export function registerObservabilityHooks(app: FastifyInstance): void {
  app.addHook("onRequest", async (request, reply) => {
    const requestId =
      getInboundRequestId(request.headers["x-request-id"]) ?? randomUUID();

    request.id = requestId;
    requestStartTimes.set(request, Date.now());
    reply.header("X-Request-ID", requestId);
  });

  app.addHook("onResponse", async (request, reply) => {
    const startedAt = requestStartTimes.get(request) ?? Date.now();
    const durationMs = Date.now() - startedAt;
    const route = request.routeOptions.url ?? request.url ?? "unknown";

    recordHttpRequest({
      method: request.method,
      route,
      statusCode: reply.statusCode,
      durationMs
    });

    request.log.info(
      {
        requestId: request.id,
        method: request.method,
        route,
        statusCode: reply.statusCode,
        durationMs
      },
      "request completed"
    );
  });

  app.addHook("onError", async (request, _reply, error) => {
    request.log.error(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
        error
      },
      "request failed"
    );
  });
}
