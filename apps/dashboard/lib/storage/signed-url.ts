import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getStorageBucket, getStorageClient } from "./client";

export async function getSignedDownloadUrl(key: string) {
  const client = getStorageClient();

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: getStorageBucket(),
      Key: key
    }),
    { expiresIn: 60 * 15 }
  );
}
