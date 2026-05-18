import crypto from "crypto";

const FIVE_MINUTES_SECONDS = 300;

function getWebhookSecret(): string {
  const secret = process.env.HUBTEL_WEBHOOK_SECRET;

  if (!secret || secret.length < 24) {
    throw new Error("HUBTEL_WEBHOOK_SECRET must be set and at least 24 characters long.");
  }

  return secret;
}

export function verifyHubtelWebhookSignature(input: {
  rawBody: string;
  signature: string | undefined;
  timestamp: string | undefined;
  now?: number;
}): void {
  if (!input.signature) {
    throw new Error("Missing Hubtel webhook signature.");
  }

  if (!input.timestamp) {
    throw new Error("Missing Hubtel webhook timestamp.");
  }

  const timestamp = Number(input.timestamp);

  if (!Number.isFinite(timestamp)) {
    throw new Error("Invalid Hubtel webhook timestamp.");
  }

  const now = input.now ?? Math.floor(Date.now() / 1000);

  if (Math.abs(now - timestamp) > FIVE_MINUTES_SECONDS) {
    throw new Error("Hubtel webhook timestamp is outside the allowed tolerance.");
  }

  const expected = crypto
    .createHmac("sha256", getWebhookSecret())
    .update(`${timestamp}.${input.rawBody}`)
    .digest("hex");

  const actual = input.signature.replace(/^sha256=/, "");

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(actual, "hex");

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    throw new Error("Invalid Hubtel webhook signature.");
  }
}
