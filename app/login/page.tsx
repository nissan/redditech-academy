import Link from "next/link";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; sent?: string; devLink?: string }> }) {
  const params = await searchParams;
  const next = params.next || "/";
  return (
    <main className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8">
        <Link href="/" className="text-sm text-slate-400 hover:text-white">← Redditech Academy</Link>
        <h1 className="mt-6 font-fraunces text-3xl font-bold text-white">Sign in</h1>
        <p className="mt-2 text-sm text-slate-400">Enter your email. We’ll send a one-time magic link.</p>
        {params.sent ? (
          <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">
            Check your email for a login link.
            {params.devLink && <p className="mt-3 break-all text-xs text-green-100">Dev link: <a className="underline" href={params.devLink}>{params.devLink}</a></p>}
          </div>
        ) : (
          <form action="/api/auth/magic-link/request" method="post" className="mt-6 space-y-4">
            <input type="hidden" name="next" value={next} />
            <input name="email" type="email" required placeholder="you@example.com" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
            <button className="w-full rounded-lg bg-orange-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-orange-400">Send magic link</button>
          </form>
        )}
      </div>
    </main>
  );
}
