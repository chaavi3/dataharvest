"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

const PROVIDERS = [
  { key: "openai", label: "OpenAI", modelHint: "gpt-4o, gpt-4o-mini" },
  { key: "anthropic", label: "Anthropic", modelHint: "claude-sonnet-4-20250514, claude-3-5-haiku-20241022" },
  { key: "gemini", label: "Google Gemini", modelHint: "gemini-2.0-flash, gemini-pro" },
  { key: "ollama", label: "Ollama (Local)", modelHint: "llama3, mistral" },
  { key: "openai_compat", label: "OpenAI-Compatible", modelHint: "Groq, Together, etc." },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [saved, setSaved] = useState(false);
  const [providerKeys, setProviderKeys] = useState<Record<string, { api_key: string; base_url: string; default_model: string }>>({});
  const [general, setGeneral] = useState({ default_provider: "openai", serpapi_key: "", rate_limit_rpm: 30, max_concurrency: 3 });
  const [browser, setBrowser] = useState({ headless: true, user_agent: "", proxy: "" });
  const [pin, setPin] = useState("");

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s);
      const providers = (s.providers || {}) as Record<string, { api_key: string; base_url?: string; default_model?: string }>;
      const keys: Record<string, { api_key: string; base_url: string; default_model: string }> = {};
      for (const [k, v] of Object.entries(providers)) {
        keys[k] = { api_key: v.api_key || "", base_url: v.base_url || "", default_model: v.default_model || "" };
      }
      setProviderKeys(keys);
      setGeneral({
        default_provider: (s.default_provider as string) || "openai",
        serpapi_key: (s.serpapi_key as string) || "",
        rate_limit_rpm: (s.rate_limit_rpm as number) || 30,
        max_concurrency: (s.max_concurrency as number) || 3,
      });
      const br = (s.browser || {}) as Record<string, unknown>;
      setBrowser({
        headless: br.headless !== false,
        user_agent: (br.user_agent as string) || "",
        proxy: (br.proxy as string) || "",
      });
    });
  }, []);

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveProvider = async (key: string) => {
    const pk = providerKeys[key];
    if (!pk) return;
    await api.updateProvider({ provider: key, api_key: pk.api_key, base_url: pk.base_url || undefined, default_model: pk.default_model || undefined });
    flash();
  };

  const saveGeneral = async () => {
    await api.updateGeneral(general);
    flash();
  };

  const saveBrowser = async () => {
    await api.updateBrowser(browser);
    flash();
  };

  const savePin = async () => {
    await api.updatePin(pin || null);
    setPin("");
    flash();
  };

  if (!settings) return <p className="text-gray-500">Loading settings...</p>;

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold">Settings</h1>
      {saved && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          Settings saved.
        </div>
      )}

      {/* Provider API Keys */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">LLM Provider API Keys</h2>
        {PROVIDERS.map((p) => {
          const pk = providerKeys[p.key] || { api_key: "", base_url: "", default_model: "" };
          return (
            <div key={p.key} className="rounded-lg border bg-white p-4 space-y-2">
              <div className="font-medium text-sm">{p.label}</div>
              <div className="grid gap-2 md:grid-cols-3">
                <input
                  type="password"
                  placeholder="API Key"
                  className="rounded border px-3 py-1.5 text-sm"
                  value={pk.api_key}
                  onChange={(e) => setProviderKeys({ ...providerKeys, [p.key]: { ...pk, api_key: e.target.value } })}
                />
                {(p.key === "ollama" || p.key === "openai_compat") && (
                  <input
                    type="text"
                    placeholder="Base URL"
                    className="rounded border px-3 py-1.5 text-sm"
                    value={pk.base_url}
                    onChange={(e) => setProviderKeys({ ...providerKeys, [p.key]: { ...pk, base_url: e.target.value } })}
                  />
                )}
                <input
                  type="text"
                  placeholder={`Model (${p.modelHint})`}
                  className="rounded border px-3 py-1.5 text-sm"
                  value={pk.default_model}
                  onChange={(e) => setProviderKeys({ ...providerKeys, [p.key]: { ...pk, default_model: e.target.value } })}
                />
              </div>
              <button onClick={() => saveProvider(p.key)} className="rounded bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
                Save
              </button>
            </div>
          );
        })}
      </section>

      {/* General */}
      <section className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold">General</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Default Provider</label>
            <select
              className="w-full rounded border px-3 py-1.5 text-sm"
              value={general.default_provider}
              onChange={(e) => setGeneral({ ...general, default_provider: e.target.value })}
            >
              {PROVIDERS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">SerpAPI Key</label>
            <input
              type="password"
              className="w-full rounded border px-3 py-1.5 text-sm"
              value={general.serpapi_key}
              onChange={(e) => setGeneral({ ...general, serpapi_key: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Rate Limit (req/min)</label>
            <input
              type="number"
              className="w-full rounded border px-3 py-1.5 text-sm"
              value={general.rate_limit_rpm}
              onChange={(e) => setGeneral({ ...general, rate_limit_rpm: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Max Concurrency</label>
            <input
              type="number"
              className="w-full rounded border px-3 py-1.5 text-sm"
              value={general.max_concurrency}
              onChange={(e) => setGeneral({ ...general, max_concurrency: Number(e.target.value) })}
            />
          </div>
        </div>
        <button onClick={saveGeneral} className="rounded bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
          Save General Settings
        </button>
      </section>

      {/* Browser */}
      <section className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold">Browser</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={browser.headless}
            onChange={(e) => setBrowser({ ...browser, headless: e.target.checked })}
          />
          Headless mode
        </label>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">User Agent</label>
          <input
            type="text"
            className="w-full rounded border px-3 py-1.5 text-sm"
            value={browser.user_agent}
            onChange={(e) => setBrowser({ ...browser, user_agent: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Proxy URL</label>
          <input
            type="text"
            className="w-full rounded border px-3 py-1.5 text-sm"
            placeholder="http://proxy:8080"
            value={browser.proxy}
            onChange={(e) => setBrowser({ ...browser, proxy: e.target.value })}
          />
        </div>
        <button onClick={saveBrowser} className="rounded bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
          Save Browser Settings
        </button>
      </section>

      {/* PIN */}
      <section className="rounded-lg border bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold">Authentication PIN</h2>
        <p className="text-xs text-gray-500">Set a PIN to protect access. Leave empty to remove.</p>
        <div className="flex gap-2 items-end">
          <input
            type="password"
            placeholder="New PIN (or empty to remove)"
            className="rounded border px-3 py-1.5 text-sm w-60"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <button onClick={savePin} className="rounded bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100">
            Update PIN
          </button>
        </div>
      </section>
    </div>
  );
}
