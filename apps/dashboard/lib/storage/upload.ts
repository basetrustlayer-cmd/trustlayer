import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getStorageBucket, getStorageClient } from "./client";

type UploadFileInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

export async function uploadFile(input: UploadFileInput) {
  const client = getStorageClient();

  await client.send(
    new PutObjectCommand({
      Bucket: getStorageBucket(),
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType
    })
  );

  return input.key;
}
