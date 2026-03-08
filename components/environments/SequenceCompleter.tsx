'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Step {
  id: string;
  label: string;
}

interface SequenceCompleterProps {
  steps: Step[];
  correctOrder: string[];
  onSubmit: (order: string[]) => void;
  loading?: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function SortableItem({
  step,
  index,
  locked,
  correct,
}: {
  step: Step;
  index: number;
  locked: boolean;
  correct?: boolean | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id, disabled: locked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  let borderClass = 'border-slate-700';
  if (locked && correct === true) borderClass = 'border-lime-500';
  else if (locked && correct === false) borderClass = 'border-red-500';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(locked ? {} : { ...attributes, ...listeners })}
      className={`flex items-center gap-3 rounded border ${borderClass} bg-slate-800/70 px-3 py-2.5 text-sm select-none cursor-${locked ? 'default' : 'grab'} ${isDragging ? 'opacity-80 shadow-lg ring-1 ring-orange-500' : ''} transition-colors`}
    >
      <span className="text-slate-500 text-xs font-mono w-5 text-right">{index + 1}.</span>
      {!locked && (
        <span className="text-slate-600 text-xs">⠿</span>
      )}
      {locked && correct === true && (
        <span className="text-lime-400 text-xs">✓</span>
      )}
      {locked && correct === false && (
        <span className="text-red-400 text-xs">✗</span>
      )}
      <span className="text-slate-200 flex-1">{step.label}</span>
    </div>
  );
}

export function SequenceCompleter({
  steps,
  correctOrder,
  onSubmit,
  loading = false,
}: SequenceCompleterProps) {
  const [items, setItems] = useState<Step[]>([]);
  const [locked, setLocked] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setItems(shuffleArray(steps));
    setLocked(false);
    setSubmitted(false);
  }, [steps]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = () => {
    setLocked(true);
    setSubmitted(true);
    onSubmit(items.map((s) => s.id));
  };

  const getCorrect = (step: Step, index: number): boolean | null => {
    if (!submitted) return null;
    return correctOrder[index] === step.id;
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
        Drag to reorder
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 flex-1">
            {items.map((step, idx) => (
              <SortableItem
                key={step.id}
                step={step}
                index={idx}
                locked={locked}
                correct={locked ? getCorrect(step, idx) : null}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {submitted && !locked && null}

      {submitted && locked && (
        <div className="text-xs text-slate-400 italic">
          Order locked. See Eli&#39;s feedback below.
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || locked}
        className="w-full rounded-lg bg-orange-500 hover:bg-orange-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2.5 text-sm transition-colors flex items-center justify-center gap-2 mt-auto"
      >
        {loading ? (
          <>
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Checking…
          </>
        ) : locked ? (
          'Submitted'
        ) : (
          'Check Answer'
        )}
      </button>
    </div>
  );
}
