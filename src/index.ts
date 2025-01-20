import { Hono } from "hono";
import { logger } from "hono/logger";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { verify } from "@node-rs/argon2";

const app = new Hono();

app.use(logger());

app.post("/login", async (c) => {
  const body = await c.req.parseBody();
  const username = body.username as string;
  const password = body.password as string;

  if (!username || !password) {
    await Bun.password.hash("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", {
      algorithm: "argon2id",
      memoryCost: 19456,
      timeCost: 2,
    });

    return c.json(
      {
        message: "Username or password cannot be empty. Please try again.",
      },
      401
    );
  }

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

  const isMatch = await verify(user.hashedPassword, password, {
    salt: Buffer.from(user.salt),
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  if (isMatch) {
    return c.json({ message: "Logged in successfully." });
  } else {
    return c.json({ message: "Invalid password. Try again." }, 401);
  }
});

export default {
  port: 3030,
  fetch: app.fetch,
};
