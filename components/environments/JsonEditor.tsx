'use client';

import { useState } from 'react';

interface JsonEditorProps {
  template: string;
  onSubmit: (value: string) => void;
  loading?: boolean;
}

export function JsonEditor({ template, onSubmit, loading = false }: JsonEditorProps) {
  const [value, setValue] = useState(template);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleChange = (val: string) => {
    setValue(val);
    try {
      JSON.parse(val);
      setParseError(null);
    } catch (e) {
      setParseError((e as Error).message);
    }
  };

  const handleSubmit = () => {
    try {
      JSON.parse(value);
      setParseError(null);
      onSubmit(value);
    } catch (e) {
      setParseError((e as Error).message);
    }
  };

  const lineCount = value.split('\n').length;

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
        JSON Editor
      </div>

      {/* Editor area */}
      <div className="flex-1 relative mb-3">
        <div className="absolute left-0 top-0 bottom-0 w-10 bg-slate-900 border-r border-slate-700 rounded-tl rounded-bl overflow-hidden select-none">
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className="text-right pr-2 text-slate-600 text-xs font-mono leading-[1.625rem]"
            >
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          spellCheck={false}
          className="w-full h-full min-h-[280px] pl-12 pr-3 py-2 bg-slate-900 border border-slate-700 rounded font-mono text-sm text-cyan-200 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none leading-[1.625rem]"
        />
      </div>

      {/* Parse error */}
      {parseError && (
        <div className="mb-3 rounded px-3 py-2 bg-red-900/30 border border-red-700 text-red-300 text-xs font-mono">
          JSON error: {parseError}
        </div>
      )}

      {/* Highlight TODOs */}
      {value.includes('"__FILL_IN__"') && (
        <div className="mb-3 rounded px-3 py-2 bg-amber-900/20 border border-amber-700 text-amber-300 text-xs">
          Replace all <code className="bg-amber-900/40 px-1 rounded">"__FILL_IN__"</code> values before submitting.
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !!parseError}
        className="w-full rounded-lg bg-orange-500 hover:bg-orange-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
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
