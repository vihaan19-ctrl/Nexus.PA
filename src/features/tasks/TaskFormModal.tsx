import React, { useState, useEffect } from "react";
import { Modal, Input, Textarea, Select, Button } from "@/components/ui/Primitives";
import { useNexus, logHistory } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { Task, Priority, TaskStatus } from "@/types";
import { nowISO, uid } from "@/utils/helpers";
import { Trash2, Plus } from "lucide-react";

export function TaskFormModal({ open, onClose, task, defaultProjectId, defaultSubjectId }: { open: boolean; onClose: () => void; task?: Task | null; defaultProjectId?: string; defaultSubjectId?: string }) {
  const { add, update, remove, data } = useNexus();
  const { push } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | "">("");
  const [projectId, setProjectId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [tags, setTags] = useState("");
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; done: boolean }[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setCategory(task.category || "");
      setDueDate(task.dueDate || "");
      setDueTime(task.dueTime || "");
      setEstimatedMinutes(task.estimatedMinutes ?? "");
      setProjectId(task.projectId || "");
      setSubjectId(task.subjectId || "");
      setTags(task.tags.join(", "));
      setSubtasks(task.subtasks || []);
      setNotes(task.notes || "");
    } else {
      setTitle(""); setDescription(""); setStatus("todo"); setPriority("medium");
      setCategory(""); setDueDate(""); setDueTime(""); setEstimatedMinutes("");
      setProjectId(defaultProjectId || ""); setSubjectId(defaultSubjectId || ""); setTags(""); setSubtasks([]); setNotes("");
    }
  }, [task, open, defaultProjectId, defaultSubjectId]);

  function handleSave() {
    if (!title.trim()) return;
    const payload: Partial<Task> = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      category: category.trim() || undefined,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      estimatedMinutes: estimatedMinutes === "" ? undefined : Number(estimatedMinutes),
      projectId: projectId || undefined,
      subjectId: subjectId || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      subtasks,
      notes: notes.trim() || undefined,
    };
    if (task) {
      update("tasks", task.id, payload);
      push("Task updated");
    } else {
      add("tasks", { ...payload, createdAt: nowISO() });
      logHistory(add, { type: "task_created", title: payload.title as string, relatedType: "task" });
      push("Task created", "success");
    }
    onClose();
  }

  function handleDelete() {
    if (task) {
      remove("tasks", task.id);
      push("Task deleted");
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? "Edit task" : "New task"} wide>
      <div className="flex flex-col gap-3">
        <Input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <Textarea placeholder="Description (optional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-[11px] text-[var(--color-text-dim)]">Status</label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              <option value="inbox">Inbox</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-[var(--color-text-dim)]">Priority</label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-[var(--color-text-dim)]">Due date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-[var(--color-text-dim)]">Due time</label>
            <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-[11px] text-[var(--color-text-dim)]">Category</label>
            <Input placeholder="e.g. School" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-[var(--color-text-dim)]">Est. minutes</label>
            <Input type="number" min={0} value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-[var(--color-text-dim)]">Project</label>
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">None</option>
              {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-[var(--color-text-dim)]">Subject</label>
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">None</option>
              {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
        </div>

        <Input placeholder="Tags, comma separated" value={tags} onChange={(e) => setTags(e.target.value)} />

        <div>
          <label className="mb-1 block text-[11px] text-[var(--color-text-dim)]">Subtasks</label>
          <div className="flex flex-col gap-1.5">
            {subtasks.map((st) => (
              <div key={st.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={st.done}
                  onChange={(e) => setSubtasks((prev) => prev.map((s) => s.id === st.id ? { ...s, done: e.target.checked } : s))}
                />
                <span className="flex-1 text-sm">{st.title}</span>
                <button onClick={() => setSubtasks((prev) => prev.filter((s) => s.id !== st.id))} className="text-[var(--color-text-faint)] hover:text-[var(--color-critical)]">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Add subtask + Enter"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newSubtask.trim()) {
                    setSubtasks((prev) => [...prev, { id: uid(), title: newSubtask.trim(), done: false }]);
                    setNewSubtask("");
                  }
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                icon={<Plus size={13} />}
                onClick={() => {
                  if (newSubtask.trim()) {
                    setSubtasks((prev) => [...prev, { id: uid(), title: newSubtask.trim(), done: false }]);
                    setNewSubtask("");
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        <Textarea placeholder="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="mt-1 flex items-center justify-between">
          {task ? (
            <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={handleDelete}>Delete</Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{task ? "Save changes" : "Create task"}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
