import React from "react";
import { Task } from "@/types";
import { Badge } from "@/components/ui/Primitives";
import { formatDate, isOverdue, classNames } from "@/utils/helpers";
import { Check, FolderKanban, BookOpen } from "lucide-react";
import { useNexus, logHistory } from "@/data/store";
import { nowISO } from "@/utils/helpers";

const priorityTone: Record<string, any> = { critical: "critical", high: "high", medium: "medium", low: "low" };

export function TaskItem({
  task, onClick, selected, onToggleSelect,
}: { task: Task; onClick: () => void; selected?: boolean; onToggleSelect?: () => void }) {
  const { update, data, add } = useNexus();
  const done = task.status === "completed";
  const project = data.projects.find((p) => p.id === task.projectId);
  const subject = data.subjects.find((s) => s.id === task.subjectId);
  const overdue = isOverdue(task.dueDate, task.status);

  function toggleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    update("tasks", task.id, {
      status: done ? "todo" : "completed",
      completedAt: done ? undefined : nowISO(),
    });
    if (!done) logHistory(add, { type: "task_completed", title: task.title, relatedType: "task" });
  }

  return (
    <div
      onClick={onClick}
      className={classNames(
        "group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors",
        selected && "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
      )}
    >
      {onToggleSelect && (
        <input type="checkbox" checked={!!selected} onClick={(e) => e.stopPropagation()} onChange={onToggleSelect} className="shrink-0" />
      )}
      <button
        onClick={toggleComplete}
        className={classNames(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          done ? "border-[#4ade80] bg-[#4ade80] text-black" : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
        )}
      >
        {done && <Check size={12} />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={classNames("truncate text-sm", done ? "text-[var(--color-text-faint)] line-through" : "text-[var(--color-text)]")}>
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
          {task.dueDate && (
            <span className={classNames("text-[11px]", overdue ? "text-[var(--color-critical)] font-medium" : "text-[var(--color-text-faint)]")}>
              {formatDate(task.dueDate)}
            </span>
          )}
          {project && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-faint)]"><FolderKanban size={11} />{project.name}</span>
          )}
          {subject && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-faint)]"><BookOpen size={11} />{subject.name}</span>
          )}
          {task.subtasks.length > 0 && (
            <span className="text-[11px] text-[var(--color-text-faint)]">
              {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
