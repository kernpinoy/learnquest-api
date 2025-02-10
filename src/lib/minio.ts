import { S3Client } from "bun";

export const credentials = {
  accessKeyId: process.env.MINIO_ACCESS_KEY,
  secretAccessKey: process.env.MINIO_SECRET_KEY,
  bucket: "learnquest-storage",
  region: process.env.MINIO_LOCATION,
  endpoint: process.env.MINIO_ENDPOINT_BUN,
};

export const client = new S3Client(credentials);
