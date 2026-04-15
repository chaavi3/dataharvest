"use client";

import { useState } from "react";
import type { ColumnDef, ColumnType } from "@/lib/types";

const COLUMN_TYPES: ColumnType[] = ["text", "number", "date", "url", "boolean"];

interface Props {
  columns: ColumnDef[];
  onChange: (columns: ColumnDef[]) => void;
  onAutoSuggest?: () => void;
  suggesting?: boolean;
}

export default function SchemaEditor({ columns, onChange, onAutoSuggest, suggesting }: Props) {
  const addColumn = () => {
    onChange([...columns, { name: "", description: "", column_type: "text", required: false }]);
  };

  const removeColumn = (index: number) => {
    onChange(columns.filter((_, i) => i !== index));
  };

  const updateColumn = (index: number, partial: Partial<ColumnDef>) => {
    const next = columns.map((c, i) => (i === index ? { ...c, ...partial } : c));
    onChange(next);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...columns];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const moveDown = (index: number) => {
    if (index === columns.length - 1) return;
    const next = [...columns];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-medium">Columns</h3>
        {onAutoSuggest && (
          <button
            type="button"
            onClick={onAutoSuggest}
            disabled={suggesting}
            className="rounded bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
          >
            {suggesting ? "Analyzing..." : "Auto-suggest columns"}
          </button>
        )}
      </div>

      {columns.length === 0 ? (
        <p className="text-sm text-gray-500">No columns defined. Add one or use auto-suggest.</p>
      ) : (
        <div className="space-y-3">
          {columns.map((col, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border bg-white p-3">
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => moveUp(i)} className="text-xs text-gray-400 hover:text-gray-600">▲</button>
                <button type="button" onClick={() => moveDown(i)} className="text-xs text-gray-400 hover:text-gray-600">▼</button>
              </div>
              <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-4">
                <input
                  type="text"
                  placeholder="Column name"
                  className="rounded border px-2 py-1.5 text-sm"
                  value={col.name}
                  onChange={(e) => updateColumn(i, { name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Description for the AI"
                  className="rounded border px-2 py-1.5 text-sm md:col-span-2"
                  value={col.description}
                  onChange={(e) => updateColumn(i, { description: e.target.value })}
                />
                <div className="flex items-center gap-2">
                  <select
                    className="rounded border px-2 py-1.5 text-sm"
                    value={col.column_type}
                    onChange={(e) => updateColumn(i, { column_type: e.target.value as ColumnType })}
                  >
                    {COLUMN_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={col.required}
                      onChange={(e) => updateColumn(i, { required: e.target.checked })}
                    />
                    Req
                  </label>
                </div>
              </div>
              <button type="button" onClick={() => removeColumn(i)} className="text-red-400 hover:text-red-600 text-sm px-1">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addColumn}
        className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800"
      >
        + Add Column
      </button>
    </div>
  );
}
