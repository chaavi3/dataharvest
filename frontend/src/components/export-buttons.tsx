"use client";

import { api } from "@/lib/api-client";

interface Props {
  jobId: string;
  disabled?: boolean;
}

const FORMATS = [
  { key: "csv" as const, label: "CSV", icon: "📄" },
  { key: "xlsx" as const, label: "Excel", icon: "📊" },
  { key: "html" as const, label: "HTML", icon: "🌐" },
  { key: "pdf" as const, label: "PDF", icon: "📕" },
];

export default function ExportButtons({ jobId, disabled }: Props) {
  return (
    <div className="flex gap-2">
      {FORMATS.map((f) => (
        <a
          key={f.key}
          href={disabled ? undefined : api.exportUrl(jobId, f.key)}
          download
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
            disabled
              ? "cursor-not-allowed border-gray-200 text-gray-400"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <span>{f.icon}</span>
          {f.label}
        </a>
      ))}
    </div>
  );
}
