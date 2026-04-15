const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers as Record<string, string>) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => request<{ status: string }>("/health"),

  // Auth
  authStatus: () => request<{ requires_pin: boolean }>("/auth/status"),
  login: (pin: string) => request<{ ok: boolean; token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ pin }) }),

  // Jobs
  listJobs: () => request<JobSummaryDTO[]>("/jobs"),
  createJob: (data: CreateJobDTO) => request<{ id: string; status: string }>("/jobs", { method: "POST", body: JSON.stringify(data) }),
  getJob: (id: string) => request<JobDTO>(`/jobs/${id}`),
  deleteJob: (id: string) => request<{ ok: boolean }>(`/jobs/${id}`, { method: "DELETE" }),
  startJob: (id: string) => request<{ status: string }>(`/jobs/${id}/run`, { method: "POST" }),
  pauseJob: (id: string) => request<{ status: string }>(`/jobs/${id}/pause`, { method: "POST" }),
  resumeJob: (id: string) => request<{ status: string }>(`/jobs/${id}/resume`, { method: "POST" }),
  retryFailed: (id: string) => request<{ status: string }>(`/jobs/${id}/retry-failed`, { method: "POST" }),
  resolveSources: (id: string) => request<{ count: number; sources: unknown[] }>(`/jobs/${id}/resolve-sources`, { method: "POST" }),
  getJobData: (id: string) => request<{ rows: Record<string, unknown>[]; total: number }>(`/jobs/${id}/data`),
  suggestSchema: (data: { url?: string; content?: string }) =>
    request<{ columns: ColumnDefDTO[] }>("/jobs/suggest-schema", { method: "POST", body: JSON.stringify(data) }),

  // Export (returns URL to download)
  exportUrl: (id: string, format: "csv" | "xlsx" | "html" | "pdf") => `${BASE}/export/${id}/${format}`,

  // Settings
  getSettings: () => request<Record<string, unknown>>("/settings"),
  updateProvider: (data: { provider: string; api_key: string; base_url?: string; default_model?: string }) =>
    request<{ ok: boolean }>("/settings/provider", { method: "PUT", body: JSON.stringify(data) }),
  updateGeneral: (data: Record<string, unknown>) =>
    request<{ ok: boolean }>("/settings/general", { method: "PUT", body: JSON.stringify(data) }),
  updateBrowser: (data: Record<string, unknown>) =>
    request<{ ok: boolean }>("/settings/browser", { method: "PUT", body: JSON.stringify(data) }),
  updatePin: (pin: string | null) =>
    request<{ ok: boolean }>("/settings/pin", { method: "PUT", body: JSON.stringify({ pin }) }),

  // Templates
  listTemplates: () => request<TemplateDTO[]>("/templates"),
  createTemplate: (data: { name: string; description?: string; columns: ColumnDefDTO[] }) =>
    request<TemplateDTO>("/templates", { method: "POST", body: JSON.stringify(data) }),
  deleteTemplate: (id: string) => request<{ ok: boolean }>(`/templates/${id}`, { method: "DELETE" }),

  // Upload
  uploadFile: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE}/upload-file`, { method: "POST", body: form, credentials: "include" });
    if (!res.ok) throw new Error("Upload failed");
    return res.json() as Promise<{ path: string; filename: string; size: number }>;
  },
};

// Lightweight DTO type aliases to avoid importing from types.ts everywhere
type JobSummaryDTO = import("./types").JobSummary;
type JobDTO = import("./types").Job;
type CreateJobDTO = {
  name: string;
  source_config: import("./types").SourceConfig;
  columns: ColumnDefDTO[];
  config?: import("./types").JobConfig;
};
type ColumnDefDTO = import("./types").ColumnDef;
type TemplateDTO = import("./types").SchemaTemplate;
