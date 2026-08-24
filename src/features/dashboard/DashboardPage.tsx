import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNexus } from "@/data/store";
import { Card, Badge, ProgressBar, Button, EmptyState } from "@/components/ui/Primitives";
import { TaskItem } from "@/features/tasks/TaskItem";
import { TaskFormModal } from "@/features/tasks/TaskFormModal";
import { ProjectCard } from "@/features/projects/ProjectCard";
import { formatMinutes, formatDate, isOverdue, isToday, priorityWeight, todayDateStr } from "@/utils/helpers";
import { CheckCircle2, ListTodo, FolderKanban, Clock, AlertTriangle, Plus, Bell, StickyNote, Lightbulb, Timer } from "lucide-react";
import { Task } from "@/types";
import { AICore, AICoreMini } from "@/components/AICore";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning.";
  if (h < 17) return "Good afternoon.";
  if (h < 21) return "Good evening.";
  return "Good evening.";
}

export function DashboardPage() {
  const { data } = useNexus();
  const navigate = useNavigate();
  const [addingTask, setAddingTask] = useState(false);
  const widgets = data.settings.dashboardWidgets;

  const today = todayDateStr();
  const now = new Date();

  const dueToday = data.tasks.filter((t) => t.status !== "completed" && t.status !== "archived" && (isToday(t.dueDate) || isOverdue(t.dueDate, t.status)));
  const completedToday = data.tasks.filter((t) => t.completedAt && t.completedAt.slice(0, 10) === today).length;
  const activeProjects = data.projects.filter((p) => !["completed", "archived"].includes(p.status));
  const pendingBacklog = data.backlogItems.filter((b) => b.status !== "done");
  const backlogMinutes = pendingBacklog.reduce((s, b) => s + b.durationMinutes, 0);
  const upcomingDeadlines = [
    ...data.tasks.filter((t) => t.dueDate && t.dueDate > today && t.status !== "completed").map((t) => ({ title: t.title, date: t.dueDate!, type: "Task" })),
    ...data.projects.filter((p) => p.deadline && p.deadline > today).map((p) => ({ title: p.name, date: p.deadline!, type: "Project" })),
    ...data.reminders.filter((r) => r.date > today).map((r) => ({ title: r.title, date: r.date, type: "Reminder" })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

  const priorities = dueToday.slice().sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority)).slice(0, 6);
  const focusToday = data.focusSessions.filter((f) => f.completedAt.slice(0, 10) === today);
  const focusMinutesToday = focusToday.reduce((s, f) => s + f.durationMinutes, 0);
  const criticalCount = dueToday.filter((t) => t.priority === "critical").length;

  const contextMessage = dueToday.length === 0
    ? "Nothing urgent on the board right now."
    : criticalCount > 0
      ? `You have ${criticalCount} critical item${criticalCount > 1 ? "s" : ""} today.`
      : `You have ${dueToday.length} task${dueToday.length > 1 ? "s" : ""} today.`;

  const [editing, setEditing] = useState<Task | null | undefined>(undefined);
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const url = (import.meta as any).env?.VITE_AI_BACKEND_URL || "http://localhost:8787";
    fetch(`${url}/api/ai/health`).then((r) => r.json()).then((d) => setAiOnline(!!d.configured)).catch(() => setAiOnline(false));
  }, []);

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{greeting()}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-dim)]">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {contextMessage}
          </p>
        </div>
        <AICore state="idle" size={72} onClick={() => navigate("/ai")} />
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={<ListTodo size={15} />} label="Tasks today" value={dueToday.length} />
        <StatCard icon={<CheckCircle2 size={15} />} label="Completed today" value={completedToday} />
        <StatCard icon={<FolderKanban size={15} />} label="Active projects" value={activeProjects.length} />
        <StatCard icon={<Clock size={15} />} label="Backlog remaining" value={formatMinutes(backlogMinutes)} />
        <StatCard icon={<AlertTriangle size={15} />} label="Upcoming deadlines" value={upcomingDeadlines.length} />
      </div>

      {/* System status */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[11px] text-[var(--color-text-dim)]">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-faint)]">System</span>
        <span className="flex items-center gap-1.5"><AICoreMini state={aiOnline ? "idle" : "idle"} /> AI {aiOnline === null ? "checking..." : aiOnline ? "connected" : "local mode"}</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" /> Database ready</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" /> Voice {typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) ? "available" : "unavailable"}</span>
        <span className="ml-auto font-mono text-[10px] text-[var(--color-text-faint)]">{data.historyEntries.length} logged events</span>
      </div>

      {/* Quick actions */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setAddingTask(true)}>Add task</Button>
        <Button variant="secondary" size="sm" icon={<Bell size={13} />} onClick={() => navigate("/reminders")}>Add reminder</Button>
        <Button variant="secondary" size="sm" icon={<FolderKanban size={13} />} onClick={() => navigate("/projects")}>New project</Button>
        <Button variant="secondary" size="sm" icon={<StickyNote size={13} />} onClick={() => navigate("/notes")}>Add note</Button>
        <Button variant="secondary" size="sm" icon={<Lightbulb size={13} />} onClick={() => navigate("/ideas")}>Add idea</Button>
        <Button variant="secondary" size="sm" icon={<Timer size={13} />} onClick={() => navigate("/focus")}>Start focus</Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          {widgets.includes("priorities") && (
            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Today's priorities</p>
                <Button size="sm" variant="ghost" onClick={() => navigate("/tasks")}>View all</Button>
              </div>
              {priorities.length === 0 ? (
                <EmptyState title="You're clear for now." />
              ) : (
                <div className="flex flex-col gap-1">{priorities.map((t) => <TaskItem key={t.id} task={t} onClick={() => setEditing(t)} />)}</div>
              )}
            </Card>
          )}

          {widgets.includes("projects") && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Active projects</p>
                <Button size="sm" variant="ghost" onClick={() => navigate("/projects")}>View all</Button>
              </div>
              {activeProjects.length === 0 ? (
                <EmptyState title="No active projects yet." action={<Button size="sm" variant="primary" onClick={() => navigate("/projects")}>Create project</Button>} />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {activeProjects.slice(0, 4).map((p) => <ProjectCard key={p.id} project={p} />)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {widgets.includes("upcoming") && (
            <Card className="p-4">
              <p className="mb-3 text-sm font-semibold">Upcoming</p>
              {upcomingDeadlines.length === 0 ? <p className="text-xs text-[var(--color-text-faint)]">Nothing on the horizon.</p> : (
                <div className="flex flex-col gap-2">
                  {upcomingDeadlines.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="truncate text-[var(--color-text)]">{d.title}</span>
                      <Badge>{formatDate(d.date)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {widgets.includes("backlog") && (
            <Card className="p-4">
              <p className="mb-3 text-sm font-semibold">Backlog snapshot</p>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-dim)]">Total remaining</span>
                <span className="font-medium">{formatMinutes(backlogMinutes)}</span>
              </div>
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-dim)]">Pending items</span>
                <span className="font-medium">{pendingBacklog.length}</span>
              </div>
              <Button size="sm" variant="secondary" className="w-full" onClick={() => navigate("/backlog")}>Plan backlog</Button>
            </Card>
          )}

          {widgets.includes("progress") && (
            <Card className="p-4">
              <p className="mb-3 text-sm font-semibold">Daily progress</p>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between"><span className="text-[var(--color-text-dim)]">Tasks completed</span><span className="font-medium">{completedToday}</span></div>
                <div className="flex items-center justify-between"><span className="text-[var(--color-text-dim)]">Focus sessions</span><span className="font-medium">{focusToday.length}</span></div>
                <div className="flex items-center justify-between"><span className="text-[var(--color-text-dim)]">Focus time</span><span className="font-medium">{formatMinutes(focusMinutesToday)}</span></div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <TaskFormModal open={addingTask || editing !== undefined} onClose={() => { setAddingTask(false); setEditing(undefined); }} task={editing} />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[var(--color-text-faint)]">{icon}<span className="text-[11px]">{label}</span></div>
      <p className="text-lg font-semibold">{value}</p>
    </Card>
  );
}
