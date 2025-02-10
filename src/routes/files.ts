import { Hono } from "hono";
import { logger } from "hono/logger";
import { customLogger } from "../lib/custom-logger";
import { s3, S3Client, S3File } from "bun";
import { client, credentials } from "../lib/minio";
import { db } from "../db";
import { classrooms, file_upload, sessions, studentsInfo } from "../db/schema";
import { eq } from "drizzle-orm";
import { minioClient } from "../lib/minio-for-list";

const app = new Hono();
app.use(logger(customLogger));

app.get("/charts/:filename", async (c) => {
  const cookieHeader = c.req.header("Cookie");

  if (!cookieHeader) {
    return c.json({ message: "No cookies sent with the request." }, 400);
  }

  const cookies = Object.fromEntries(
    cookieHeader
      .split("; ")
      .map((cookie) => cookie.split("=").map(decodeURIComponent))
  );

  const sessionId = cookies.auth_session as string;
  if (!sessionId) {
    return c.json({ message: "No auth_session cookie found." }, 401);
  }

  try {
    const sessionExists = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });

    if (!sessionExists) {
      return c.json({ message: "Invalid session ID." }, 403);
    }

    const filename = decodeURIComponent(c.req.param("filename"));

    // Check if the file exists in the database
    const fileMetadata = await db.query.file_upload.findFirst({
      where: eq(file_upload.originalName, filename),
    });

    if (!fileMetadata) {
      return c.json({ message: "File not in DB." }, 404);
    }

    try {
      // Check if file exists in MinIO
      await minioClient.statObject(
        fileMetadata?.bucket!,
        fileMetadata?.fileName!
      );
    } catch {
      return c.json({ message: "File not found in storage." }, 404);
    }

    try {
      const stream = await minioClient.getObject(
        fileMetadata?.bucket!,
        fileMetadata?.fileName!
      );

      // Convert Node.js Readable to a Web ReadableStream
      const readableStream = new ReadableStream({
        start(controller) {
          stream.on("data", (chunk) => controller.enqueue(chunk));
          stream.on("end", () => controller.close());
          stream.on("error", (err) => controller.error(err));
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${filename}"`,
        },
      });
    } catch (error) {
      console.error("Error serving file:", error);
      return c.json(
        { message: "An error occurred while retrieving the file." },
        500
      );
    }
  } catch (error) {
    console.error("Error serving file:", error);
    return c.json(
      { message: "An error occurred while retrieving the file." },
      500
    );
  }
});

// for all charts pdf
app.get("/charts", async (c) => {
  const cookieHeader = c.req.header("Cookie");
  let files = [];

  if (!cookieHeader) {
    return c.json({ message: "No cookies sent with the request." }, 400);
  }

  // booger aids the auth_session from cookie
  const cookies = Object.fromEntries(
    cookieHeader
      .split("; ")
      .map((cookie) => cookie.split("=").map(decodeURIComponent))
  );

  const sessionId = cookies.auth_session as string;

  if (!sessionId) {
    return c.json({ message: "No auth_session cookie found." }, 401);
  }

  try {
    const protocol = c.req.header("x-forwarded-proto") ?? "http"; // Detect if behind a reverse proxy
    const host = c.req.header("host") ?? "localhost";
    const path = c.req.path;
    // grab things from db, so grab student info based on cookie, so session > user > student > classroom
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });

    const studentInfo = await db.query.studentsInfo.findFirst({
      where: eq(studentsInfo.userId, session?.userId!),
    });

    if (!studentInfo) {
      return c.json({ message: "No student info found." }, 401);
    }

    const classroom = await db.query.classrooms.findFirst({
      where: eq(classrooms.id, studentInfo.classroomId),
    });

    const class_files = await db.query.file_upload.findMany({
      where: eq(file_upload.classroomId, classroom!.id),
    });

    for (const file of class_files) {
      files.push({
        fileName: file.originalName,
        fileLink: `${protocol}://${host}${path}/${encodeURIComponent(
          file.originalName!
        )}`,
      });
    }

    return c.json(files);
  } catch {
    return c.json(
      {
        message:
          "An error occurred while grabbing the files. Please try again later.",
      },
      500
    );
  }
});

export default app;
