import { S3Client } from "@aws-sdk/client-s3";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for object storage.`);
  }

  return value;
}

export function getStorageBucket() {
  return getRequiredEnv("S3_BUCKET");
}

export function getStorageClient() {
  return new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: getRequiredEnv("S3_ENDPOINT"),
    credentials: {
      accessKeyId: getRequiredEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("S3_SECRET_ACCESS_KEY")
    }
  });
}
