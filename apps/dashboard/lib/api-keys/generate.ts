import crypto from "crypto";

export function generateApiKey(environment: "TEST" | "LIVE" = "TEST") {
  const prefix = environment === "LIVE" ? "tl_live_" : "tl_test_";
  const secret = crypto.randomBytes(32).toString("hex");
  const rawKey = `${prefix}${secret}`;
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  return {
    rawKey,
    keyHash,
    keyPrefix: rawKey.slice(0, 12)
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
