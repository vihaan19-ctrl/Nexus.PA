import React, { useEffect, useState } from "react";
import { Modal, Input, Select, Textarea, Button } from "@/components/ui/Primitives";
import { useNexus } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { BacklogItem, BacklogType, Priority } from "@/types";
import { nowISO } from "@/utils/helpers";
import { Trash2 } from "lucide-react";

export function BacklogFormModal({ open, onClose, item }: { open: boolean; onClose: () => void; item?: BacklogItem | null }) {
  const { add, update, remove, data } = useNexus();
  const { push } = useToast();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<BacklogType>("lecture");
  const [subjectId, setSubjectId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [duration, setDuration] = useState(30);
  const [priority, setPriority] = useState<Priority>("medium");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) {
      setTitle(item.title); setType(item.type); setSubjectId(item.subjectId || "");
      setProjectId(item.projectId || ""); setDuration(item.durationMinutes); setPriority(item.priority);
      setDeadline(item.deadline || ""); setNotes(item.notes || "");
    } else {
      setTitle(""); setType("lecture"); setSubjectId(""); setProjectId(""); setDuration(30);
      setPriority("medium"); setDeadline(""); setNotes("");
    }
  }, [item, open]);

  function handleSave() {
    if (!title.trim()) return;
    const payload: Partial<BacklogItem> = {
      title: title.trim(), type, subjectId: subjectId || undefined, projectId: projectId || undefined,
      durationMinutes: duration, priority, deadline: deadline || undefined, notes: notes.trim() || undefined,
    };
    if (item) { update("backlogItems", item.id, payload); push("Backlog item updated"); }
    else { add("backlogItems", { ...payload, status: "pending", createdAt: nowISO() }); push("Added to backlog", "success"); }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={item ? "Edit backlog item" : "New backlog item"}>
      <div className="flex flex-col gap-3">
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <Select value={type} onChange={(e) => setType(e.target.value as BacklogType)}>
            <option value="lecture">Lecture</option>
            <option value="homework">Homework</option>
            <option value="notebook">Notebook work</option>
            <option value="revision">Revision</option>
            <option value="project_task">Project task</option>
            <option value="coding_task">Coding task</option>
            <option value="personal_task">Personal task</option>
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">No subject</option>
            {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">No project</option>
            {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Input type="number" min={5} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} placeholder="Minutes" />
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <Textarea rows={2} placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="mt-1 flex items-center justify-between">
          {item ? <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => { remove("backlogItems", item.id); push("Removed"); onClose(); }}>Delete</Button> : <span />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{item ? "Save changes" : "Add to backlog"}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
