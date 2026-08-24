import React, { useMemo, useState } from "react";
import { useNexus, logHistory } from "@/data/store";
import { Button, Select, Card, Badge, EmptyState } from "@/components/ui/Primitives";
import { BacklogFormModal } from "./BacklogFormModal";
import { BacklogItem } from "@/types";
import { formatDate, formatMinutes, addDays, priorityWeight, todayDateStr } from "@/utils/helpers";
import { Plus, Check, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const typeLabels: Record<string, string> = {
  lecture: "Lecture", homework: "Homework", notebook: "Notebook", revision: "Revision",
  project_task: "Project task", coding_task: "Coding task", personal_task: "Personal task",
};

export function BacklogPage() {
  const { data, update, remove, add } = useNexus();
  const { push } = useToast();
  const [sortBy, setSortBy] = useState("deadline");
  const [editing, setEditing] = useState<BacklogItem | null | undefined>(undefined);
  const [dailyMinutes, setDailyMinutes] = useState(60);

  const pending = useMemo(() => {
    const items = data.backlogItems.filter((i) => i.status !== "done");
    const sorted = items.slice().sort((a, b) => {
      if (sortBy === "oldest") return a.createdAt.localeCompare(b.createdAt);
      if (sortBy === "priority") return priorityWeight(a.priority) - priorityWeight(b.priority);
      if (sortBy === "shortest") return a.durationMinutes - b.durationMinutes;
      if (sortBy === "longest") return b.durationMinutes - a.durationMinutes;
      if (sortBy === "subject") return (a.subjectId || "").localeCompare(b.subjectId || "");
      return (a.deadline || "9999").localeCompare(b.deadline || "9999");
    });
    return sorted;
  }, [data.backlogItems, sortBy]);

  const totalMinutes = pending.reduce((s, i) => s + i.durationMinutes, 0);
  const oldest = pending.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];

  const daysToFinish = dailyMinutes > 0 ? Math.ceil(totalMinutes / dailyMinutes) : 0;
  const completionDate = daysToFinish > 0 ? addDays(todayDateStr(), daysToFinish) : null;

  // Simple planner: distribute items across days respecting dailyMinutes budget
  const plan = useMemo(() => {
    const days: { date: string; items: BacklogItem[]; minutes: number }[] = [];
    let dayIdx = 0;
    let dayItems: BacklogItem[] = [];
    let dayMinutes = 0;
    const queue = pending.slice().sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority));
    for (const item of queue) {
      if (dayMinutes + item.durationMinutes > dailyMinutes && dayItems.length > 0) {
        days.push({ date: addDays(todayDateStr(), dayIdx), items: dayItems, minutes: dayMinutes });
        dayIdx++; dayItems = []; dayMinutes = 0;
      }
      dayItems.push(item);
      dayMinutes += item.durationMinutes;
    }
    if (dayItems.length) days.push({ date: addDays(todayDateStr(), dayIdx), items: dayItems, minutes: dayMinutes });
    return days.slice(0, 14);
  }, [pending, dailyMinutes]);

  function markDone(item: BacklogItem) {
    update("backlogItems", item.id, { status: "done" });
    logHistory(add, { type: "backlog_updated", title: `${item.title} completed`, relatedType: "backlog" });
    push("Marked done", "success");
  }

  return (
    <div className="animate-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Backlog</h1>
          <p className="text-sm text-[var(--color-text-dim)]">{pending.length} pending items</p>
        </div>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => setEditing(null)}>Add item</Button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="mb-1 text-[11px] text-[var(--color-text-faint)]">Total remaining</p>
          <p className="text-2xl font-semibold">{formatMinutes(totalMinutes)}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1 text-[11px] text-[var(--color-text-faint)]">Oldest item</p>
          <p className="truncate text-sm font-medium">{oldest ? oldest.title : "None"}</p>
          <p className="text-[11px] text-[var(--color-text-faint)]">{oldest ? formatDate(oldest.createdAt.slice(0, 10)) : ""}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-1 text-[11px] text-[var(--color-text-faint)]">Plan at</p>
          <div className="flex items-center gap-2">
            <Select className="w-auto" value={dailyMinutes} onChange={(e) => setDailyMinutes(Number(e.target.value))}>
              <option value={30}>30 min/day</option>
              <option value={60}>1 hour/day</option>
              <option value={120}>2 hours/day</option>
            </Select>
          </div>
          {completionDate && <p className="mt-1 text-[11px] text-[var(--color-accent)]">Done by {formatDate(completionDate)} ({daysToFinish}d)</p>}
        </Card>
      </div>

      <div className="mb-3 flex justify-end">
        <Select className="w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="deadline">Sort: Deadline</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="priority">Sort: Priority</option>
          <option value="shortest">Sort: Shortest</option>
          <option value="longest">Sort: Longest</option>
          <option value="subject">Sort: Subject</option>
        </Select>
      </div>

      {pending.length === 0 ? (
        <EmptyState title="Backlog is clear." subtitle="Nice work — nothing pending right now." />
      ) : (
        <div className="flex flex-col gap-1 mb-8">
          {pending.map((item) => {
            const subject = data.subjects.find((s) => s.id === item.subjectId);
            const project = data.projects.find((p) => p.id === item.projectId);
            return (
              <div key={item.id} onClick={() => setEditing(item)} className="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
                <button onClick={(e) => { e.stopPropagation(); markDone(item); }} className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] hover:border-[#4ade80] hover:text-[#4ade80]">
                  <Check size={12} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{item.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--color-text-faint)]">
                    <Badge>{typeLabels[item.type]}</Badge>
                    <span className="flex items-center gap-1"><Clock size={11} />{formatMinutes(item.durationMinutes)}</span>
                    {item.deadline && <span>Due {formatDate(item.deadline)}</span>}
                    {subject && <span>{subject.name}</span>}
                    {project && <span>{project.name}</span>}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); remove("backlogItems", item.id); push("Removed"); }} className="text-[var(--color-text-faint)] opacity-0 hover:text-[var(--color-critical)] group-hover:opacity-100">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {plan.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold">Suggested plan</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plan.map((d, i) => (
              <Card key={d.date} className="p-3">
                <p className="mb-2 text-xs font-medium text-[var(--color-accent)]">{i === 0 ? "Today" : formatDate(d.date)} · {formatMinutes(d.minutes)}</p>
                <div className="flex flex-col gap-1">
                  {d.items.map((it) => <p key={it.id} className="truncate text-xs text-[var(--color-text-dim)]">{it.title}</p>)}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <BacklogFormModal open={editing !== undefined} onClose={() => setEditing(undefined)} item={editing} />
    </div>
  );
}
