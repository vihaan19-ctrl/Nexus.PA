import React, { useEffect, useState } from "react";
import { useNexus } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { Card, Button, Input, Select, Badge } from "@/components/ui/Primitives";
import { hashPin } from "@/lib/pin";
import { vaultClient, VaultState } from "@/lib/vaultClient";
import { Lock, ShieldCheck, Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { classNames } from "@/utils/helpers";

const PROVIDER_LABEL: Record<string, string> = { gemini: "Gemini", groq: "Groq", nvidia: "NVIDIA" };

export function ApiVaultSection() {
  const { data, updateSettings } = useNexus();
  const { push } = useToast();
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [settingUpPin, setSettingUpPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const hasPin = !!data.settings.vaultPinHash;

  async function unlock() {
    if (!pinInput.trim()) return;
    const hash = await hashPin(pinInput);
    if (hash === data.settings.vaultPinHash) {
      setUnlocked(true);
      setError("");
      setPinInput("");
    } else {
      setError("Incorrect PIN.");
    }
  }

  async function createPin() {
    if (pinInput.length < 4) { setError("PIN must be at least 4 digits."); return; }
    if (pinInput !== confirmPin) { setError("PINs don't match."); return; }
    const hash = await hashPin(pinInput);
    updateSettings({ vaultPinHash: hash });
    setUnlocked(true);
    setPinInput(""); setConfirmPin(""); setError(""); setSettingUpPin(false);
    push("Vault PIN set", "success");
  }

  if (!unlocked) {
    return (
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Lock size={15} className="text-[var(--color-accent)]" /> API Vault
        </div>
        {!hasPin && !settingUpPin && (
          <div>
            <p className="mb-3 text-xs text-[var(--color-text-dim)]">Set a PIN to protect your API key configuration.</p>
            <Button size="sm" variant="primary" onClick={() => setSettingUpPin(true)}>Set up PIN</Button>
          </div>
        )}
        {!hasPin && settingUpPin && (
          <div className="flex max-w-xs flex-col gap-2">
            <Input type="password" inputMode="numeric" placeholder="New PIN (4+ digits)" value={pinInput} onChange={(e) => setPinInput(e.target.value)} />
            <Input type="password" inputMode="numeric" placeholder="Confirm PIN" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createPin()} />
            {error && <p className="text-xs text-[var(--color-critical)]">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setSettingUpPin(false); setError(""); }}>Cancel</Button>
              <Button size="sm" variant="primary" onClick={createPin}>Save PIN</Button>
            </div>
          </div>
        )}
        {hasPin && (
          <div className="flex max-w-xs flex-col gap-2">
            <p className="mb-1 text-xs text-[var(--color-text-dim)]">Enter your PIN to view API configuration.</p>
            <Input type="password" inputMode="numeric" placeholder="••••" value={pinInput} onChange={(e) => setPinInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} autoFocus />
            {error && <p className="text-xs text-[var(--color-critical)]">{error}</p>}
            <div className="flex items-center justify-between">
              <Button size="sm" variant="primary" onClick={unlock}>Unlock</Button>
              <button className="text-[11px] text-[var(--color-text-faint)] hover:text-[var(--color-text)]" onClick={() => { updateSettings({ vaultPinHash: undefined }); setSettingUpPin(true); push("PIN reset — set a new one"); }}>
                Forgot PIN? Reset it
              </button>
            </div>
          </div>
        )}
      </Card>
    );
  }

  return <UnlockedVault onLock={() => setUnlocked(false)} />;
}

function UnlockedVault({ onLock }: { onLock: () => void }) {
  const { push } = useToast();
  const [vault, setVault] = useState<VaultState | null>(null);
  const [backendReachable, setBackendReachable] = useState(true);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const v = await vaultClient.get();
      setVault(v);
      setBackendReachable(true);
    } catch {
      setBackendReachable(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  if (loading) return <Card className="p-5 flex items-center gap-2 text-sm text-[var(--color-text-dim)]"><Loader2 size={14} className="animate-spin" /> Loading vault...</Card>;

  if (!backendReachable) {
    return (
      <Card className="p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Lock size={15} className="text-[var(--color-accent)]" /> API Vault</div>
        <p className="text-xs text-[var(--color-text-dim)]">
          Can't reach the NEXUS backend at <code>{vaultClient.backendUrl}</code>. Start it with <code>npm start</code> inside <code>/server</code> to manage API keys.
        </p>
        <Button size="sm" variant="ghost" className="mt-3" onClick={onLock}><Lock size={13} /> Lock</Button>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={15} className="text-[#4ade80]" /> API Vault — unlocked</div>
        <Button size="sm" variant="ghost" icon={<Lock size={13} />} onClick={onLock}>Lock</Button>
      </div>

      <div className="mb-2 flex items-start gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-[11px] text-[var(--color-text-dim)]">
        Keys are stored on your NEXUS backend (<code>server/data/vault.json</code>), never in the browser. This local file is git-ignored — never commit it or share it. On a public deployment, this file lives on your server, not in the frontend bundle.
      </div>

      {vault && (
        <>
          <FallbackOrder vault={vault} onChange={refresh} />
          <div className="mt-4 flex flex-col gap-3">
            {vault.providerFallbackOrder.map((provider) => (
              <ProviderCard key={provider} provider={provider} vaultKeys={vault.providers[provider]?.keys || []} onChange={refresh} />
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function FallbackOrder({ vault, onChange }: { vault: VaultState; onChange: () => void }) {
  const { push } = useToast();
  async function move(idx: number, dir: -1 | 1) {
    const order = [...vault.providerFallbackOrder];
    const target = idx + dir;
    if (target < 0 || target >= order.length) return;
    [order[idx], order[target]] = [order[target], order[idx]];
    await vaultClient.setOrder(order);
    onChange();
  }
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">Provider fallback order</p>
      <div className="flex flex-col gap-1">
        {vault.providerFallbackOrder.map((p, i) => (
          <div key={p} className="flex items-center gap-2 rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm">
            <span className="w-5 text-[var(--color-text-faint)]">{i + 1}.</span>
            <span className="flex-1">{PROVIDER_LABEL[p]}</span>
            <button onClick={() => move(i, -1)} disabled={i === 0} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] disabled:opacity-30"><ArrowUp size={13} /></button>
            <button onClick={() => move(i, 1)} disabled={i === vault.providerFallbackOrder.length - 1} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] disabled:opacity-30"><ArrowDown size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProviderCard({ provider, vaultKeys, onChange }: { provider: string; vaultKeys: VaultState["providers"][string]["keys"]; onChange: () => void }) {
  const { push } = useToast();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [model, setModel] = useState("");
  const [testing, setTesting] = useState<string | null>(null);

  const connected = vaultKeys.some((k) => k.enabled && k.status === "connected");

  async function saveKey() {
    if (!key.trim()) return;
    try {
      await vaultClient.addKey(provider, label, key, model || undefined);
      push("Key added", "success");
      setLabel(""); setKey(""); setModel(""); setAdding(false);
      onChange();
    } catch (e: any) {
      push(e.message || "Failed to add key", "error");
    }
  }

  async function testKey(k: VaultState["providers"][string]["keys"][number]) {
    setTesting(k.id);
    const result = await vaultClient.testSavedKey(provider, k.id);
    setTesting(null);
    onChange();
    push(result.ok ? "Connected" : `Failed: ${result.message || result.kind}`, result.ok ? "success" : "error");
  }

  return (
    <Card className="p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{PROVIDER_LABEL[provider]}</span>
          <Badge tone={connected ? "success" : "default"}>
            {connected ? <CheckCircle2 size={11} /> : <XCircle size={11} />} {connected ? "Connected" : "Not connected"}
          </Badge>
        </div>
        <Button size="sm" variant="ghost" icon={<Plus size={13} />} onClick={() => setAdding((a) => !a)}>Add key</Button>
      </div>

      {vaultKeys.length === 0 && !adding && <p className="text-xs text-[var(--color-text-faint)]">No keys added yet.</p>}

      <div className="flex flex-col gap-1.5">
        {vaultKeys.sort((a, b) => a.priority - b.priority).map((k) => (
          <div key={k.id} className="flex items-center gap-2 rounded-lg border border-[var(--color-border-soft)] px-2.5 py-1.5 text-xs">
            <span className={classNames("h-1.5 w-1.5 rounded-full", k.enabled ? "bg-[#4ade80]" : "bg-[var(--color-text-faint)]")} />
            <span className="font-medium">{k.label}</span>
            <span className="font-mono text-[var(--color-text-faint)]">{k.masked}</span>
            {k.model && <span className="text-[var(--color-text-faint)]">· {k.model}</span>}
            <span className="ml-auto flex items-center gap-2">
              <button onClick={() => testKey(k)} className="text-[var(--color-text-faint)] hover:text-[var(--color-accent)]" disabled={testing === k.id}>
                {testing === k.id ? <Loader2 size={12} className="animate-spin" /> : "Test"}
              </button>
              <button onClick={async () => { await vaultClient.updateKey(provider, k.id, { enabled: !k.enabled }); onChange(); }} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]">
                {k.enabled ? "Disable" : "Enable"}
              </button>
              <button onClick={async () => { await vaultClient.deleteKey(provider, k.id); push("Key removed"); onChange(); }} className="text-[var(--color-text-faint)] hover:text-[var(--color-critical)]">
                <Trash2 size={12} />
              </button>
            </span>
          </div>
        ))}
      </div>

      {adding && (
        <div className="mt-2 flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
          <Input placeholder="Label (e.g. Primary)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <Input placeholder="API key" type="password" value={key} onChange={(e) => setKey(e.target.value)} />
          <Input placeholder="Model override (optional)" value={model} onChange={(e) => setModel(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button size="sm" variant="primary" onClick={saveKey}>Save key</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
