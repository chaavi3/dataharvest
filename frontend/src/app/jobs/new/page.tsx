"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api-client";
import type { ColumnDef, JobConfig, SourceConfig } from "@/lib/types";
import DataPreview from "@/components/data-preview";
import SchemaEditor from "@/components/schema-editor";
import SourceInput from "@/components/source-input";

const STEPS = ["Source", "Schema", "Preview", "Configure", "Run"];

const DEFAULT_SOURCE: SourceConfig = {
  source_type: "single_url",
  urls: [],
  uploaded_files: [],
};

const DEFAULT_CONFIG: JobConfig = {
  llm_provider: "openai",
  llm_model: "gpt-4o-mini",
  concurrency: 1,
  rate_limit_rpm: 30,
  retry_max: 3,
};

export default function NewJobPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [source, setSource] = useState<SourceConfig>(DEFAULT_SOURCE);
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [config, setConfig] = useState<JobConfig>(DEFAULT_CONFIG);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAutoSuggest = async () => {
    setSuggesting(true);
    try {
      const url = source.urls[0] || source.hub_url || "";
      const res = await api.suggestSchema({ url });
      if (res.columns.length > 0) {
        setColumns(
          res.columns.map((c) => ({
            name: c.name || "",
            description: c.description || "",
            column_type: c.column_type || "text",
            required: c.required ?? false,
          }))
        );
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Auto-suggest failed");
    } finally {
      setSuggesting(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.createJob({ name: name || "Preview", source_config: source, columns, config });
      await api.resolveSources(res.id);
      await api.startJob(res.id);
      // Poll for a bit
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const job = await api.getJob(res.id);
        const data = await api.getJobData(res.id);
        if (data.rows.length > 0 || job.status === "completed" || job.status === "failed") {
          setPreviewRows(data.rows);
          await api.pauseJob(res.id).catch(() => {});
          await api.deleteJob(res.id);
          break;
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.createJob({ name, source_config: source, columns, config });
      await api.startJob(res.id);
      router.push(`/jobs/${res.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create job");
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Job</h1>

      {/* Step indicator */}
      <div className="flex gap-1 mb-8">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              i === step
                ? "bg-blue-600 text-white"
                : i < step
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-white p-6">
        {/* Step 0: Source */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Job Name</label>
              <input
                type="text"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="My scraping job"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <SourceInput value={source} onChange={setSource} />
          </div>
        )}

        {/* Step 1: Schema */}
        {step === 1 && (
          <SchemaEditor
            columns={columns}
            onChange={setColumns}
            onAutoSuggest={handleAutoSuggest}
            suggesting={suggesting}
          />
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePreview}
                disabled={loading || columns.length === 0}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? "Running preview..." : "Run Preview"}
              </button>
              <span className="text-xs text-gray-500">
                Extracts data from the first source to verify your schema
              </span>
            </div>
            <DataPreview columns={columns} rows={previewRows} />
          </div>
        )}

        {/* Step 3: Configure */}
        {step === 3 && (
          <div className="grid gap-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium mb-1">LLM Provider</label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={config.llm_provider}
                onChange={(e) => setConfig({ ...config, llm_provider: e.target.value })}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Google Gemini</option>
                <option value="ollama">Ollama (Local)</option>
                <option value="openai_compat">OpenAI-Compatible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <input
                type="text"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={config.llm_model}
                onChange={(e) => setConfig({ ...config, llm_model: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Concurrency</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={config.concurrency}
                  onChange={(e) => setConfig({ ...config, concurrency: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rate (req/min)</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={config.rate_limit_rpm}
                  onChange={(e) => setConfig({ ...config, rate_limit_rpm: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Retries</label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={config.retry_max}
                  onChange={(e) => setConfig({ ...config, retry_max: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Run */}
        {step === 4 && (
          <div className="space-y-4 text-center py-8">
            <h2 className="text-lg font-semibold">Ready to run</h2>
            <p className="text-sm text-gray-600">
              Job &quot;{name || "Untitled"}&quot; &middot; {columns.length} columns &middot;{" "}
              {source.source_type.replace(/_/g, " ")}
            </p>
            <button
              onClick={handleCreate}
              disabled={loading || columns.length === 0}
              className="rounded-lg bg-green-600 px-8 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create & Start Job"}
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
        >
          ← Back
        </button>
        {step < 4 && (
          <button
            onClick={() => setStep(step + 1)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
