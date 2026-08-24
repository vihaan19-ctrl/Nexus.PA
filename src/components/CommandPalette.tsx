import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNexus } from "@/data/store";
import { classNames } from "@/utils/helpers";
import {
  Search, CheckSquare, FolderKanban, StickyNote, Lightbulb, GraduationCap,
  ListTodo, Bell, Target, LayoutDashboard, Timer, Settings, Plus,
} from "lucide-react";

interface ResultItem { id: string; label: string; sublabel?: string; group: string; icon: React.ReactNode; action: () => void }

export function CommandPalette({
  open, onClose, onNewTask, onNewProject, onNewNote, onNewIdea, onNewReminder,
}: {
  open: boolean; onClose: () => void;
  onNewTask: () => void; onNewProject: () => void; onNewNote: () => void; onNewIdea: () => void; onNewReminder: () => void;
}) {
  const { data } = useNexus();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => { if (open) { setQuery(""); setActiveIndex(0); } }, [open]);

  const commands: ResultItem[] = useMemo(() => [
    { id: "cmd-new-task", label: "New Task", group: "Commands", icon: <Plus size={14} />, action: onNewTask },
    { id: "cmd-new-project", label: "New Project", group: "Commands", icon: <Plus size={14} />, action: onNewProject },
    { id: "cmd-new-note", label: "New Note", group: "Commands", icon: <Plus size={14} />, action: onNewNote },
    { id: "cmd-new-idea", label: "New Idea", group: "Commands", icon: <Plus size={14} />, action: onNewIdea },
    { id: "cmd-new-reminder", label: "New Reminder", group: "Commands", icon: <Plus size={14} />, action: onNewReminder },
    { id: "cmd-focus", label: "Start Focus", group: "Commands", icon: <Timer size={14} />, action: () => navigate("/focus") },
    { id: "cmd-dashboard", label: "Open Dashboard", group: "Commands", icon: <LayoutDashboard size={14} />, action: () => navigate("/") },
    { id: "cmd-backlog", label: "Open Backlog", group: "Commands", icon: <ListTodo size={14} />, action: () => navigate("/backlog") },
    { id: "cmd-school", label: "Open School", group: "Commands", icon: <GraduationCap size={14} />, action: () => navigate("/school") },
    { id: "cmd-settings", label: "Open Settings", group: "Commands", icon: <Settings size={14} />, action: () => navigate("/settings") },
  ], [navigate, onNewTask, onNewProject, onNewNote, onNewIdea, onNewReminder]);

  const searchResults: ResultItem[] = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results: ResultItem[] = [];
    data.tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 5).forEach((t) =>
      results.push({ id: `task-${t.id}`, label: t.title, sublabel: t.status, group: "Tasks", icon: <CheckSquare size={14} />, action: () => navigate("/tasks") }));
    data.projects.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 5).forEach((p) =>
      results.push({ id: `proj-${p.id}`, label: p.name, sublabel: p.status, group: "Projects", icon: <FolderKanban size={14} />, action: () => navigate(`/projects/${p.id}`) }));
    data.notes.filter((n) => n.title.toLowerCase().includes(q)).slice(0, 5).forEach((n) =>
      results.push({ id: `note-${n.id}`, label: n.title, group: "Notes", icon: <StickyNote size={14} />, action: () => navigate("/notes") }));
    data.ideas.filter((i) => i.title.toLowerCase().includes(q)).slice(0, 5).forEach((i) =>
      results.push({ id: `idea-${i.id}`, label: i.title, group: "Ideas", icon: <Lightbulb size={14} />, action: () => navigate("/ideas") }));
    data.backlogItems.filter((b) => b.title.toLowerCase().includes(q)).slice(0, 5).forEach((b) =>
      results.push({ id: `bl-${b.id}`, label: b.title, group: "Backlog", icon: <ListTodo size={14} />, action: () => navigate("/backlog") }));
    data.reminders.filter((r) => r.title.toLowerCase().includes(q)).slice(0, 5).forEach((r) =>
      results.push({ id: `rem-${r.id}`, label: r.title, group: "Reminders", icon: <Bell size={14} />, action: () => navigate("/reminders") }));
    data.goals.filter((g) => g.title.toLowerCase().includes(q)).slice(0, 5).forEach((g) =>
      results.push({ id: `goal-${g.id}`, label: g.title, group: "Goals", icon: <Target size={14} />, action: () => navigate("/goals") }));
    return results;
  }, [query, data, navigate]);

  const commandMatches = useMemo(() => {
    if (!query.trim()) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));
  }, [query, commands]);

  const allResults = query.trim() ? [...searchResults, ...commandMatches] : commands;
  const grouped = useMemo(() => {
    const map: Record<string, ResultItem[]> = {};
    allResults.forEach((r) => { (map[r.group] ||= []).push(r); });
    return map;
  }, [allResults]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, allResults.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter") { e.preventDefault(); const r = allResults[activeIndex]; if (r) { r.action(); onClose(); } }
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, allResults, activeIndex, onClose]);

  if (!open) return null;

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 pt-[10vh]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl animate-in">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
          <Search size={16} className="text-[var(--color-text-faint)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            placeholder="Search or run a command..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-faint)]"
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {Object.keys(grouped).length === 0 && <p className="px-3 py-6 text-center text-xs text-[var(--color-text-faint)]">No matches.</p>}
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-2">
              <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-faint)]">{group}</p>
              {items.map((item) => {
                flatIndex++;
                const isActive = flatIndex === activeIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => { item.action(); onClose(); }}
                    onMouseEnter={() => setActiveIndex(flatIndex)}
                    className={classNames(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm",
                      isActive ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]" : "text-[var(--color-text)]"
                    )}
                  >
                    {item.icon}
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.sublabel && <span className="text-[11px] text-[var(--color-text-faint)]">{item.sublabel}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
