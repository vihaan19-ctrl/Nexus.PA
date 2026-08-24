import React, { useRef, useState } from "react";
import { useNexus } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { Card, Button, Select, Tabs, Modal } from "@/components/ui/Primitives";
import { Download, Upload, RotateCcw, Trash2, Sparkles, BellRing } from "lucide-react";
import { NexusData } from "@/types";
import { ApiVaultSection } from "./ApiVaultSection";

const WIDGET_OPTIONS = [
  { key: "priorities", label: "Today's priorities" },
  { key: "upcoming", label: "Upcoming" },
  { key: "projects", label: "Active projects" },
  { key: "backlog", label: "Backlog snapshot" },
  { key: "progress", label: "Daily progress" },
];

export function SettingsPage() {
  const { data, updateSettings, resetDemo, clearDemo, resetAll, replaceAll, remove } = useNexus();
  const { push } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmImport, setConfirmImport] = useState<NexusData | null>(null);

  function toggleWidget(key: string) {
    const widgets = data.settings.dashboardWidgets.includes(key)
      ? data.settings.dashboardWidgets.filter((w) => w !== key)
      : [...data.settings.dashboardWidgets, key];
    updateSettings({ dashboardWidgets: widgets });
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `NEXUS_BACKUP_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    push("Backup exported", "success");
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.projects) || !parsed.settings) {
          push("That file doesn't look like a valid NEXUS backup", "error");
          return;
        }
        setConfirmImport(parsed as NexusData);
      } catch {
        push("Couldn't parse that file as JSON", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="animate-in max-w-2xl">
      <h1 className="mb-5 text-xl font-semibold tracking-tight">Settings</h1>

      <Section title="General">
        <Row label="NEXUS name">
          <span className="text-xs text-[var(--color-text-faint)]">NEXUS (custom naming coming soon)</span>
        </Row>
        <Row label="Time format">
          <Select className="w-auto" defaultValue="12h" disabled>
            <option value="12h">12-hour</option><option value="24h">24-hour</option>
          </Select>
        </Row>
        <Row label="Date format">
          <Select className="w-auto" defaultValue="mdy" disabled>
            <option value="mdy">MM/DD/YYYY</option><option value="dmy">DD/MM/YYYY</option>
          </Select>
        </Row>
        <p className="text-[11px] text-[var(--color-text-faint)]">Time/date format follows your browser locale for now — a manual override is a future addition.</p>
      </Section>

      <Section title="Appearance">
        <Row label="Theme">
          <Select className="w-auto" value={data.settings.theme} onChange={(e) => updateSettings({ theme: e.target.value as any })}>
            <option value="dark">Dark</option><option value="light">Light (coming soon)</option><option value="system">System (coming soon)</option>
          </Select>
        </Row>
        <Row label="Accent color">
          <div className="flex gap-2">
            {["#6366f1", "#22d3ee", "#a78bfa", "#f0576b", "#4ade80"].map((c) => (
              <button key={c} onClick={() => updateSettings({ accentColor: c })} className="h-6 w-6 rounded-full border-2" style={{ background: c, borderColor: data.settings.accentColor === c ? "#fff" : "transparent" }} />
            ))}
          </div>
        </Row>
        <Row label="Density">
          <Select className="w-auto" value={data.settings.density} onChange={(e) => updateSettings({ density: e.target.value as any })}>
            <option value="comfortable">Comfortable</option><option value="compact">Compact (coming soon)</option>
          </Select>
        </Row>
      </Section>

      <Section title="Dashboard widgets">
        <div className="flex flex-col gap-2">
          {WIDGET_OPTIONS.map((w) => (
            <label key={w.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={data.settings.dashboardWidgets.includes(w.key)} onChange={() => toggleWidget(w.key)} />
              {w.label}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Notifications">
        <Row label="Browser notifications">
          <Button size="sm" variant="secondary" icon={<BellRing size={13} />} onClick={() => {
            if (typeof Notification === "undefined") { push("Not supported in this browser", "error"); return; }
            Notification.requestPermission().then((p) => {
              updateSettings({ notificationsEnabled: p === "granted" });
              push(p === "granted" ? "Enabled" : "Permission denied", p === "granted" ? "success" : "error");
            });
          }}>
            {data.settings.notificationsEnabled ? "Enabled" : "Request permission"}
          </Button>
        </Row>
      </Section>

      <Section title="Voice">
        <Row label="Voice input & replies">
          <Button size="sm" variant={data.settings.voiceEnabled ? "primary" : "secondary"} onClick={() => updateSettings({ voiceEnabled: !data.settings.voiceEnabled })}>
            {data.settings.voiceEnabled ? "Enabled" : "Disabled"}
          </Button>
        </Row>
        <Row label="Speak AI replies aloud">
          <Button size="sm" variant={data.settings.ttsEnabled ? "primary" : "secondary"} onClick={() => updateSettings({ ttsEnabled: !data.settings.ttsEnabled })}>
            {data.settings.ttsEnabled ? "On" : "Off"}
          </Button>
        </Row>
        <p className="text-[11px] text-[var(--color-text-faint)]">
          Uses your browser's built-in speech recognition and speech synthesis (Web Speech API) — no external service, works best in Chrome or Edge. The mic button lives on the NEXUS AI page.
        </p>
      </Section>

      <Section title="Data">
        <Row label="Export all data as JSON">
          <Button size="sm" variant="secondary" icon={<Download size={13} />} onClick={exportData}>Export</Button>
        </Row>
        <Row label="Import a backup">
          <Button size="sm" variant="secondary" icon={<Upload size={13} />} onClick={() => fileInputRef.current?.click()}>Import</Button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFile} />
        </Row>
        <Row label="Clear demo data (keep your real data)">
          <Button size="sm" variant="secondary" icon={<Trash2 size={13} />} onClick={() => { clearDemo(); push("Demo data cleared", "success"); }}>Clear demo</Button>
        </Row>
        <Row label="Reload demo data">
          <Button size="sm" variant="secondary" icon={<RotateCcw size={13} />} onClick={() => { resetDemo(); push("Demo data reloaded", "success"); }}>Reload demo</Button>
        </Row>
        <Row label="Reset everything">
          <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => setConfirmReset(true)}>Reset all data</Button>
        </Row>
      </Section>

      <Section title="AI">
        <div className="flex items-start gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-xs text-[var(--color-text-dim)]">
          <Sparkles size={14} className="mt-0.5 shrink-0" />
          <div>
            <p className="mb-1">NEXUS AI works two ways:</p>
            <p className="mb-1"><strong className="text-[var(--color-text)]">Local mode</strong> — always on, answers directly from your stored data in the browser. No key needed.</p>
            <p><strong className="text-[var(--color-text)]">Connected mode</strong> — free-form conversation via a provider you configure below in the API Vault, or a legacy single NVIDIA key in <code>server/.env</code>. Either way, keys are held by the small server in <code>/server</code> and never ship in frontend code.</p>
          </div>
        </div>
      </Section>

      <Section title="API Vault">
        <ApiVaultSection />
      </Section>

      <Section title="Privacy">
        <Row label="AI conversations stored">
          <span className="text-xs text-[var(--color-text-dim)]">{data.aiConversations.length}</span>
        </Row>
        <Row label="History entries stored">
          <span className="text-xs text-[var(--color-text-dim)]">{data.historyEntries.length}</span>
        </Row>
        <Row label="Clear AI conversations">
          <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => { data.aiConversations.forEach((c) => remove("aiConversations", c.id)); push("AI conversations cleared", "success"); }}>Clear</Button>
        </Row>
        <Row label="Clear history log">
          <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => { data.historyEntries.forEach((h) => remove("historyEntries", h.id)); push("History cleared", "success"); }}>Clear</Button>
        </Row>
        <p className="text-[11px] text-[var(--color-text-faint)]">
          NEXUS doesn't run a separate background "memory" model — what it knows is exactly what's in your conversations and history above, stored locally in your browser. Clearing either here removes it completely.
        </p>
      </Section>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset all data?">
        <p className="mb-4 text-sm text-[var(--color-text-dim)]">This permanently deletes every task, project, note, and setting. This can't be undone. Consider exporting a backup first.</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { resetAll(); setConfirmReset(false); push("All data reset", "success"); }}>Reset everything</Button>
        </div>
      </Modal>

      <Modal open={!!confirmImport} onClose={() => setConfirmImport(null)} title="Replace all data with this backup?">
        <p className="mb-4 text-sm text-[var(--color-text-dim)]">Importing will overwrite everything currently in NEXUS with the contents of this file. This can't be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmImport(null)}>Cancel</Button>
          <Button variant="primary" onClick={() => { if (confirmImport) { replaceAll(confirmImport); push("Backup imported", "success"); } setConfirmImport(null); }}>Import & replace</Button>
        </div>
      </Modal>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-4 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">{title}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </Card>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-[var(--color-text)]">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
