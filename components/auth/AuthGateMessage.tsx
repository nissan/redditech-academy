import Link from "next/link";
import type { CourseMetadata } from "@/lib/content-types";

export function AuthGateMessage({ course, courseSlug, reason, email }: { course: CourseMetadata; courseSlug: string; reason: "login_required" | "access_required"; email?: string }) {
  const next = `/courses/${courseSlug}`;
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <div className="max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10 text-3xl">🔐</div>
        <h1 className="font-fraunces text-2xl font-bold text-white">Protected course</h1>
        <p className="mt-3 text-slate-300">{course.title} is available by approval.</p>
        {reason === "login_required" ? (
          <>
            <p className="mt-2 text-sm text-slate-400">Sign in with your email first. If you are not on the allowlist, you can request access next.</p>
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="mt-6 inline-flex rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-orange-400">Email me a magic link</Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-400">Signed in as {email}. Request access and Nissan can approve it with one click.</p>
            <Link href={`/request-access?courseSlug=${encodeURIComponent(courseSlug)}`} className="mt-6 inline-flex rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-orange-400">Request access</Link>
          </>
        )}
      </div>
    </div>
  );
}
