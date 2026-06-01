import type { FastifyInstance } from "fastify";
import { prisma } from "@trustlayer/database";

export async function widgetRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/v1/widget/:subjectId/embed.js",
    async (request, reply) => {
      const { subjectId } = request.params as { subjectId: string };

      const subject = await prisma.subject.findUnique({
        where: { id: subjectId }
      });

      if (!subject) {
        return reply.status(404).send({ error: "Subject not found" });
      }

      const js = [
        "(function(){",
        "  var s = document.createElement(\"script\");",
        "  s.src = \"https://cdn.trustlayer.africa/widget.js\";",
        "  s.setAttribute(\"data-subject-id\", \"" + subjectId + "\");",
        "  s.setAttribute(\"data-theme\", \"light\");",
        "  document.currentScript.insertAdjacentElement(\"afterend\", s);",
        "})();"
      ].join("\n");

      return reply
        .header("Content-Type", "application/javascript; charset=utf-8")
        .header("Cache-Control", "public, max-age=300")
        .send(js);
    }
  );
}
