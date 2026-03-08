'use client';

interface MissionHeaderProps {
  missionTitle: string;
  currentStep: number;
  totalSteps: number;
  passed?: boolean;
}

export function MissionHeader({
  missionTitle,
  currentStep,
  totalSteps,
  passed = false,
}: MissionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-bold tracking-widest text-orange-400 uppercase">
            Mission {currentStep} / {totalSteps}
          </span>
          {passed && (
            <span className="text-xs font-mono text-lime-400 border border-lime-700 rounded px-1.5 py-0.5">
              ✓ Complete
            </span>
          )}
        </div>
        <h2 className="font-fraunces text-lg font-bold text-white leading-snug">
          {missionTitle}
        </h2>
      </div>
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
        <span className="text-orange-400 text-lg">🔑</span>
      </div>
    </div>
  );
}
