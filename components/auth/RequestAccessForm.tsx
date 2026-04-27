"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function RequestAccessForm({ courseSlug, defaultEmail }: { courseSlug: string; defaultEmail?: string }) {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    const response = await fetch("/api/access/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseSlug, reason }),
    });
    setStatus(response.ok ? "sent" : "error");
  }

  if (status === "sent") {
    return <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-5 text-green-200">Request sent. Nissan will receive an approval link.</div>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-300">
        Requesting as <span className="font-medium text-white">{defaultEmail}</span>
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-300">Reason</label>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell us why you need this course" />
      </div>
      <Button type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Sending…" : "Request access"}</Button>
      {status === "error" && <p className="text-sm text-red-300">Could not send the request. Check your email and try again.</p>}
    </form>
  );
}
