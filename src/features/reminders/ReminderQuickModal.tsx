import React, { useState } from "react";
import { Modal, Input, Select, Button } from "@/components/ui/Primitives";
import { useNexus, logHistory } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { Priority, RepeatOption } from "@/types";
import { nowISO, todayDateStr } from "@/utils/helpers";

export function ReminderQuickModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { add } = useNexus();
  const { push } = useToast();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayDateStr());
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [repeat, setRepeat] = useState<RepeatOption>("once");

  function handleSave() {
    if (!title.trim()) return;
    add("reminders", { title: title.trim(), date, time: time || undefined, repeat, priority, createdAt: nowISO() });
    logHistory(add, { type: "reminder_created", title: title.trim(), relatedType: "reminder" });
    push("Reminder set", "success");
    setTitle(""); setDate(todayDateStr()); setTime("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="New reminder">
      <div className="flex flex-col gap-3">
        <Input placeholder="Remind me to..." value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <Select value={repeat} onChange={(e) => setRepeat(e.target.value as RepeatOption)}>
            <option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </Select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Set reminder</Button>
        </div>
      </div>
    </Modal>
  );
}
