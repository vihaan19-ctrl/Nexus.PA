import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import crypto from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "data", "vault.json");

// Providers NEXUS knows how to call. Each has an adapter in providerAdapters.js.
export const KNOWN_PROVIDERS = ["gemini", "groq", "nvidia"];

function defaultState() {
  return {
    providers: {
      gemini: { keys: [], fallbackOrderWithin: [] },
      groq: { keys: [], fallbackOrderWithin: [] },
      nvidia: { keys: [], fallbackOrderWithin: [] },
    },
    providerFallbackOrder: ["nvidia", "gemini", "groq"],
  };
}

function load() {
  if (!existsSync(DATA_FILE)) {
    const state = defaultState();
    save(state);
    return state;
  }
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return defaultState();
  }
}

function save(state) {
  writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
}

export function maskKey(key) {
  if (!key || key.length < 6) return "••••••";
  return "•".repeat(Math.max(6, key.length - 4)) + key.slice(-4);
}

// Public shape sent to the frontend — raw `key` is stripped, everything else is safe.
function publicKey(k) {
  const { key, ...rest } = k;
  return { ...rest, masked: maskKey(key) };
}

export function getPublicVault() {
  const state = load();
  const providers = {};
  for (const p of KNOWN_PROVIDERS) {
    const entry = state.providers[p] || { keys: [] };
    providers[p] = { keys: entry.keys.map(publicKey) };
  }
  return { providers, providerFallbackOrder: state.providerFallbackOrder };
}

export function addKey(provider, { label, key, model }) {
  if (!KNOWN_PROVIDERS.includes(provider)) throw new Error("Unknown provider");
  if (!key || !key.trim()) throw new Error("Key is required");
  const state = load();
  const id = crypto.randomBytes(6).toString("hex");
  const entry = {
    id,
    label: label?.trim() || `Key ${state.providers[provider].keys.length + 1}`,
    key: key.trim(),
    model: model?.trim() || undefined,
    enabled: true,
    priority: state.providers[provider].keys.length,
    status: "unknown",
    lastUsed: null,
    errorCount: 0,
    createdAt: new Date().toISOString(),
  };
  state.providers[provider].keys.push(entry);
  save(state);
  return publicKey(entry);
}

export function updateKey(provider, id, patch) {
  const state = load();
  const list = state.providers[provider]?.keys;
  if (!list) throw new Error("Unknown provider");
  const idx = list.findIndex((k) => k.id === id);
  if (idx === -1) throw new Error("Key not found");
  const allow = ["label", "enabled", "priority", "model", "status", "lastUsed", "errorCount"];
  for (const k of allow) if (k in patch) list[idx][k] = patch[k];
  save(state);
  return publicKey(list[idx]);
}

export function deleteKey(provider, id) {
  const state = load();
  const list = state.providers[provider]?.keys;
  if (!list) throw new Error("Unknown provider");
  state.providers[provider].keys = list.filter((k) => k.id !== id);
  save(state);
}

export function setProviderFallbackOrder(order) {
  const state = load();
  const filtered = order.filter((p) => KNOWN_PROVIDERS.includes(p));
  for (const p of KNOWN_PROVIDERS) if (!filtered.includes(p)) filtered.push(p);
  state.providerFallbackOrder = filtered;
  save(state);
  return state.providerFallbackOrder;
}

// Internal — used by the chat route only. Returns RAW keys, never sent to frontend.
export function getKeysForFallback() {
  const state = load();
  const order = state.providerFallbackOrder;
  return order.map((provider) => ({
    provider,
    keys: (state.providers[provider]?.keys || [])
      .filter((k) => k.enabled)
      .sort((a, b) => a.priority - b.priority),
  }));
}

// Internal — returns the raw key+model for one saved entry, for server-side testing only.
export function getRawKey(provider, id) {
  const state = load();
  const entry = (state.providers[provider]?.keys || []).find((k) => k.id === id);
  if (!entry) return null;
  return { key: entry.key, model: entry.model };
}

export function recordKeyResult(provider, id, ok, note) {
  const state = load();
  const list = state.providers[provider]?.keys;
  if (!list) return;
  const idx = list.findIndex((k) => k.id === id);
  if (idx === -1) return;
  list[idx].lastUsed = new Date().toISOString();
  if (ok) {
    list[idx].status = "connected";
    list[idx].errorCount = 0;
  } else {
    list[idx].status = note || "error";
    list[idx].errorCount = (list[idx].errorCount || 0) + 1;
    // Temporarily disable a key after repeated hard failures (not rate limits).
    if (note === "invalid" && list[idx].errorCount >= 3) list[idx].enabled = false;
  }
  save(state);
}
