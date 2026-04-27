import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import fs from "fs";
import path from "path";
import * as schema from "./schema";

let client: Client | null = null;
let db: LibSQLDatabase<typeof schema> | null = null;
let bootstrapped = false;
let clientUrl: string | null = null;

function defaultDatabaseUrl() {
  return process.env.NODE_ENV === "test" ? "file::memory:" : "file:.data/redditech-academy-auth.db";
}

function ensureDirectoryForFileUrl(url: string) {
  if (!url.startsWith("file:")) return;
  const filePath = url.slice("file:".length);
  if (!filePath || filePath === ":memory:") return;
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
}

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || defaultDatabaseUrl();
}

export function getDbClient() {
  const url = getDatabaseUrl();
  if (!client || clientUrl !== url) {
    ensureDirectoryForFileUrl(url);
    client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
    db = drizzle(client, { schema });
    clientUrl = url;
    bootstrapped = false;
  }
  return client;
}

export function getDb() {
  getDbClient();
  if (!db) throw new Error("Database unavailable");
  return db;
}

export async function ensureAuthSchema() {
  const c = getDbClient();
  if (bootstrapped) return;
  await c.batch([
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL, last_login_at INTEGER)`,
    `CREATE TABLE IF NOT EXISTS auth_magic_tokens (id TEXT PRIMARY KEY, email TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL, used_at INTEGER, created_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), session_hash TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS course_access (id TEXT PRIMARY KEY, course_slug TEXT NOT NULL, email TEXT NOT NULL, status TEXT NOT NULL, approved_by TEXT, approved_at INTEGER, created_at INTEGER NOT NULL)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS course_access_course_email_idx ON course_access(course_slug, email)`,
    `CREATE TABLE IF NOT EXISTS access_requests (id TEXT PRIMARY KEY, course_slug TEXT NOT NULL, email TEXT NOT NULL, reason TEXT, status TEXT NOT NULL, approval_token_hash TEXT NOT NULL UNIQUE, approval_expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL, decided_at INTEGER)`,
    `CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, event_type TEXT NOT NULL, email TEXT, course_slug TEXT, metadata_json TEXT, created_at INTEGER NOT NULL)`,
  ], "write");
  bootstrapped = true;
}

export async function resetAuthDbForTests() {
  const c = getDbClient();
  bootstrapped = false;
  await c.batch([
    `DROP TABLE IF EXISTS audit_events`,
    `DROP TABLE IF EXISTS access_requests`,
    `DROP TABLE IF EXISTS course_access`,
    `DROP TABLE IF EXISTS sessions`,
    `DROP TABLE IF EXISTS auth_magic_tokens`,
    `DROP TABLE IF EXISTS users`,
  ], "write");
  await ensureAuthSchema();
}
