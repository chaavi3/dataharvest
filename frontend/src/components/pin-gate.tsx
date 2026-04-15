"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";

interface Props {
  onAuthenticated: () => void;
}

export default function PinGate({ onAuthenticated }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.login(pin);
      onAuthenticated();
    } catch {
      setError("Invalid PIN");
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="w-80 rounded-xl border bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-center mb-6">DataHarvest</h2>
        <label className="block text-sm font-medium mb-2">Enter PIN</label>
        <input
          type="password"
          className="w-full rounded-lg border px-3 py-2 text-sm mb-3"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          autoFocus
        />
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}
