"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { ColumnDef, SchemaTemplate } from "@/lib/types";
import SchemaEditor from "@/components/schema-editor";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<SchemaTemplate[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColumns, setNewColumns] = useState<ColumnDef[]>([]);
  const [showForm, setShowForm] = useState(false);

  const load = () => api.listTemplates().then(setTemplates);

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newName || newColumns.length === 0) return;
    await api.createTemplate({ name: newName, description: newDesc, columns: newColumns });
    setNewName("");
    setNewDesc("");
    setNewColumns([]);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await api.deleteTemplate(id);
    load();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Schema Templates</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ New Template"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Template Name</label>
              <input
                type="text"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
          </div>
          <SchemaEditor columns={newColumns} onChange={setNewColumns} />
          <button
            onClick={handleCreate}
            disabled={!newName || newColumns.length === 0}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Save Template
          </button>
        </div>
      )}

      {templates.length === 0 && !showForm ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No templates yet. Create one to reuse column definitions across jobs.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <div key={t.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium">{t.name}</span>
                  {t.description && (
                    <span className="ml-2 text-sm text-gray-500">{t.description}</span>
                  )}
                </div>
                <button onClick={() => handleDelete(t.id)} className="text-xs text-red-500 hover:underline">
                  Delete
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {t.columns.map((c, i) => (
                  <span key={i} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {c.name} <span className="text-gray-400">({c.column_type})</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
