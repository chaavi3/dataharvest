"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { Job } from "@/lib/types";
import { cn, formatDate, statusColor } from "@/lib/utils";
import DataPreview from "@/components/data-preview";
import ExportButtons from "@/components/export-buttons";
import ProgressTracker from "@/components/progress-tracker";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");

  const fetchJob = async () => {
    try {
      const j = await api.getJob(id);
      setJob(j as Job);
      const data = await api.getJobData(id);
      setRows(data.rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load job");
    }
  };

  useEffect(() => {
    fetchJob();
    const interval = setInterval(fetchJob, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const handlePause = async () => {
    await api.pauseJob(id);
    fetchJob();
  };

  const handleResume = async () => {
    await api.resumeJob(id);
    fetchJob();
  };

  const handleRetry = async () => {
    await api.retryFailed(id);
    fetchJob();
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!job) {
    return <p className="text-gray-500">Loading...</p>;
  }

  const isActive = job.status === "running" || job.status === "resolving";
  const hasFailures = job.sources.some((s) => s.status === "failed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-1">{job.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("rounded-full px-3 py-1 text-sm font-medium", statusColor(job.status))}>
            {job.status}
          </span>
          {isActive && (
            <button
              onClick={handlePause}
              className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-sm font-medium text-yellow-700 hover:bg-yellow-100"
            >
              Pause
            </button>
          )}
          {job.status === "paused" && (
            <button
              onClick={handleResume}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Resume
            </button>
          )}
          {hasFailures && !isActive && (
            <button
              onClick={handleRetry}
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Retry Failed
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-gray-500">Sources</div>
          <div className="text-2xl font-bold">{job.sources.length}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-gray-500">Rows Extracted</div>
          <div className="text-2xl font-bold">{job.total_rows}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-gray-500">Created</div>
          <div className="text-sm font-medium">{formatDate(job.created_at)}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-gray-500">Last Updated</div>
          <div className="text-sm font-medium">{formatDate(job.updated_at)}</div>
        </div>
      </div>

      {job.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {job.error}
        </div>
      )}

      {job.sources.length > 0 && <ProgressTracker sources={job.sources} />}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Extracted Data</h2>
          <ExportButtons jobId={job.id} disabled={rows.length === 0} />
        </div>
        <DataPreview columns={job.columns} rows={rows} />
      </div>
    </div>
  );
}
