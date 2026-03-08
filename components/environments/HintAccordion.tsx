'use client';

interface HintAccordionProps {
  hints: string[];
  revealed: number; // 0 = none, 1 = first, etc.
}

export function HintAccordion({ hints, revealed }: HintAccordionProps) {
  if (!hints.length) return null;

  return (
    <div className="mt-4">
      <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
        Hints ({Math.min(revealed, hints.length)} / {hints.length} unlocked)
      </div>
      <div className="space-y-2">
        {hints.map((hint, idx) => {
          const unlocked = idx < revealed;
          return (
            <div
              key={idx}
              className={`rounded border px-3 py-2.5 text-sm transition-all ${
                unlocked
                  ? 'border-orange-700/50 bg-orange-900/10 text-slate-300'
                  : 'border-slate-800 bg-slate-900/30 text-slate-600 select-none'
              }`}
            >
              <span className="text-xs font-mono text-orange-400 mr-2">
                Hint {idx + 1}
              </span>
              {unlocked ? hint : '● ● ● ● ●'}
            </div>
          );
        })}
      </div>
      {revealed < hints.length && (
        <p className="text-xs text-slate-500 mt-2 italic">
          Next hint unlocks after your next attempt.
        </p>
      )}
    </div>
  );
}
