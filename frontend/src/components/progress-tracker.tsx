"use client";

import type { SourceItem } from "@/lib/types";
import { cn, statusColor } from "@/lib/utils";

interface Props {
  sources: SourceItem[];
}

export default function ProgressTracker({ sources }: Props) {
  const completed = sources.filter((s) => s.status === "completed").length;
  const failed = sources.filter((s) => s.status === "failed").length;
  const total = sources.length;
  const pct = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">Progress</span>
          <span className="text-gray-500">
            {completed} completed, {failed} failed / {total} total ({pct}%)
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto rounded-lg border bg-white">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-50">
            <tr className="text-left text-gray-500 uppercase tracking-wider">
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Rows</th>
              <th className="px-3 py-2">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sources.map((s) => (
              <tr key={s.id}>
                <td className="px-3 py-2 max-w-xs truncate" title={s.label}>
                  {s.label}
                </td>
                <td className="px-3 py-2">
                  <span className={cn("rounded-full px-2 py-0.5 font-medium", statusColor(s.status))}>
                    {s.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-600">{s.extracted_rows.length}</td>
                <td className="px-3 py-2 text-red-500 max-w-xs truncate" title={s.error || ""}>
                  {s.error || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
