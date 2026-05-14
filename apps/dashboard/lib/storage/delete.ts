import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getStorageBucket, getStorageClient } from "./client";

export async function deleteFile(key: string) {
  const client = getStorageClient();

  await client.send(
    new DeleteObjectCommand({
      Bucket: getStorageBucket(),
      Key: key
    })
  );
}
