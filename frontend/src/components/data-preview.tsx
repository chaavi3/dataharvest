"use client";

import { useState } from "react";
import type { ColumnDef } from "@/lib/types";

interface Props {
  columns: ColumnDef[];
  rows: Record<string, unknown>[];
}

export default function DataPreview({ columns, rows }: Props) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = search
    ? rows.filter((r) =>
        Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
      )
    : rows;

  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const av = String(a[sortCol] ?? "");
        const bv = String(b[sortCol] ?? "");
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : filtered;

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">No data extracted yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{rows.length} rows</span>
        <input
          type="text"
          placeholder="Search..."
          className="rounded-lg border px-3 py-1.5 text-sm w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              {columns.map((c) => (
                <th
                  key={c.name}
                  className="px-3 py-2 cursor-pointer select-none hover:text-gray-700"
                  onClick={() => handleSort(c.name)}
                >
                  {c.name}
                  {sortCol === c.name && (sortDir === "asc" ? " ↑" : " ↓")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.slice(0, 200).map((row, ri) => (
              <tr key={ri} className="hover:bg-gray-50">
                {columns.map((c) => (
                  <td key={c.name} className="px-3 py-2 max-w-xs truncate" title={String(row[c.name] ?? "")}>
                    {String(row[c.name] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length > 200 && (
          <p className="px-3 py-2 text-xs text-gray-500">
            Showing first 200 of {sorted.length} rows
          </p>
        )}
      </div>
    </div>
  );
}
