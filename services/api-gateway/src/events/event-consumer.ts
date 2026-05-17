import { Kafka } from "kafkajs";
import { prisma, Prisma } from "@trustlayer/database";
import { recalculateTrustScoreFromMarketplace, type ScoreRole } from "../scoring/scoring-service.js";
import type { TrustLayerEventPayload } from "./event-publisher.js";

function isKafkaEnabled(): boolean {
  return process.env.EVENT_BUS_PROVIDER === "redpanda";
}

function toScoreRole(value: unknown): ScoreRole {
  if (
    value === "seller" ||
    value === "buyer" ||
    value === "worker" ||
    value === "hirer" ||
    value === "platform"
  ) {
    return value;
  }

  return "platform";
}

export async function startTrustLayerEventConsumer(): Promise<void> {
  if (!isKafkaEnabled()) {
    console.log("TrustLayer event consumer disabled");
    return;
  }

  const brokers = (process.env.KAFKA_BROKERS ?? "localhost:9092")
    .split(",")
    .map((broker) => broker.trim())
    .filter(Boolean);

  const kafka = new Kafka({
    clientId: process.env.KAFKA_CONSUMER_CLIENT_ID ?? "trustlayer-event-consumer",
    brokers
  });

  const consumer = kafka.consumer({
    groupId: process.env.KAFKA_CONSUMER_GROUP_ID ?? "trustlayer-event-consumers"
  });

  await consumer.connect();
  await consumer.subscribe({
    topic: process.env.KAFKA_MARKETPLACE_TOPIC ?? "trustlayer.marketplace.events",
    fromBeginning: false
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const value = message.value?.toString();

      if (!value) {
        return;
      }

      let payload: TrustLayerEventPayload;
      let payloadJson: Prisma.InputJsonValue;

      try {
        payload = JSON.parse(value) as TrustLayerEventPayload;
        payloadJson = payload as unknown as Prisma.InputJsonValue;
      } catch (error) {
        console.warn("Invalid TrustLayer event payload", { topic, error });
        return;
      }

      await prisma.eventLog.upsert({
        where: {
          eventId: payload.id
        },
        create: {
          eventId: payload.id,
          topic,
          eventName: payload.eventName,
          payload: payloadJson,
          status: "RECEIVED"
        },
        update: {
          topic,
          eventName: payload.eventName,
          payload: payloadJson,
          status: "RECEIVED",
          errorMessage: null
        }
      });

      try {
        for (const subjectId of payload.subjectIds) {
          await recalculateTrustScoreFromMarketplace(
            subjectId,
            toScoreRole(payload.data.role),
            payload.eventName
          );
        }

        await prisma.eventLog.update({
          where: {
            eventId: payload.id
          },
          data: {
            status: "PROCESSED",
            processedAt: new Date(),
            errorMessage: null
          }
        });
      } catch (error) {
        await prisma.eventLog.update({
          where: {
            eventId: payload.id
          },
          data: {
            status: "FAILED",
            errorMessage: error instanceof Error ? error.message : "Unknown error"
          }
        });

        console.warn("TrustLayer event processing failed", {
          eventId: payload.id,
          eventName: payload.eventName,
          error
        });
      }
    }
  });
}
