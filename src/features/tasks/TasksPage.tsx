import React, { useMemo, useState } from "react";
import { useNexus } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { Task, Priority, TaskStatus } from "@/types";
import { Button, Select, EmptyState, Tabs } from "@/components/ui/Primitives";
import { TaskItem } from "./TaskItem";
import { TaskFormModal } from "./TaskFormModal";
import { Plus, Trash2, CheckCheck } from "lucide-react";
import { isToday, isOverdue, priorityWeight, todayDateStr } from "@/utils/helpers";

type ViewKey = "today" | "upcoming" | "inbox" | "completed" | "all";

export function TasksPage() {
  const { data, bulkRemove, bulkUpdate } = useNexus();
  const { push } = useToast();
  const [view, setView] = useState<ViewKey>("today");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("deadline");
  const [editing, setEditing] = useState<Task | null | undefined>(undefined);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let tasks = data.tasks.slice();
    const today = todayDateStr();

    switch (view) {
      case "today":
        tasks = tasks.filter((t) => t.status !== "completed" && t.status !== "archived" && (isToday(t.dueDate) || isOverdue(t.dueDate, t.status)));
        break;
      case "upcoming":
        tasks = tasks.filter((t) => t.status !== "completed" && t.status !== "archived" && t.dueDate && t.dueDate > today);
        break;
      case "inbox":
        tasks = tasks.filter((t) => t.status === "inbox");
        break;
      case "completed":
        tasks = tasks.filter((t) => t.status === "completed");
        break;
      case "all":
        tasks = tasks.filter((t) => t.status !== "archived");
        break;
    }
    if (priorityFilter) tasks = tasks.filter((t) => t.priority === priorityFilter);
    if (projectFilter) tasks = tasks.filter((t) => t.projectId === projectFilter);
    if (subjectFilter) tasks = tasks.filter((t) => t.subjectId === subjectFilter);

    tasks.sort((a, b) => {
      if (sortBy === "priority") return priorityWeight(a.priority) - priorityWeight(b.priority);
      if (sortBy === "created") return b.createdAt.localeCompare(a.createdAt);
      if (sortBy === "duration") return (a.estimatedMinutes ?? 9999) - (b.estimatedMinutes ?? 9999);
      return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    });
    return tasks;
  }, [data.tasks, view, priorityFilter, projectFilter, subjectFilter, sortBy]);

  function toggleSelect(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="animate-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-[var(--color-text-dim)]">{filtered.length} tasks in this view</p>
        </div>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => setEditing(null)}>New task</Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={[
            { key: "today", label: "Today" },
            { key: "upcoming", label: "Upcoming" },
            { key: "inbox", label: "Inbox" },
            { key: "completed", label: "Completed" },
            { key: "all", label: "All" },
          ]}
          active={view}
          onChange={(k) => setView(k as ViewKey)}
        />
        <div className="flex flex-wrap gap-2">
          <Select className="w-auto" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">Any priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Select className="w-auto" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="">Any project</option>
            {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select className="w-auto" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="">Any subject</option>
            {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Select className="w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="deadline">Sort: Deadline</option>
            <option value="priority">Sort: Priority</option>
            <option value="created">Sort: Created</option>
            <option value="duration">Sort: Duration</option>
          </Select>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm">
          <span className="text-[var(--color-text-dim)]">{selected.length} selected</span>
          <Button size="sm" variant="secondary" icon={<CheckCheck size={13} />} onClick={() => {
            bulkUpdate("tasks", selected, { status: "completed" });
            push(`${selected.length} tasks completed`, "success");
            setSelected([]);
          }}>Complete</Button>
          <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => {
            bulkRemove("tasks", selected);
            push(`${selected.length} tasks deleted`);
            setSelected([]);
          }}>Delete</Button>
          <button className="ml-auto text-xs text-[var(--color-text-faint)] hover:text-[var(--color-text)]" onClick={() => setSelected([])}>Clear</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={view === "completed" ? "Nothing completed yet" : "You're clear for now."}
          subtitle={view === "inbox" ? "Captured tasks with no home yet will land here." : "New tasks matching this view will show up here."}
          action={<Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setEditing(null)}>Add a task</Button>}
        />
      ) : (
        <div className="flex flex-col gap-1">
          {filtered.map((t) => (
            <TaskItem key={t.id} task={t} onClick={() => setEditing(t)} selected={selected.includes(t.id)} onToggleSelect={() => toggleSelect(t.id)} />
          ))}
        </div>
      )}

      <TaskFormModal open={editing !== undefined} onClose={() => setEditing(undefined)} task={editing} />
    </div>
  );
}
