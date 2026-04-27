import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RequestAccessForm } from "@/components/auth/RequestAccessForm";
import { getCurrentUser } from "@/lib/auth";
import { getCourseMetadata } from "@/lib/courses";

export default async function RequestAccessPage({ searchParams }: { searchParams: Promise<{ courseSlug?: string }> }) {
  const { courseSlug } = await searchParams;
  if (!courseSlug) notFound();
  const course = getCourseMetadata(courseSlug);
  if (!course) notFound();
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/request-access?courseSlug=${courseSlug}`)}`);
  }
  return (
    <main className="min-h-screen bg-[#0F172A] px-4 py-12">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-8">
        <Link href={`/courses/${courseSlug}`} className="text-sm text-slate-400 hover:text-white">← Back to course</Link>
        <h1 className="mt-6 font-fraunces text-3xl font-bold text-white">Request access</h1>
        <p className="mt-2 text-slate-400">Request access to {course.title}. Nissan will receive a one-click approval email.</p>
        <div className="mt-6"><RequestAccessForm courseSlug={courseSlug} defaultEmail={user?.email} /></div>
      </div>
    </main>
  );
}
