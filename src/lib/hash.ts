import { hash, Options, verify } from "@node-rs/argon2";
import { randomBytes } from "crypto";

const partialHashOptions: Options = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export function hashPassword(password: string, salt: Buffer): Promise<string> {
  const hashOptions: Options = {
    salt,
    ...partialHashOptions,
  };

  return hash(password, hashOptions);
}

export function verifyPasswordHash(
  plainPassword: string,
  hashedPassword: Buffer | string,
  salt: Buffer
): Promise<boolean> {
  const hashOptions: Options = {
    salt,
    ...partialHashOptions,
  };

  return verify(hashedPassword, plainPassword, hashOptions);
}

export function getSalt() {
  return randomBytes(16);
}
