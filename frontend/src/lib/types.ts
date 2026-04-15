export type SourceType =
  | "single_url"
  | "url_list"
  | "webpage_with_links"
  | "search_keywords"
  | "single_document"
  | "bulk_documents"
  | "gdrive_link"
  | "prompt_guided";

export interface SourceConfig {
  source_type: SourceType;
  urls: string[];
  keywords?: string;
  search_result_count?: number;
  hub_url?: string;
  link_selector?: string;
  link_pattern?: string;
  gdrive_url?: string;
  navigation_prompt?: string;
  uploaded_files: string[];
}

export type ColumnType = "text" | "number" | "date" | "url" | "boolean";

export interface ColumnDef {
  name: string;
  description: string;
  column_type: ColumnType;
  required: boolean;
}

export interface JobConfig {
  llm_provider: string;
  llm_model: string;
  concurrency: number;
  rate_limit_rpm: number;
  retry_max: number;
}

export type JobStatus =
  | "created"
  | "resolving"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type SourceItemStatus = "pending" | "in_progress" | "completed" | "failed";

export interface SourceItem {
  id: string;
  url?: string;
  file_path?: string;
  label: string;
  status: SourceItemStatus;
  error?: string;
  retry_count: number;
  extracted_rows: Record<string, unknown>[];
}

export interface Job {
  id: string;
  name: string;
  status: JobStatus;
  source_config: SourceConfig;
  columns: ColumnDef[];
  config: JobConfig;
  sources: SourceItem[];
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  total_rows: number;
  error?: string;
}

export interface JobSummary {
  id: string;
  name: string;
  status: JobStatus;
  source_type: string;
  total_sources: number;
  completed_sources: number;
  failed_sources: number;
  total_rows: number;
  created_at: string;
  updated_at: string;
}

export interface SchemaTemplate {
  id: string;
  name: string;
  description: string;
  columns: ColumnDef[];
  created_at?: string;
  updated_at?: string;
}
