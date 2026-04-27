import { createHmac, randomBytes, timingSafeEqual } from "crypto";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production");
  }
  return value || "redditech-academy-dev-secret-change-me";
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashToken(token: string) {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

export function tokensEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createRawToken() {
  return randomBytes(32).toString("base64url");
}
