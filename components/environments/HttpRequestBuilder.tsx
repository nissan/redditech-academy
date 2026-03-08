'use client';

import { useState, useEffect } from 'react';

interface HttpRequestBuilderProps {
  method?: 'GET' | 'POST';
  endpoint?: string;
  prefilled?: Record<string, string>;
  prefilledBody?: Record<string, string>;
  prefilledHeaders?: Record<string, string>;
  userFields?: string[];
  onSubmit: (data: {
    method: string;
    endpoint: string;
    params: Record<string, string>;
    body: Record<string, string>;
    headers: Record<string, string>;
  }) => void;
  loading?: boolean;
}

interface KVRow {
  key: string;
  value: string;
  locked: boolean;
}

export function HttpRequestBuilder({
  method: initMethod = 'GET',
  endpoint: initEndpoint = '',
  prefilled = {},
  prefilledBody = {},
  prefilledHeaders = {},
  userFields = [],
  onSubmit,
  loading = false,
}: HttpRequestBuilderProps) {
  const [method, setMethod] = useState<'GET' | 'POST'>(initMethod);
  const [endpoint, setEndpoint] = useState(initEndpoint);

  const buildInitialRows = (
    locked: Record<string, string>,
    extraFields: string[]
  ): KVRow[] => {
    const rows: KVRow[] = Object.entries(locked).map(([key, value]) => ({
      key,
      value,
      locked: true,
    }));
    extraFields.forEach((f) => rows.push({ key: f, value: '', locked: false }));
    return rows;
  };

  const [paramRows, setParamRows] = useState<KVRow[]>(() =>
    buildInitialRows(prefilled, userFields)
  );
  const [bodyRows, setBodyRows] = useState<KVRow[]>(() =>
    buildInitialRows(prefilledBody, [])
  );
  const [headerRows, setHeaderRows] = useState<KVRow[]>(() =>
    buildInitialRows(prefilledHeaders, [])
  );

  // Re-init when props change
  useEffect(() => {
    setMethod(initMethod);
    setEndpoint(initEndpoint);
    setParamRows(buildInitialRows(prefilled, userFields));
    setBodyRows(buildInitialRows(prefilledBody, []));
    setHeaderRows(buildInitialRows(prefilledHeaders, []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initMethod, initEndpoint]);

  const addRow = (setter: React.Dispatch<React.SetStateAction<KVRow[]>>) => {
    setter((prev) => [...prev, { key: '', value: '', locked: false }]);
  };

  const updateRow = (
    setter: React.Dispatch<React.SetStateAction<KVRow[]>>,
    idx: number,
    field: 'key' | 'value',
    val: string
  ) => {
    setter((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r))
    );
  };

  const removeRow = (
    setter: React.Dispatch<React.SetStateAction<KVRow[]>>,
    idx: number
  ) => {
    setter((prev) => prev.filter((_, i) => i !== idx || prev[i].locked));
  };

  const rowsToRecord = (rows: KVRow[]): Record<string, string> => {
    const rec: Record<string, string> = {};
    rows.forEach(({ key, value }) => {
      if (key.trim()) rec[key.trim()] = value;
    });
    return rec;
  };

  const buildPreview = () => {
    const params = rowsToRecord(paramRows);
    const qs = Object.entries(params)
      .filter(([k]) => k)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (method === 'GET') {
      return qs ? `${endpoint}?${qs}` : endpoint;
    }
    const body = rowsToRecord(bodyRows);
    const bodyStr = Object.entries(body)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    return `POST ${endpoint}\n\n${bodyStr}`;
  };

  const handleSubmit = () => {
    onSubmit({
      method,
      endpoint,
      params: rowsToRecord(paramRows),
      body: rowsToRecord(bodyRows),
      headers: rowsToRecord(headerRows),
    });
  };

  const renderRows = (
    rows: KVRow[],
    setter: React.Dispatch<React.SetStateAction<KVRow[]>>,
    label: string
  ) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{label}</span>
        <button
          type="button"
          onClick={() => addRow(setter)}
          className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
        >
          + Add row
        </button>
      </div>
      <div className="space-y-1">
        {rows.map((row, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input
              value={row.key}
              onChange={(e) => updateRow(setter, idx, 'key', e.target.value)}
              disabled={row.locked}
              placeholder="key"
              className={`flex-1 rounded px-2 py-1 text-sm font-mono border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                row.locked
                  ? 'bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-800 border-slate-600 text-white'
              }`}
            />
            <span className="text-slate-500 text-xs">=</span>
            <input
              value={row.value}
              onChange={(e) => updateRow(setter, idx, 'value', e.target.value)}
              disabled={row.locked}
              placeholder={row.locked ? '(pre-filled)' : 'value'}
              className={`flex-1 rounded px-2 py-1 text-sm font-mono border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                row.locked
                  ? 'bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-800 border-slate-600 text-orange-200'
              }`}
            />
            {!row.locked && (
              <button
                type="button"
                onClick={() => removeRow(setter, idx)}
                className="text-slate-500 hover:text-red-400 text-xs transition-colors px-1"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Method + Endpoint */}
      <div className="flex gap-2 mb-4">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as 'GET' | 'POST')}
          className="rounded px-2 py-1.5 bg-slate-700 border border-slate-600 text-orange-300 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
        </select>
        <input
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="https://..."
          className="flex-1 rounded px-3 py-1.5 bg-slate-800 border border-slate-600 text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      </div>

      {/* Headers */}
      {headerRows.length > 0 && renderRows(headerRows, setHeaderRows, 'Headers')}

      {/* Params / Body */}
      {method === 'GET'
        ? renderRows(paramRows, setParamRows, 'Query Parameters')
        : renderRows(bodyRows, setBodyRows, 'Request Body')}

      {/* When GET also allow adding extra query params */}
      {method === 'GET' && userFields.length === 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => addRow(setParamRows)}
            className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
          >
            + Add parameter
          </button>
        </div>
      )}

      {/* URL / Body Preview */}
      <div className="mb-4">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
          {method === 'GET' ? 'Constructed URL' : 'Request Preview'}
        </div>
        <pre className="bg-slate-900 border border-slate-700 rounded p-3 text-xs text-cyan-300 font-mono whitespace-pre-wrap break-all overflow-x-auto">
          {buildPreview() || <span className="text-slate-500">Fill in the fields above…</span>}
        </pre>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
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
