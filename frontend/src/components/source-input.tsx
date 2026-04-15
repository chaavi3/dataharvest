"use client";

import { useState } from "react";
import type { SourceConfig, SourceType } from "@/lib/types";

const SOURCE_TYPES: { value: SourceType; label: string; description: string }[] = [
  { value: "single_url", label: "Single URL", description: "Scrape one web page" },
  { value: "url_list", label: "List of URLs", description: "Scrape multiple URLs" },
  { value: "webpage_with_links", label: "Page with Links", description: "Discover and scrape links from a hub page" },
  { value: "search_keywords", label: "Search Keywords", description: "Search the web and scrape results" },
  { value: "single_document", label: "Upload Document", description: "Upload a single file to extract data from" },
  { value: "bulk_documents", label: "Upload Multiple Docs", description: "Upload multiple files" },
  { value: "gdrive_link", label: "Google Drive Link", description: "Extract from a shared GDrive folder/file" },
  { value: "prompt_guided", label: "Guided Navigation", description: "Give instructions to navigate to the data" },
];

interface Props {
  value: SourceConfig;
  onChange: (config: SourceConfig) => void;
}

export default function SourceInput({ value, onChange }: Props) {
  const [urlText, setUrlText] = useState(value.urls.join("\n"));

  const update = (partial: Partial<SourceConfig>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Source Type</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SOURCE_TYPES.map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => update({ source_type: st.value })}
              className={`rounded-lg border p-3 text-left text-sm transition ${
                value.source_type === st.value
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-medium">{st.label}</div>
              <div className="mt-1 text-xs text-gray-500">{st.description}</div>
            </button>
          ))}
        </div>
      </div>

      {(value.source_type === "single_url" || value.source_type === "prompt_guided") && (
        <div>
          <label className="block text-sm font-medium mb-1">URL</label>
          <input
            type="url"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="https://example.com/data-page"
            value={value.urls[0] || ""}
            onChange={(e) => update({ urls: [e.target.value] })}
          />
        </div>
      )}

      {value.source_type === "prompt_guided" && (
        <div>
          <label className="block text-sm font-medium mb-1">Navigation Instructions</label>
          <textarea
            className="w-full rounded-lg border px-3 py-2 text-sm"
            rows={3}
            placeholder='e.g., "Click the Full Scorecard link, then find the batting table"'
            value={value.navigation_prompt || ""}
            onChange={(e) => update({ navigation_prompt: e.target.value })}
          />
        </div>
      )}

      {value.source_type === "url_list" && (
        <div>
          <label className="block text-sm font-medium mb-1">URLs (one per line)</label>
          <textarea
            className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
            rows={6}
            placeholder={"https://example.com/page1\nhttps://example.com/page2"}
            value={urlText}
            onChange={(e) => {
              setUrlText(e.target.value);
              update({ urls: e.target.value.split("\n").map((u) => u.trim()).filter(Boolean) });
            }}
          />
        </div>
      )}

      {value.source_type === "webpage_with_links" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Hub Page URL</label>
            <input
              type="url"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="https://example.com/directory"
              value={value.hub_url || ""}
              onChange={(e) => update({ hub_url: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link Pattern (regex, optional)</label>
            <input
              type="text"
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
              placeholder="/articles/\\d+"
              value={value.link_pattern || ""}
              onChange={(e) => update({ link_pattern: e.target.value })}
            />
          </div>
        </>
      )}

      {value.source_type === "search_keywords" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Keywords</label>
            <input
              type="text"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="IPL 2025 player statistics"
              value={value.keywords || ""}
              onChange={(e) => update({ keywords: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Number of results</label>
            <input
              type="number"
              className="w-32 rounded-lg border px-3 py-2 text-sm"
              min={1}
              max={100}
              value={value.search_result_count || 10}
              onChange={(e) => update({ search_result_count: Number(e.target.value) })}
            />
          </div>
        </>
      )}

      {value.source_type === "gdrive_link" && (
        <div>
          <label className="block text-sm font-medium mb-1">Google Drive URL</label>
          <input
            type="url"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="https://drive.google.com/drive/folders/..."
            value={value.gdrive_url || ""}
            onChange={(e) => update({ gdrive_url: e.target.value })}
          />
        </div>
      )}

      {(value.source_type === "single_document" || value.source_type === "bulk_documents") && (
        <div>
          <label className="block text-sm font-medium mb-1">Upload Files</label>
          <input
            type="file"
            multiple={value.source_type === "bulk_documents"}
            className="text-sm"
            accept=".pdf,.docx,.xlsx,.xls,.txt,.html,.htm,.md,.csv"
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              const { api } = await import("@/lib/api-client");
              const paths: string[] = [];
              for (const f of files) {
                const res = await api.uploadFile(f);
                paths.push(res.path);
              }
              update({ uploaded_files: [...value.uploaded_files, ...paths] });
            }}
          />
          {value.uploaded_files.length > 0 && (
            <ul className="mt-2 text-xs text-gray-600 space-y-1">
              {value.uploaded_files.map((f, i) => (
                <li key={i}>{f.split(/[/\\]/).pop()}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
