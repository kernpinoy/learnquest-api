import { Hono } from "hono";
import { logger } from "hono/logger";
import { customLogger } from "../lib/custom-logger";
import { lucia } from "../lib/auth";
import { db } from "../db";
import { sessions } from "../db/schema";
import { eq } from "drizzle-orm";

const app = new Hono();
app.use(logger(customLogger));

app.post("/", async (c) => {
  // get cookie lmao from request
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
      columns: { id: true },
    });

    if (!sessionExists) {
      return c.json({ message: "Invalid session ID." }, 403);
    }

    // Invalidate the session in Lucia
    await lucia.invalidateSession(sessionId);

    // blanks to make them log out
    const sessionCookie = lucia.createBlankSessionCookie();

    // Clear the cookie by setting it with Max-Age=0
    c.header("Set-Cookie", sessionCookie.serialize());

    return c.json({ message: "Logged out successfully." });
  } catch {
    return c.json(
      { message: "An error occurred during logout. Please try again later." },
      500
    );
  }
});

export default app;
