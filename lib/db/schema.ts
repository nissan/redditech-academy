import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
});

export const authMagicTokens = sqliteTable("auth_magic_tokens", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  sessionHash: text("session_hash").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const courseAccess = sqliteTable(
  "course_access",
  {
    id: text("id").primaryKey(),
    courseSlug: text("course_slug").notNull(),
    email: text("email").notNull(),
    status: text("status", { enum: ["approved", "revoked"] }).notNull(),
    approvedBy: text("approved_by"),
    approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("course_access_course_email_idx").on(table.courseSlug, table.email)]
);

export const accessRequests = sqliteTable("access_requests", {
  id: text("id").primaryKey(),
  courseSlug: text("course_slug").notNull(),
  email: text("email").notNull(),
  reason: text("reason"),
  status: text("status", { enum: ["pending", "approved", "expired"] }).notNull(),
  approvalTokenHash: text("approval_token_hash").notNull().unique(),
  approvalExpiresAt: integer("approval_expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  decidedAt: integer("decided_at", { mode: "timestamp_ms" }),
});

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  email: text("email"),
  courseSlug: text("course_slug"),
  metadataJson: text("metadata_json"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
