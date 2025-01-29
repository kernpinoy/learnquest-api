import { S3Client } from "bun";

export const credentials = {
  accessKeyId: process.env.MINIO_ACCESS_KEY,
  secretAccessKey: process.env.MINIO_SECRET_KEY,
  bucket: "learnquest-storage",
  region: process.env.MINIO_LOCATION,
  endpoint: "http://localhost:9000",
};

export const client = new S3Client(credentials);
