const AI_BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL || "http://localhost:8787";

export interface VaultKey {
  id: string;
  label: string;
  model?: string;
  enabled: boolean;
  priority: number;
  status: string;
  lastUsed: string | null;
  errorCount: number;
  createdAt: string;
  masked: string;
}

export interface VaultState {
  providers: Record<string, { keys: VaultKey[] }>;
  providerFallbackOrder: string[];
}

async function json<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const vaultClient = {
  backendUrl: AI_BACKEND_URL,

  async health() {
    const res = await fetch(`${AI_BACKEND_URL}/api/ai/health`);
    return json<{ ok: boolean; configured: boolean; mode: string; model: string }>(res);
  },

  async get(): Promise<VaultState> {
    const res = await fetch(`${AI_BACKEND_URL}/api/vault`);
    return json<VaultState>(res);
  },

  async addKey(provider: string, label: string, key: string, model?: string) {
    const res = await fetch(`${AI_BACKEND_URL}/api/vault/${provider}/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, key, model }),
    });
    return json<VaultKey>(res);
  },

  async updateKey(provider: string, id: string, patch: Partial<Pick<VaultKey, "label" | "enabled" | "priority" | "model">>) {
    const res = await fetch(`${AI_BACKEND_URL}/api/vault/${provider}/keys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return json<VaultKey>(res);
  },

  async deleteKey(provider: string, id: string) {
    const res = await fetch(`${AI_BACKEND_URL}/api/vault/${provider}/keys/${id}`, { method: "DELETE" });
    return json<{ ok: boolean }>(res);
  },

  async setOrder(order: string[]) {
    const res = await fetch(`${AI_BACKEND_URL}/api/vault/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    return json<{ order: string[] }>(res);
  },

  async testKey(provider: string, key: string, model?: string) {
    const res = await fetch(`${AI_BACKEND_URL}/api/vault/${provider}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, model }),
    });
    return json<{ ok: boolean; kind?: string; message?: string; sample?: string }>(res);
  },

  async testSavedKey(provider: string, id: string) {
    const res = await fetch(`${AI_BACKEND_URL}/api/vault/${provider}/keys/${id}/test`, { method: "POST" });
    return json<{ ok: boolean; kind?: string; message?: string; sample?: string }>(res);
  },
};
