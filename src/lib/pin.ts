// This is a UI-level gate only — it stops someone glancing at your screen
// from opening the Vault, nothing more. The actual secrets never reach the
// browser at all (see server/vaultStore.js) — that's the real protection.
export async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder().encode(`nexus-vault:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
