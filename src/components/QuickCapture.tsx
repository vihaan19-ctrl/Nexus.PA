import React, { useEffect, useState } from "react";
import { useNexus } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { parseQuickCapture } from "@/lib/quickAddParser";
import { formatDate, nowISO } from "@/utils/helpers";
import { Zap } from "lucide-react";
import { Button, Badge } from "@/components/ui/Primitives";

export function QuickCapture({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { add } = useNexus();
  const { push } = useToast();
  const [text, setText] = useState("");

  useEffect(() => { if (open) setText(""); }, [open]);

  if (!open) return null;

  const parsed = text.trim() ? parseQuickCapture(text) : null;

  function confirm() {
    if (!parsed || !parsed.title.trim()) return;
    add("tasks", {
      title: parsed.title,
      status: "inbox",
      priority: parsed.priority || "medium",
      category: parsed.category,
      dueDate: parsed.dueDate,
      tags: [],
      subtasks: [],
      createdAt: nowISO(),
    });
    push("Captured", "success");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[16vh]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-2xl animate-in">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--color-accent)]"><Zap size={13} /> Quick capture</div>
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") onClose(); }}
          placeholder='"Finish physics lecture tomorrow"'
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm outline-none focus-ring"
        />
        {parsed && (
          <div className="mt-3 rounded-lg border border-[var(--color-border-soft)] p-3">
            <p className="mb-2 text-sm">{parsed.title || "..."}</p>
            <div className="flex flex-wrap gap-1.5">
              {parsed.dueDate && <Badge tone="accent">{formatDate(parsed.dueDate)}</Badge>}
              {parsed.priority && <Badge tone={parsed.priority as any}>{parsed.priority}</Badge>}
              {parsed.category && <Badge>{parsed.category}</Badge>}
              {!parsed.dueDate && !parsed.priority && !parsed.category && <span className="text-[11px] text-[var(--color-text-faint)]">No date/priority detected — will be added as-is to Inbox.</span>}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button size="sm" variant="primary" onClick={confirm}>Confirm & create task</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
