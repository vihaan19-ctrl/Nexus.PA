import { parseQuickCapture } from "@/lib/quickAddParser";

export type PendingAction =
  | { kind: "create_task"; title: string; dueDate?: string; priority?: string; category?: string }
  | { kind: "create_reminder"; title: string; date?: string };

const TASK_PATTERNS = [/^(create|add|make)\s+a?\s*task\s*(called|to|for)?\s*/i, /^task:\s*/i];
const REMINDER_PATTERNS = [/^remind me\s*(to|about)?\s*/i, /^(create|add)\s+a?\s*reminder\s*(to|about|for)?\s*/i];

export function detectAction(text: string): PendingAction | null {
  const trimmed = text.trim();

  for (const p of TASK_PATTERNS) {
    if (p.test(trimmed)) {
      const rest = trimmed.replace(p, "");
      const parsed = parseQuickCapture(rest);
      return { kind: "create_task", title: parsed.title, dueDate: parsed.dueDate, priority: parsed.priority, category: parsed.category };
    }
  }
  for (const p of REMINDER_PATTERNS) {
    if (p.test(trimmed)) {
      const rest = trimmed.replace(p, "");
      const parsed = parseQuickCapture(rest);
      return { kind: "create_reminder", title: parsed.title, date: parsed.dueDate };
    }
  }
  return null;
}

export function describeAction(action: PendingAction): string {
  if (action.kind === "create_task") {
    return `Create task "${action.title}"${action.dueDate ? ` due ${action.dueDate}` : ""}${action.priority ? `, ${action.priority} priority` : ""}?`;
  }
  return `Set reminder "${action.title}"${action.date ? ` for ${action.date}` : ""}?`;
}
