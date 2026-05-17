import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { notify } from "../notifications/notification-service.js";

const notificationSchema = z.object({
  eventName: z.enum([
    "transaction.created",
    "review.created",
    "dispute.created",
    "trust_score.updated"
  ]),
  subjectIds: z.array(z.string().min(1)).min(1),
  data: z.record(z.unknown()),
  topic: z.string().optional(),
  platformId: z.string().optional(),
  channels: z
    .array(z.enum(["EVENT_BUS", "WEBHOOK", "EMAIL", "IN_APP"]))
    .optional(),
  email: z
    .object({
      to: z.string().email(),
      subject: z.string().min(1),
      body: z.string().min(1)
    })
    .optional(),
  inApp: z
    .object({
      title: z.string().min(1),
      body: z.string().min(1)
    })
    .optional()
});

export async function registerNotificationRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/notifications/send", async (request, reply) => {
    const parsed = notificationSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid notification request",
        issues: parsed.error.flatten()
      });
    }

    try {
      const result = await notify(parsed.data);
      return reply.status(202).send(result);
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Notification failed"
      });
    }
  });
}
