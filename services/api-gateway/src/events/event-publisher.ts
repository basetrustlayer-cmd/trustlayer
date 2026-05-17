import { Kafka, type Producer } from "kafkajs";

export type TrustLayerEventName =
  | "transaction.created"
  | "review.created"
  | "dispute.created";

export type TrustLayerEventPayload = {
  id: string;
  eventName: TrustLayerEventName;
  subjectIds: string[];
  occurredAt: string;
  data: Record<string, unknown>;
};

let producer: Producer | null = null;

function isKafkaEnabled(): boolean {
  return process.env.EVENT_BUS_PROVIDER === "redpanda";
}

function getKafkaProducer(): Producer {
  if (producer) return producer;

  const brokers = (process.env.KAFKA_BROKERS ?? "localhost:9092")
    .split(",")
    .map((broker) => broker.trim())
    .filter(Boolean);

  const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID ?? "trustlayer-api-gateway",
    brokers
  });

  producer = kafka.producer();
  return producer;
}

export async function publishTrustLayerEvent(
  topic: string,
  payload: TrustLayerEventPayload
): Promise<void> {
  if (!isKafkaEnabled()) {
    return;
  }

  const activeProducer = getKafkaProducer();

  try {
    await activeProducer.connect();
    await activeProducer.send({
      topic,
      messages: [
        {
          key: payload.id,
          value: JSON.stringify(payload)
        }
      ]
    });
  } catch (error) {
    console.warn("TrustLayer event publish failed", {
      topic,
      eventName: payload.eventName,
      error
    });
  }
}
