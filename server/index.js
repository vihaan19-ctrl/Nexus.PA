import express from "express";
import cors from "cors";
import "dotenv/config";
import {
  KNOWN_PROVIDERS, getPublicVault, addKey, updateKey, deleteKey,
  setProviderFallbackOrder, getKeysForFallback, recordKeyResult, getRawKey,
} from "./vaultStore.js";
import { adapters, testProviderKey } from "./providerAdapters.js";
import { lookupStock, lookupWeather } from "./webData.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 8787;

// Legacy zero-config path: a single NVIDIA_API_KEY in .env still works
// exactly as before, with no Vault setup required.
const ENV_NVIDIA_KEY = process.env.NVIDIA_API_KEY;
const ENV_NVIDIA_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct";

app.get("/api/ai/health", (_req, res) => {
  const vault = getPublicVault();
  const vaultHasKeys = Object.values(vault.providers).some((p) => p.keys.some((k) => k.enabled));
  res.json({
    ok: true,
    configured: !!ENV_NVIDIA_KEY || vaultHasKeys,
    mode: vaultHasKeys ? "vault" : ENV_NVIDIA_KEY ? "env" : "unconfigured",
    model: ENV_NVIDIA_MODEL,
  });
});

// ---------- Chat, with automatic provider + key fallback ----------
app.post("/api/ai/chat", async (req, res) => {
  const { messages, context } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages[] is required" });
  }

  const systemPrompt = {
    role: "system",
    content:
      "You are NEXUS AI, a personal command-center assistant embedded in the user's own NEXUS app. " +
      "Answer using the data provided below in CONTEXT — never invent tasks, projects, deadlines, or " +
      "statistics that aren't present in it. If something isn't in the data, say so plainly instead of " +
      "guessing. When the context includes a WEB DATA section, that came from a live lookup just now — " +
      "you may treat it as current and should mention it came from the web. Be concise and practical.\n\nCONTEXT:\n" +
      (context || "(no data provided)"),
  };
  const fullMessages = [systemPrompt, ...messages];

  const fallbackList = getKeysForFallback(); // [{ provider, keys: [...] }]
  const attempts = [];

  for (const { provider, keys } of fallbackList) {
    for (const keyEntry of keys) {
      attempts.push({ provider, keyEntry });
    }
  }
  // Legacy env key participates as a last-resort NVIDIA attempt if nothing in the vault worked.
  if (ENV_NVIDIA_KEY) {
    attempts.push({ provider: "nvidia", keyEntry: { id: null, key: ENV_NVIDIA_KEY, model: ENV_NVIDIA_MODEL } });
  }

  if (attempts.length === 0) {
    return res.status(503).json({ error: "No AI provider configured. Add a key in Settings -> API Vault, or set NVIDIA_API_KEY in server/.env." });
  }

  const trail = [];
  for (const { provider, keyEntry } of attempts) {
    try {
      const { text } = await adapters[provider](keyEntry.key, keyEntry.model, fullMessages);
      if (keyEntry.id) recordKeyResult(provider, keyEntry.id, true);
      return res.json({ reply: text, provider, usedFallback: trail.length > 0, trail });
    } catch (err) {
      const kind = err.kind || "error";
      trail.push({ provider, kind });
      if (keyEntry.id) recordKeyResult(provider, keyEntry.id, false, kind);
      // try next attempt
    }
  }

  res.status(502).json({ error: "All configured AI providers failed.", trail });
});

// ---------- API Vault ----------
app.get("/api/vault", (_req, res) => {
  res.json(getPublicVault());
});

app.post("/api/vault/:provider/keys", (req, res) => {
  const { provider } = req.params;
  if (!KNOWN_PROVIDERS.includes(provider)) return res.status(400).json({ error: "Unknown provider" });
  try {
    const key = addKey(provider, req.body || {});
    res.json(key);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/vault/:provider/keys/:id", (req, res) => {
  const { provider, id } = req.params;
  try {
    const key = updateKey(provider, id, req.body || {});
    res.json(key);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/vault/:provider/keys/:id", (req, res) => {
  const { provider, id } = req.params;
  try {
    deleteKey(provider, id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/vault/order", (req, res) => {
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ error: "order[] is required" });
  res.json({ order: setProviderFallbackOrder(order) });
});

// Test a key WITHOUT persisting it (used for "test before save").
app.post("/api/vault/:provider/test", async (req, res) => {
  const { provider } = req.params;
  const { key, model } = req.body || {};
  if (!KNOWN_PROVIDERS.includes(provider)) return res.status(400).json({ error: "Unknown provider" });
  if (!key) return res.status(400).json({ error: "key is required" });
  const result = await testProviderKey(provider, key, model);
  res.json(result);
});

// Test an already-saved key by id — the raw key never leaves the server.
app.post("/api/vault/:provider/keys/:id/test", async (req, res) => {
  const { provider, id } = req.params;
  if (!KNOWN_PROVIDERS.includes(provider)) return res.status(400).json({ error: "Unknown provider" });
  const raw = getRawKey(provider, id);
  if (!raw) return res.status(404).json({ error: "Key not found" });
  const result = await testProviderKey(provider, raw.key, raw.model);
  recordKeyResult(provider, id, result.ok, result.ok ? undefined : result.kind);
  res.json(result);
});

// ---------- Web data (free, no key required) ----------
app.get("/api/web/stock", async (req, res) => {
  const symbol = req.query.symbol;
  if (!symbol) return res.status(400).json({ error: "symbol query param is required" });
  try {
    res.json(await lookupStock(String(symbol)));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get("/api/web/weather", async (req, res) => {
  const place = req.query.place;
  if (!place) return res.status(400).json({ error: "place query param is required" });
  try {
    res.json(await lookupWeather(String(place)));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[nexus-ai-server] listening on http://localhost:${PORT}`);
  if (!ENV_NVIDIA_KEY) {
    console.log("[nexus-ai-server] No NVIDIA_API_KEY in .env -- configure providers in Settings -> API Vault instead.");
  }
});
