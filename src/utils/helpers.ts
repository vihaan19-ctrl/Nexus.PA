export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return "No date";
  const d = new Date(dateStr);
  const today = new Date();
  const diffDays = Math.round((d.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatMinutes(mins: number): string {
  if (mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function isOverdue(dateStr?: string, status?: string): boolean {
  if (!dateStr) return false;
  if (status === "completed" || status === "done" || status === "archived") return false;
  return dateStr < todayDateStr();
}

export function isToday(dateStr?: string): boolean {
  return !!dateStr && dateStr === todayDateStr();
}

export function classNames(...args: (string | false | undefined | null)[]): string {
  return args.filter(Boolean).join(" ");
}

export function priorityWeight(p: string): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[p] ?? 4;
}
