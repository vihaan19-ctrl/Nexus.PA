import React from "react";
import { Modal } from "@/components/ui/Primitives";
import { CheckSquare, FolderKanban, StickyNote, Lightbulb, Bell, ListTodo } from "lucide-react";

export function QuickAddMenu({
  open, onClose, onPick,
}: { open: boolean; onClose: () => void; onPick: (kind: "task" | "project" | "note" | "idea" | "reminder" | "backlog") => void }) {
  const options: { key: any; label: string; icon: React.ReactNode }[] = [
    { key: "task", label: "Task", icon: <CheckSquare size={16} /> },
    { key: "project", label: "Project", icon: <FolderKanban size={16} /> },
    { key: "note", label: "Note", icon: <StickyNote size={16} /> },
    { key: "idea", label: "Idea", icon: <Lightbulb size={16} /> },
    { key: "reminder", label: "Reminder", icon: <Bell size={16} /> },
    { key: "backlog", label: "Backlog item", icon: <ListTodo size={16} /> },
  ];
  return (
    <Modal open={open} onClose={onClose} title="What do you want to add?">
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => { onPick(o.key); onClose(); }}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-3 text-sm hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
          >
            {o.icon}{o.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}
