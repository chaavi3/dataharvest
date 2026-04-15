"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { JobSummary } from "@/lib/types";
import { cn, formatDate, statusColor } from "@/lib/utils";

export default function Dashboard() {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listJobs().then(setJobs).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job?")) return;
    await api.deleteJob(id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <Link
          href="/jobs/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Job
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 mb-4">No jobs yet</p>
          <Link href="/jobs/new" className="text-blue-600 hover:underline">
            Create your first job
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source Type</th>
                <th className="px-4 py-3">Sources</th>
                <th className="px-4 py-3">Rows</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/jobs/${job.id}`} className="text-blue-600 hover:underline">
                      {job.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColor(job.status))}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{job.source_type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {job.completed_sources}/{job.total_sources}
                    {job.failed_sources > 0 && (
                      <span className="ml-1 text-red-500">({job.failed_sources} failed)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{job.total_rows}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(job.created_at)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(job.id)} className="text-xs text-red-500 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
