import React, { useMemo, useState } from "react";
import { useNexus } from "@/data/store";
import { Card, Tabs } from "@/components/ui/Primitives";
import { addDays, formatMinutes, todayDateStr } from "@/utils/helpers";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

type Range = "today" | "7" | "30" | "all";

function daysBack(n: number) {
  const today = todayDateStr();
  return Array.from({ length: n }, (_, i) => addDays(today, -(n - 1 - i)));
}

export function AnalyticsPage() {
  const { data } = useNexus();
  const [range, setRange] = useState<Range>("7");

  const rangeDays = range === "today" ? 1 : range === "7" ? 7 : range === "30" ? 30 : 90;
  const days = useMemo(() => daysBack(rangeDays), [rangeDays]);
  const startDate = days[0];

  const tasksCompleted = data.tasks.filter((t) => t.completedAt && t.completedAt.slice(0, 10) >= startDate).length;
  const tasksCreated = data.tasks.filter((t) => t.createdAt.slice(0, 10) >= startDate).length;
  const focusSessionsInRange = data.focusSessions.filter((f) => f.completedAt.slice(0, 10) >= startDate);
  const focusMinutes = focusSessionsInRange.reduce((s, f) => s + f.durationMinutes, 0);
  const backlogDone = data.backlogItems.filter((b) => b.status === "done").length;
  const goalsCompleted = data.goals.filter((g) => g.progress >= 100).length;

  const taskCompletionChart = days.map((d) => ({
    date: d.slice(5),
    completed: data.tasks.filter((t) => t.completedAt?.slice(0, 10) === d).length,
  }));

  const focusChart = days.map((d) => ({
    date: d.slice(5),
    minutes: data.focusSessions.filter((f) => f.completedAt.slice(0, 10) === d).reduce((s, f) => s + f.durationMinutes, 0),
  }));

  const projectActivityChart = data.projects.slice(0, 8).map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name,
    activity: p.activity.filter((a) => a.timestamp.slice(0, 10) >= startDate).length,
  }));

  const backlogByType = useMemo(() => {
    const counts: Record<string, number> = {};
    data.backlogItems.filter((b) => b.status !== "done").forEach((b) => { counts[b.type] = (counts[b.type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  }, [data.backlogItems]);

  return (
    <div className="animate-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <Tabs tabs={[{ key: "today", label: "Today" }, { key: "7", label: "7 days" }, { key: "30", label: "30 days" }, { key: "all", label: "All time" }]} active={range} onChange={(k) => setRange(k as Range)} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Tasks completed" value={tasksCompleted} />
        <Stat label="Tasks created" value={tasksCreated} />
        <Stat label="Focus sessions" value={focusSessionsInRange.length} />
        <Stat label="Focus time" value={formatMinutes(focusMinutes)} />
        <Stat label="Backlog cleared" value={backlogDone} />
        <Stat label="Goals completed" value={goalsCompleted} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <p className="mb-3 text-xs font-semibold text-[var(--color-text-dim)]">Task completion</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={taskCompletionChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2025" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#5f6169" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#5f6169" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#131417", border: "1px solid #24262b", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="completed" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <p className="mb-3 text-xs font-semibold text-[var(--color-text-dim)]">Focus time (minutes)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={focusChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2025" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#5f6169" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#5f6169" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#131417", border: "1px solid #24262b", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="minutes" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <p className="mb-3 text-xs font-semibold text-[var(--color-text-dim)]">Project activity</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={projectActivityChart} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: "#5f6169" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: "#9a9ba3" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#131417", border: "1px solid #24262b", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="activity" fill="#a78bfa" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <p className="mb-3 text-xs font-semibold text-[var(--color-text-dim)]">Backlog reduction (by type, pending)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={backlogByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2025" vertical={false} />
              <XAxis dataKey="type" tick={{ fontSize: 9, fill: "#5f6169" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#5f6169" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#131417", border: "1px solid #24262b", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#f0a256" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-3">
      <p className="text-[11px] text-[var(--color-text-faint)]">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </Card>
  );
}
