// Normalizes different providers' chat completion APIs into one shape:
// call(key, model, messages) -> { text } or throws { kind: "rate_limit" | "invalid" | "error", message }

async function openaiCompatible(baseUrl, key, model, messages) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 700, stream: false }),
  });
  if (res.status === 429) throw { kind: "rate_limit", message: "Rate limited" };
  if (res.status === 401 || res.status === 403) throw { kind: "invalid", message: "Invalid or unauthorized key" };
  if (!res.ok) throw { kind: "error", message: await res.text() };
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw { kind: "error", message: "Empty response" };
  return { text };
}

async function geminiCall(key, model, messages) {
  const m = model || "gemini-1.5-flash";
  const system = messages.find((msg) => msg.role === "system");
  const rest = messages.filter((msg) => msg.role !== "system");
  const contents = rest.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));
  const body = {
    contents,
    ...(system ? { systemInstruction: { parts: [{ text: system.content }] } } : {}),
    generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
  if (res.status === 429) throw { kind: "rate_limit", message: "Rate limited" };
  if (res.status === 401 || res.status === 403 || res.status === 400) {
    const t = await res.text();
    throw { kind: /API key/i.test(t) ? "invalid" : "error", message: t };
  }
  if (!res.ok) throw { kind: "error", message: await res.text() };
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw { kind: "error", message: "Empty response" };
  return { text };
}

export const adapters = {
  nvidia: (key, model, messages) =>
    openaiCompatible("https://integrate.api.nvidia.com/v1", key, model || "meta/llama-3.1-8b-instruct", messages),
  groq: (key, model, messages) =>
    openaiCompatible("https://api.groq.com/openai/v1", key, model || "llama-3.1-8b-instant", messages),
  gemini: (key, model, messages) => geminiCall(key, model, messages),
};

// Lightweight connectivity test — same call path with a trivial prompt.
export async function testProviderKey(provider, key, model) {
  try {
    const { text } = await adapters[provider](key, model, [{ role: "user", content: "Say OK." }]);
    return { ok: true, sample: text.slice(0, 60) };
  } catch (err) {
    return { ok: false, kind: err.kind || "error", message: err.message || String(err) };
  }
}
