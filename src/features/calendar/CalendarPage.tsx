import React, { useMemo, useState } from "react";
import { useNexus } from "@/data/store";
import { Card, Badge, Button, Tabs, Modal } from "@/components/ui/Primitives";
import { classNames, formatDate, todayDateStr } from "@/utils/helpers";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TaskFormModal } from "@/features/tasks/TaskFormModal";

interface AggEvent { id: string; title: string; date: string; type: string; source: any }

function useAllEvents() {
  const { data } = useNexus();
  return useMemo(() => {
    const events: AggEvent[] = [];
    data.tasks.forEach((t) => t.dueDate && events.push({ id: `task-${t.id}`, title: t.title, date: t.dueDate, type: "task", source: t }));
    data.reminders.forEach((r) => events.push({ id: `rem-${r.id}`, title: r.title, date: r.date, type: "reminder", source: r }));
    data.assignments.forEach((a) => a.deadline && events.push({ id: `asg-${a.id}`, title: a.title, date: a.deadline, type: "assignment", source: a }));
    data.projects.forEach((p) => p.deadline && events.push({ id: `proj-${p.id}`, title: `${p.name} deadline`, date: p.deadline, type: "milestone", source: p }));
    data.calendarEvents.forEach((c) => events.push({ id: `ce-${c.id}`, title: c.title, date: c.date, type: c.type, source: c }));
    return events;
  }, [data]);
}

const typeTone: Record<string, any> = { task: "accent", reminder: "medium", assignment: "high", test: "critical", milestone: "success", deadline: "critical" };

export function CalendarPage() {
  const events = useAllEvents();
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month");
  const [cursor, setCursor] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<AggEvent | null>(null);
  const [creatingTask, setCreatingTask] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    const map: Record<string, AggEvent[]> = {};
    events.forEach((e) => { (map[e.date] ||= []).push(e); });
    return map;
  }, [events]);

  return (
    <div className="animate-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Calendar</h1>
        <Tabs tabs={[{ key: "month", label: "Month" }, { key: "week", label: "Week" }, { key: "day", label: "Day" }, { key: "agenda", label: "Agenda" }]} active={view} onChange={(k) => setView(k as any)} />
      </div>

      {view === "month" && <MonthView cursor={cursor} setCursor={setCursor} eventsByDate={eventsByDate} onSelectEvent={setSelectedEvent} onCreate={setCreatingTask} />}
      {view === "week" && <WeekView cursor={cursor} setCursor={setCursor} eventsByDate={eventsByDate} onSelectEvent={setSelectedEvent} />}
      {view === "day" && <DayView cursor={cursor} setCursor={setCursor} eventsByDate={eventsByDate} onSelectEvent={setSelectedEvent} />}
      {view === "agenda" && <AgendaView events={events} onSelectEvent={setSelectedEvent} />}

      <Modal open={!!selectedEvent} onClose={() => setSelectedEvent(null)} title={selectedEvent?.title}>
        {selectedEvent && (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2"><Badge tone={typeTone[selectedEvent.type]}>{selectedEvent.type}</Badge><span className="text-[var(--color-text-dim)]">{formatDate(selectedEvent.date)}</span></div>
            {selectedEvent.source?.notes && <p className="text-[var(--color-text-dim)]">{selectedEvent.source.notes}</p>}
          </div>
        )}
      </Modal>
      <TaskFormModal open={!!creatingTask} onClose={() => setCreatingTask(null)} task={null} />
    </div>
  );
}

function MonthView({ cursor, setCursor, eventsByDate, onSelectEvent, onCreate }: any) {
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startOffset).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  while (cells.length % 7 !== 0) cells.push(null);
  const today = todayDateStr();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]"><ChevronLeft size={18} /></button>
        <p className="text-sm font-semibold">{cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]"><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[var(--color-text-faint)] mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents: AggEvent[] = eventsByDate[dateStr] || [];
          return (
            <Card key={i} className={classNames("min-h-[80px] p-1.5", dateStr === today && "border-[var(--color-accent)]")}>
              <p className={classNames("mb-1 text-[11px]", dateStr === today ? "font-bold text-[var(--color-accent)]" : "text-[var(--color-text-faint)]")}>{day}</p>
              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <button key={e.id} onClick={() => onSelectEvent(e)} className="truncate rounded bg-[var(--color-surface-2)] px-1 py-0.5 text-left text-[10px] hover:bg-[var(--color-accent-soft)]">
                    {e.title}
                  </button>
                ))}
                {dayEvents.length > 3 && <p className="text-[10px] text-[var(--color-text-faint)]">+{dayEvents.length - 3} more</p>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ cursor, setCursor, eventsByDate, onSelectEvent }: any) {
  const start = new Date(cursor);
  start.setDate(cursor.getDate() - cursor.getDay());
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const today = todayDateStr();
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setCursor(new Date(cursor.getTime() - 7 * 86400000))} className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]"><ChevronLeft size={18} /></button>
        <p className="text-sm font-semibold">{days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {days[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
        <button onClick={() => setCursor(new Date(cursor.getTime() + 7 * 86400000))} className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]"><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const dateStr = d.toISOString().slice(0, 10);
          const dayEvents: AggEvent[] = eventsByDate[dateStr] || [];
          return (
            <Card key={dateStr} className={classNames("min-h-[140px] p-2", dateStr === today && "border-[var(--color-accent)]")}>
              <p className="mb-1.5 text-[11px] font-medium text-[var(--color-text-dim)]">{d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}</p>
              <div className="flex flex-col gap-1">
                {dayEvents.map((e) => (
                  <button key={e.id} onClick={() => onSelectEvent(e)} className="truncate rounded bg-[var(--color-surface-2)] px-1.5 py-1 text-left text-[11px] hover:bg-[var(--color-accent-soft)]">{e.title}</button>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ cursor, setCursor, eventsByDate, onSelectEvent }: any) {
  const dateStr = cursor.toISOString().slice(0, 10);
  const dayEvents: AggEvent[] = eventsByDate[dateStr] || [];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setCursor(new Date(cursor.getTime() - 86400000))} className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]"><ChevronLeft size={18} /></button>
        <p className="text-sm font-semibold">{cursor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        <button onClick={() => setCursor(new Date(cursor.getTime() + 86400000))} className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]"><ChevronRight size={18} /></button>
      </div>
      {dayEvents.length === 0 ? <p className="text-sm text-[var(--color-text-faint)]">Nothing scheduled.</p> : (
        <div className="flex flex-col gap-1.5">
          {dayEvents.map((e) => (
            <div key={e.id} onClick={() => onSelectEvent(e)} className="cursor-pointer rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm hover:border-[var(--color-accent)]">
              <div className="flex items-center gap-2"><Badge tone={typeTone[e.type]}>{e.type}</Badge>{e.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AgendaView({ events, onSelectEvent }: { events: AggEvent[]; onSelectEvent: (e: AggEvent) => void }) {
  const today = todayDateStr();
  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const grouped: Record<string, AggEvent[]> = {};
  upcoming.forEach((e) => { (grouped[e.date] ||= []).push(e); });
  return (
    <div className="flex flex-col gap-4">
      {Object.entries(grouped).length === 0 && <p className="text-sm text-[var(--color-text-faint)]">Nothing upcoming.</p>}
      {Object.entries(grouped).map(([date, evs]) => (
        <div key={date}>
          <p className="mb-1.5 text-xs font-semibold text-[var(--color-text-dim)]">{formatDate(date)}</p>
          <div className="flex flex-col gap-1">
            {evs.map((e) => (
              <div key={e.id} onClick={() => onSelectEvent(e)} className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
                <Badge tone={typeTone[e.type]}>{e.type}</Badge>{e.title}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
