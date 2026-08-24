import React, { useEffect, useState } from "react";
import { useNexus, logHistory } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { Card, Badge, Button, Input, Select, Textarea, EmptyState, Modal } from "@/components/ui/Primitives";
import { Reminder, RepeatOption, Priority } from "@/types";
import { formatDate, nowISO, todayDateStr } from "@/utils/helpers";
import { Plus, Bell, Trash2, BellRing } from "lucide-react";

export function RemindersPage() {
  const { data, add, update, remove, updateSettings } = useNexus();
  const { push } = useToast();
  const [editing, setEditing] = useState<Reminder | null | undefined>(undefined);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  const sorted = [...data.reminders].sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));

  function requestPermission() {
    if (typeof Notification === "undefined") { push("Notifications aren't supported in this browser", "error"); return; }
    Notification.requestPermission().then((perm) => {
      setPermission(perm);
      updateSettings({ notificationsEnabled: perm === "granted" });
      push(perm === "granted" ? "Notifications enabled" : "Permission not granted", perm === "granted" ? "success" : "error");
    });
  }

  return (
    <div className="animate-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reminders</h1>
          <p className="text-sm text-[var(--color-text-dim)]">{sorted.length} reminders</p>
        </div>
        <div className="flex gap-2">
          {permission !== "granted" && permission !== "unsupported" && (
            <Button variant="secondary" size="sm" icon={<BellRing size={13} />} onClick={requestPermission}>Enable notifications</Button>
          )}
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setEditing(null)}>New reminder</Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="No reminders set." action={<Button size="sm" variant="primary" icon={<Plus size={13} />} onClick={() => setEditing(null)}>Add reminder</Button>} />
      ) : (
        <div className="flex flex-col gap-1">
          {sorted.map((r) => (
            <div key={r.id} onClick={() => setEditing(r)} className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
              <Bell size={16} className="text-[var(--color-text-faint)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{r.title}</p>
                <p className="text-[11px] text-[var(--color-text-faint)]">{formatDate(r.date)} {r.time && `· ${r.time}`} {r.repeat !== "once" && `· repeats ${r.repeat}`}</p>
              </div>
              <Badge tone={r.priority as any}>{r.priority}</Badge>
              <button onClick={(e) => { e.stopPropagation(); remove("reminders", r.id); push("Reminder removed"); }} className="text-[var(--color-text-faint)] hover:text-[var(--color-critical)]"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      <ReminderModal open={editing !== undefined} onClose={() => setEditing(undefined)} reminder={editing} />
    </div>
  );
}

function ReminderModal({ open, onClose, reminder }: { open: boolean; onClose: () => void; reminder?: Reminder | null }) {
  const { add, update, remove } = useNexus();
  const { push } = useToast();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayDateStr());
  const [time, setTime] = useState("");
  const [repeat, setRepeat] = useState<RepeatOption>("once");
  const [priority, setPriority] = useState<Priority>("medium");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title); setDate(reminder.date); setTime(reminder.time || "");
      setRepeat(reminder.repeat); setPriority(reminder.priority); setNotes(reminder.notes || "");
    } else {
      setTitle(""); setDate(todayDateStr()); setTime(""); setRepeat("once"); setPriority("medium"); setNotes("");
    }
  }, [reminder, open]);

  function handleSave() {
    if (!title.trim()) return;
    const payload = { title: title.trim(), date, time: time || undefined, repeat, priority, notes: notes.trim() || undefined };
    if (reminder) { update("reminders", reminder.id, payload); push("Reminder updated"); }
    else { add("reminders", { ...payload, createdAt: nowISO() }); logHistory(add, { type: "reminder_created", title: payload.title as string, relatedType: "reminder" }); push("Reminder set", "success"); }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={reminder ? "Edit reminder" : "New reminder"}>
      <div className="flex flex-col gap-3">
        <Input placeholder="Remind me to..." value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <Select value={repeat} onChange={(e) => setRepeat(e.target.value as RepeatOption)}>
            <option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option><option value="custom">Custom</option>
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </Select>
        </div>
        <Textarea rows={2} placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="mt-1 flex items-center justify-between">
          {reminder ? <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => { remove("reminders", reminder.id); push("Reminder deleted"); onClose(); }}>Delete</Button> : <span />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{reminder ? "Save changes" : "Set reminder"}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
