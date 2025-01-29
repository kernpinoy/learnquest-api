import { Hono } from "hono";
import { logger } from "hono/logger";
import { customLogger } from "../lib/custom-logger";
import { s3, S3Client, S3File } from "bun";
import { client, credentials } from "../lib/minio";
import { db } from "../db";
import { sessions } from "../db/schema";
import { eq } from "drizzle-orm";

const app = new Hono();
app.use(logger(customLogger));

// for charts
app.get("/charts/:filename", async (c) => {
  const cookieHeader = c.req.header("Cookie");

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
    const sessionExists = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });

    if (!sessionExists) {
      return c.json({ message: "Invalid session ID." }, 403);
    }

    const filename = c.req.param("filename");

    const fileExist = await client.exists(filename);

    if (!fileExist) {
      c.json({ message: "File not found." }, 404);
    }

    const filePdf: S3File = client.file(filename);
    const buffer = await filePdf.arrayBuffer();

    return c.body(buffer, 200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    });
  } catch {
    return c.json(
      { message: "An error occurred during logout. Please try again later." },
      500
    );
  }
});

// for all charts pdf
app.get("/charts", async (c) => {
  const cookieHeader = c.req.header("Cookie");

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
  } catch {
    return c.json(
      { message: "An error occurred during logout. Please try again later." },
      500
    );
  }
});

export default app;
