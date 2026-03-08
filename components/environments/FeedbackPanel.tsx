'use client';

interface FeedbackPanelProps {
  pass: boolean;
  score: number;
  feedback: string;
}

export function FeedbackPanel({ pass, score, feedback }: FeedbackPanelProps) {
  return (
    <div
      className={`rounded-lg border p-4 mt-4 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        pass
          ? 'border-lime-600/50 bg-lime-900/10 shadow-[0_0_16px_0_rgba(163,230,53,0.08)]'
          : 'border-red-700/50 bg-red-900/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {pass ? (
            <span className="text-lime-400 text-lg">✓</span>
          ) : (
            <span className="text-red-400 text-lg">✗</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`text-sm font-semibold ${
                pass ? 'text-lime-400' : 'text-red-400'
              }`}
            >
              {pass ? 'Mission complete' : 'Not quite'}
            </span>
            <span className="text-xs font-mono text-slate-500">
              score: {(score * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {feedback}
          </p>
        </div>
      </div>
    </div>
  );
}
