import { NexusData } from "@/types";
import { formatMinutes, todayDateStr, isOverdue, isToday } from "@/utils/helpers";

// Produces a compact plain-text digest of the user's real data so the AI
// backend can answer grounded questions without the client ever sending
// an API key, and without the model inventing numbers.
export function buildDataContext(data: NexusData): string {
  const today = todayDateStr();
  const lines: string[] = [];

  const dueToday = data.tasks.filter((t) => t.status !== "completed" && t.status !== "archived" && (isToday(t.dueDate) || isOverdue(t.dueDate, t.status)));
  lines.push(`Today's date: ${today}`);
  lines.push(`\nTASKS DUE/OVERDUE TODAY (${dueToday.length}):`);
  dueToday.slice(0, 15).forEach((t) => lines.push(`- [${t.priority}] ${t.title}${t.dueDate && t.dueDate < today ? " (overdue)" : ""}`));

  const activeProjects = data.projects.filter((p) => !["completed", "archived"].includes(p.status));
  lines.push(`\nACTIVE PROJECTS (${activeProjects.length}):`);
  activeProjects.slice(0, 10).forEach((p) => {
    const tasks = data.tasks.filter((t) => t.projectId === p.id);
    const done = tasks.filter((t) => t.status === "completed").length;
    lines.push(`- ${p.name}: ${p.progress}% (${p.status}), ${done}/${tasks.length} tasks done${p.deadline ? `, deadline ${p.deadline}` : ""}`);
  });

  const pendingBacklog = data.backlogItems.filter((b) => b.status !== "done");
  const backlogMinutes = pendingBacklog.reduce((s, b) => s + b.durationMinutes, 0);
  lines.push(`\nBACKLOG: ${pendingBacklog.length} pending items, ${formatMinutes(backlogMinutes)} total remaining.`);
  pendingBacklog.slice(0, 10).forEach((b) => lines.push(`- [${b.priority}] ${b.title} (${formatMinutes(b.durationMinutes)})${b.deadline ? `, due ${b.deadline}` : ""}`));

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  const completedThisWeek = data.tasks.filter((t) => t.completedAt && t.completedAt.slice(0, 10) >= weekAgoStr).length;
  const focusThisWeek = data.focusSessions.filter((f) => f.completedAt.slice(0, 10) >= weekAgoStr);
  const focusMinutesWeek = focusThisWeek.reduce((s, f) => s + f.durationMinutes, 0);
  lines.push(`\nLAST 7 DAYS: ${completedThisWeek} tasks completed, ${formatMinutes(focusMinutesWeek)} focus time across ${focusThisWeek.length} sessions.`);

  lines.push(`\nGOALS (${data.goals.length}):`);
  data.goals.slice(0, 10).forEach((g) => lines.push(`- ${g.title}: ${g.progress}%${g.deadline ? `, deadline ${g.deadline}` : ""}`));

  return lines.join("\n");
}
