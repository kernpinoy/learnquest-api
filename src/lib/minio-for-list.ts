import * as Minio from "minio";

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  useSSL: process.env.NODE_ENV === "production",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  region: process.env.MINIO_LOCATION,
  port:
    process.env.NODE_ENV === "production"
      ? undefined
      : Number(process.env.MINIO_PORT),
});
