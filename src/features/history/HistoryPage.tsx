import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNexus } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { Card, Badge, Button, Input, Select, EmptyState, Modal } from "@/components/ui/Primitives";
import { HistoryEntry, HistoryType } from "@/types";
import { formatDate } from "@/utils/helpers";
import {
  History as HistoryIcon, CheckSquare, FolderKanban, StickyNote, ListTodo,
  Timer, Sparkles, Globe, Bell, Trash2, Search,
} from "lucide-react";

const typeMeta: Record<HistoryType, { label: string; icon: React.ReactNode; tone: any }> = {
  task_created: { label: "Task created", icon: <CheckSquare size={13} />, tone: "accent" },
  task_completed: { label: "Task completed", icon: <CheckSquare size={13} />, tone: "success" },
  project_created: { label: "Project created", icon: <FolderKanban size={13} />, tone: "accent" },
  project_opened: { label: "Project opened", icon: <FolderKanban size={13} />, tone: "default" },
  note_created: { label: "Note created", icon: <StickyNote size={13} />, tone: "default" },
  backlog_updated: { label: "Backlog updated", icon: <ListTodo size={13} />, tone: "high" },
  focus_session: { label: "Focus session", icon: <Timer size={13} />, tone: "medium" },
  ai_query: { label: "AI query", icon: <Sparkles size={13} />, tone: "accent" },
  web_query: { label: "Web query", icon: <Globe size={13} />, tone: "low" },
  reminder_created: { label: "Reminder created", icon: <Bell size={13} />, tone: "default" },
};

export function HistoryPage() {
  const { data, remove, bulkRemove } = useNexus();
  const { push } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    let entries = data.historyEntries.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    if (typeFilter) entries = entries.filter((e) => e.type === typeFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      entries = entries.filter((e) => e.title.toLowerCase().includes(q) || e.detail?.toLowerCase().includes(q));
    }
    return entries;
  }, [data.historyEntries, typeFilter, query]);

  function openRelated(e: HistoryEntry) {
    if (!e.relatedType || !e.relatedId) return;
    if (e.relatedType === "project") navigate(`/projects/${e.relatedId}`);
    else if (e.relatedType === "task") navigate("/tasks");
    else if (e.relatedType === "note") navigate("/notes");
    else if (e.relatedType === "backlog") navigate("/backlog");
    else if (e.relatedType === "reminder") navigate("/reminders");
  }

  return (
    <div className="animate-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><HistoryIcon size={18} /> Recent History</h1>
          <p className="text-sm text-[var(--color-text-dim)]">{filtered.length} entries</p>
        </div>
        {data.historyEntries.length > 0 && (
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => setConfirmClear(true)}>Clear history</Button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
          <Input className="pl-7" placeholder="Search history..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select className="w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Any type</option>
          {Object.entries(typeMeta).map(([key, m]) => <option key={key} value={key}>{m.label}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No activity yet." subtitle="Tasks, projects, AI queries, and other meaningful actions will show up here as you use NEXUS." />
      ) : (
        <div className="flex flex-col gap-1">
          {filtered.map((e) => {
            const meta = typeMeta[e.type];
            return (
              <div key={e.id} className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
                <button
                  onClick={() => openRelated(e)}
                  disabled={!e.relatedId}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default"
                >
                  <Badge tone={meta.tone}>{meta.icon}{meta.label}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{e.title}</p>
                    {e.detail && <p className="truncate text-[11px] text-[var(--color-text-faint)]">{e.detail}</p>}
                  </div>
                </button>
                <span className="shrink-0 text-[11px] text-[var(--color-text-faint)]">{formatDate(e.timestamp.slice(0, 10))} {e.timestamp.slice(11, 16)}</span>
                <button onClick={() => { remove("historyEntries", e.id); push("Entry removed"); }} className="text-[var(--color-text-faint)] opacity-0 hover:text-[var(--color-critical)] group-hover:opacity-100">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="Clear all history?">
        <p className="mb-4 text-sm text-[var(--color-text-dim)]">This removes every logged entry. Your tasks, projects, and other data are unaffected.</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmClear(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { bulkRemove("historyEntries", data.historyEntries.map((e) => e.id)); setConfirmClear(false); push("History cleared", "success"); }}>Clear history</Button>
        </div>
      </Modal>
    </div>
  );
}
