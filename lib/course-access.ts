import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { getCourseMetadata } from "@/lib/courses";
import { ensureAuthSchema, getDb } from "@/lib/db/client";
import { accessRequests, auditEvents, courseAccess } from "@/lib/db/schema";
import { createRawToken, hashToken, normalizeEmail } from "@/lib/tokens";
import { sendEmail } from "@/lib/email/resend";

const APPROVAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const APPROVER_EMAIL = process.env.ACCESS_APPROVER_EMAIL || "nissan.dookeran@gmail.com";

function appUrl(requestUrl?: string) {
  return process.env.APP_URL || (requestUrl ? new URL(requestUrl).origin : "http://localhost:3000");
}

export function isCourseProtected(courseSlug: string) {
  const course = getCourseMetadata(courseSlug) as (ReturnType<typeof getCourseMetadata> & {
    protected?: boolean;
    accessProtected?: boolean;
  }) | null;
  return Boolean(course?.protected || course?.accessProtected);
}

export async function userHasCourseAccess(courseSlug: string, emailInput: string) {
  await ensureAuthSchema();
  const email = normalizeEmail(emailInput);
  const rows = await getDb()
    .select()
    .from(courseAccess)
    .where(and(eq(courseAccess.courseSlug, courseSlug), eq(courseAccess.email, email), eq(courseAccess.status, "approved")))
    .limit(1);
  return rows.length > 0;
}

export async function approveCourseAccess(courseSlug: string, emailInput: string, approvedBy = APPROVER_EMAIL) {
  await ensureAuthSchema();
  const now = new Date();
  const email = normalizeEmail(emailInput);
  await getDb()
    .insert(courseAccess)
    .values({ id: randomUUID(), courseSlug, email, status: "approved", approvedBy, approvedAt: now, createdAt: now })
    .onConflictDoUpdate({
      target: [courseAccess.courseSlug, courseAccess.email],
      set: { status: "approved", approvedBy, approvedAt: now },
    });
  await writeAudit("course_access.approved", email, courseSlug, { approvedBy });
}

export async function requestCourseAccess(input: { courseSlug: string; email: string; reason?: string; requestUrl?: string }) {
  await ensureAuthSchema();
  const course = getCourseMetadata(input.courseSlug);
  if (!course) throw new Error("Course not found");
  const email = normalizeEmail(input.email);
  const rawToken = createRawToken();
  const approvalTokenHash = hashToken(rawToken);
  const approvalExpiresAt = new Date(Date.now() + APPROVAL_TTL_MS);
  const now = new Date();
  await getDb().insert(accessRequests).values({
    id: randomUUID(),
    courseSlug: input.courseSlug,
    email,
    reason: input.reason?.trim() || null,
    status: "pending",
    approvalTokenHash,
    approvalExpiresAt,
    createdAt: now,
  });
  const approveLink = new URL("/api/access/approve", appUrl(input.requestUrl));
  approveLink.searchParams.set("token", rawToken);
  await sendEmail({
    to: APPROVER_EMAIL,
    subject: `Access request: ${course.title}`,
    text: `Requester: ${email}\nCourse: ${course.title} (${input.courseSlug})\nReason: ${input.reason || "—"}\n\nApprove: ${approveLink.toString()}`,
    html: `<p><strong>Requester:</strong> ${email}</p><p><strong>Course:</strong> ${course.title} (${input.courseSlug})</p><p><strong>Reason:</strong> ${input.reason || "—"}</p><p><a href="${approveLink.toString()}">Approve access</a></p>`,
  });
  await writeAudit("course_access.requested", email, input.courseSlug, { requestId: approvalTokenHash.slice(0, 8) });
  return { email, approveLink: approveLink.toString(), approvalExpiresAt };
}

export async function approveAccessRequest(rawToken: string) {
  await ensureAuthSchema();
  const approvalTokenHash = hashToken(rawToken);
  const rows = await getDb().select().from(accessRequests).where(eq(accessRequests.approvalTokenHash, approvalTokenHash)).limit(1);
  const request = rows[0];
  if (!request || request.status !== "pending" || request.approvalExpiresAt.getTime() <= Date.now()) return null;
  const now = new Date();
  const claimed = await getDb()
    .update(accessRequests)
    .set({ status: "approved", decidedAt: now })
    .where(and(eq(accessRequests.id, request.id), eq(accessRequests.status, "pending")))
    .returning({ id: accessRequests.id });
  if (claimed.length === 0) return null;
  await approveCourseAccess(request.courseSlug, request.email, APPROVER_EMAIL);
  await writeAudit("course_access.request_approved", request.email, request.courseSlug, { requestId: request.id });
  return { courseSlug: request.courseSlug, email: request.email };
}

export async function writeAudit(eventType: string, email?: string | null, courseSlug?: string | null, metadata?: unknown) {
  await ensureAuthSchema();
  await getDb().insert(auditEvents).values({
    id: randomUUID(),
    eventType,
    email: email || null,
    courseSlug: courseSlug || null,
    metadataJson: metadata ? JSON.stringify(metadata) : null,
    createdAt: new Date(),
  });
}
