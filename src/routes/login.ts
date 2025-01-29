import { Hono } from "hono";
import { logger } from "hono/logger";
import { customLogger } from "../lib/custom-logger";
import { verify } from "@node-rs/argon2";
import { db } from "../db";
import { sessions, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { lucia } from "../lib/auth";

const app = new Hono();
app.use(logger(customLogger));

type Login = {
  username: string;
  password: string;
};

app.post("/", async (c) => {
  let body: Login;

  // Safely parse JSON
  try {
    body = await c.req.json<Login>();
  } catch {
    return c.json(
      {
        message: "Malformed JSON. Please check your request body.",
      },
      400
    );
  }

  const { username, password } = body;

  // Validate input
  if (!username || !password) {
    return c.json(
      {
        message: "Username or password cannot be empty. Please try again.",
      },
      400
    );
  }

  // Fetch user from the database
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    return c.json(
      {
        message: "This username is not recognized. Please try again.",
      },
      401
    );
  }

  if (user.role !== "student") {
    return c.json(
      {
        message: "This is for student login only.",
      },
      401
    );
  }

  const hasSession = await db.query.sessions.findFirst({
    where: eq(sessions.userId, user.id),
  });

  if (hasSession) {
    return c.json({ message: "User already logged in." });
  }

  // Verify password
  const isMatch = await verify(user.hashedPassword, password, {
    salt: Buffer.from(user.salt),
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  if (!isMatch) {
    return c.json({ message: "Invalid password. Try again." }, 401);
  }

  // Create session
  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  // Send cookies to headers
  c.header("Set-Cookie", sessionCookie.serialize());

  customLogger("User logged in:", `${user.username}`);
  return c.json({ message: "Logged in successfully." });
});

export default app;
