import type { FastifyInstance } from "fastify";
import { readFileSync } from "fs";
import { join } from "path";

export async function governanceRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/scoring-model.yaml", async (_request, reply) => {
    const yamlPath = join(process.cwd(), "../../docs/governance/scoring-model.yaml");
    const content = readFileSync(yamlPath, "utf-8");
    return reply
      .header("Content-Type", "text/yaml; charset=utf-8")
      .header("Cache-Control", "public, max-age=3600")
      .send(content);
  });
}
