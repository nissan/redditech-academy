'use client';

import { useState, useEffect } from 'react';

type InspectorMode = 'decode' | 'audit';

interface FindingEntry {
  claim: string;
  issue: string;
  fix: string;
}

interface JwtInspectorProps {
  mode: InspectorMode;
  initialToken?: string;
  onSubmit: (data: {
    token: string;
    header: Record<string, unknown>;
    payload: Record<string, unknown>;
    findings?: FindingEntry[];
  }) => void;
  loading?: boolean;
}

function base64urlDecode(str: string): string {
  // Pad to multiple of 4
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return atob(base64);
  } catch {
    return '';
  }
}

function parseJwtParts(token: string): {
  headerRaw: string;
  payloadRaw: string;
  sig: string;
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
} {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { headerRaw: '', payloadRaw: '', sig: '', header: null, payload: null };
  }
  const headerRaw = base64urlDecode(parts[0]);
  const payloadRaw = base64urlDecode(parts[1]);
  let header: Record<string, unknown> | null = null;
  let payload: Record<string, unknown> | null = null;
  try {
    header = JSON.parse(headerRaw);
  } catch { /* empty */ }
  try {
    payload = JSON.parse(payloadRaw);
  } catch { /* empty */ }
  return { headerRaw, payloadRaw, sig: parts[2], header, payload };
}

function formatExpiry(exp: number): string {
  const d = new Date(exp * 1000);
  const now = new Date();
  const expired = d < now;
  return `${d.toISOString().slice(0, 10)} (${expired ? 'EXPIRED' : 'valid'})`;
}

export function JwtInspector({
  mode,
  initialToken = '',
  onSubmit,
  loading = false,
}: JwtInspectorProps) {
  const [token, setToken] = useState(initialToken);
  const [findings, setFindings] = useState<FindingEntry[]>([
    { claim: '', issue: '', fix: '' },
  ]);

  useEffect(() => {
    setToken(initialToken);
  }, [initialToken]);

  const { header, payload, sig } = parseJwtParts(token);

  const alg = header?.alg as string | undefined;
  const exp = payload?.exp as number | undefined;
  const aud = payload?.aud as string | undefined;

  const sigStatus = () => {
    if (!header) return { label: 'INVALID JWT', color: 'text-red-400' };
    if (alg === 'none') return { label: 'NONE ALGORITHM — NO SIGNATURE', color: 'text-red-400' };
    if (sig === 'UNSIGNED') return { label: 'MISSING SIGNATURE', color: 'text-red-400' };
    return { label: 'Signature present (cannot verify without public key)', color: 'text-amber-400' };
  };

  const addFinding = () => {
    setFindings((prev) => [...prev, { claim: '', issue: '', fix: '' }]);
  };

  const updateFinding = (idx: number, field: keyof FindingEntry, val: string) => {
    setFindings((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, [field]: val } : f))
    );
  };

  const removeFinding = (idx: number) => {
    setFindings((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!header || !payload) return;
    onSubmit({
      token,
      header,
      payload,
      findings: mode === 'audit' ? findings.filter((f) => f.claim.trim()) : undefined,
    });
  };

  const sig2 = sigStatus();

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Token input */}
      <div>
        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
          {mode === 'decode' ? 'Paste JWT Token' : 'Inspect Token'}
        </div>
        <textarea
          value={token}
          onChange={(e) => mode === 'decode' ? setToken(e.target.value) : undefined}
          readOnly={mode === 'audit'}
          rows={3}
          className={`w-full rounded px-3 py-2 font-mono text-xs border focus:outline-none focus:ring-1 focus:ring-orange-500 break-all ${
            mode === 'audit'
              ? 'bg-slate-900 border-slate-700 text-slate-400 cursor-default'
              : 'bg-slate-800 border-slate-600 text-cyan-200'
          }`}
        />
      </div>

      {/* Three-panel decoded view */}
      {token && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Header */}
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <div className="text-xs font-semibold text-sky-400 mb-1">Header</div>
            <pre className="text-xs text-sky-200 font-mono whitespace-pre-wrap break-all">
              {header ? JSON.stringify(header, null, 2) : <span className="text-red-400">Invalid</span>}
            </pre>
            {alg === 'none' && (
              <div className="mt-2 text-xs text-red-400 font-semibold">
                ⚠ alg=none — unsigned token
              </div>
            )}
          </div>

          {/* Payload */}
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <div className="text-xs font-semibold text-lime-400 mb-1">Payload</div>
            <pre className="text-xs text-lime-200 font-mono whitespace-pre-wrap break-all">
              {payload
                ? JSON.stringify(
                    {
                      ...payload,
                      ...(exp !== undefined ? { _exp_human: formatExpiry(exp) } : {}),
                    },
                    null,
                    2
                  )
                : <span className="text-red-400">Invalid</span>}
            </pre>
          </div>

          {/* Signature */}
          <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
            <div className="text-xs font-semibold text-slate-400 mb-1">Signature</div>
            <div className={`text-xs font-mono ${sig2.color}`}>{sig2.label}</div>
            {alg && alg !== 'none' && (
              <div className="mt-2 text-xs text-slate-500">Algorithm: {alg}</div>
            )}
            {exp !== undefined && (
              <div className="mt-2">
                <div className="text-xs text-slate-400">Expiry:</div>
                <div className={`text-xs font-mono ${new Date(exp * 1000) < new Date() ? 'text-red-400' : 'text-lime-400'}`}>
                  {formatExpiry(exp)}
                </div>
              </div>
            )}
            {aud && (
              <div className="mt-2">
                <div className="text-xs text-slate-400">Audience:</div>
                <div className="text-xs font-mono text-amber-300">{String(aud)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit mode: findings panel */}
      {mode === 'audit' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Findings
            </div>
            <button
              type="button"
              onClick={addFinding}
              className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              + Add finding
            </button>
          </div>
          <div className="space-y-3">
            {findings.map((f, idx) => (
              <div key={idx} className="rounded border border-slate-700 bg-slate-900/60 p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-400 font-mono">Finding {idx + 1}</span>
                  {findings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFinding(idx)}
                      className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    value={f.claim}
                    onChange={(e) => updateFinding(idx, 'claim', e.target.value)}
                    placeholder="Claim (e.g. alg, exp, aud)"
                    className="w-full rounded px-2 py-1 bg-slate-800 border border-slate-600 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <input
                    value={f.issue}
                    onChange={(e) => updateFinding(idx, 'issue', e.target.value)}
                    placeholder="Issue — what's wrong with this claim?"
                    className="w-full rounded px-2 py-1 bg-slate-800 border border-slate-600 text-white text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <input
                    value={f.fix}
                    onChange={(e) => updateFinding(idx, 'fix', e.target.value)}
                    placeholder="Fix — what should it be?"
                    className="w-full rounded px-2 py-1 bg-slate-800 border border-slate-600 text-white text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !token}
        className="w-full rounded-lg bg-orange-500 hover:bg-orange-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2.5 text-sm transition-colors flex items-center justify-center gap-2 mt-auto"
      >
        {loading ? (
          <>
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Checking…
          </>
        ) : (
          'Check Answer'
        )}
      </button>
    </div>
  );
}
