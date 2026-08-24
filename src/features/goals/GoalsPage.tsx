import React, { useEffect, useState } from "react";
import { useNexus } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { Card, Badge, Button, Input, Textarea, Select, ProgressBar, EmptyState, Modal } from "@/components/ui/Primitives";
import { Goal, GoalType } from "@/types";
import { formatDate, nowISO, todayDateStr } from "@/utils/helpers";
import { Plus, Target, Trash2 } from "lucide-react";

export function GoalsPage() {
  const { data, remove } = useNexus();
  const { push } = useToast();
  const [editing, setEditing] = useState<Goal | null | undefined>(undefined);

  return (
    <div className="animate-in">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Target size={18} /> Goals</h1>
          <p className="text-sm text-[var(--color-text-dim)]">{data.goals.length} goals</p>
        </div>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => setEditing(null)}>New goal</Button>
      </div>

      {data.goals.length === 0 ? (
        <EmptyState title="No goals set yet." action={<Button size="sm" variant="primary" icon={<Plus size={13} />} onClick={() => setEditing(null)}>Add a goal</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.goals.map((g) => {
            const linkedProjects = data.projects.filter((p) => g.linkedProjectIds.includes(p.id));
            const linkedTasks = data.tasks.filter((t) => g.linkedTaskIds.includes(t.id));
            const remaining = g.deadline ? Math.max(0, Math.ceil((new Date(g.deadline).getTime() - new Date(todayDateStr()).getTime()) / 86400000)) : null;
            return (
              <Card key={g.id} className="cursor-pointer p-4 hover:border-[var(--color-accent)]" onClick={() => setEditing(g)}>
                <div className="mb-2 flex items-center justify-between">
                  <Badge>{g.type}</Badge>
                  <button onClick={(e) => { e.stopPropagation(); remove("goals", g.id); push("Goal removed"); }} className="text-[var(--color-text-faint)] hover:text-[var(--color-critical)]"><Trash2 size={13} /></button>
                </div>
                <p className="mb-2 text-sm font-semibold">{g.title}</p>
                <div className="mb-2 flex items-center justify-between text-[11px] text-[var(--color-text-faint)]"><span>Progress</span><span>{g.progress}%</span></div>
                <ProgressBar value={g.progress} tone={g.progress >= 100 ? "success" : "accent"} />
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-faint)]">
                  {g.deadline && <span>{remaining}d left</span>}
                  {linkedProjects.length > 0 && <span>{linkedProjects.length} project(s)</span>}
                  {linkedTasks.length > 0 && <span>{linkedTasks.length} task(s)</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <GoalModal open={editing !== undefined} onClose={() => setEditing(undefined)} goal={editing} />
    </div>
  );
}

function GoalModal({ open, onClose, goal }: { open: boolean; onClose: () => void; goal?: Goal | null }) {
  const { add, update, remove, data } = useNexus();
  const { push } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<GoalType>("personal");
  const [deadline, setDeadline] = useState("");
  const [progress, setProgress] = useState(0);
  const [linkedProjectIds, setLinkedProjectIds] = useState<string[]>([]);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title); setDescription(goal.description || ""); setType(goal.type);
      setDeadline(goal.deadline || ""); setProgress(goal.progress); setLinkedProjectIds(goal.linkedProjectIds);
    } else {
      setTitle(""); setDescription(""); setType("personal"); setDeadline(""); setProgress(0); setLinkedProjectIds([]);
    }
  }, [goal, open]);

  function toggleProject(id: string) {
    setLinkedProjectIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleSave() {
    if (!title.trim()) return;
    const payload: Partial<Goal> = { title: title.trim(), description: description.trim() || undefined, type, deadline: deadline || undefined, progress, linkedProjectIds };
    if (goal) { update("goals", goal.id, payload); push("Goal updated"); }
    else { add("goals", { ...payload, milestones: [], linkedTaskIds: [], createdAt: nowISO() }); push("Goal created", "success"); }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={goal ? "Edit goal" : "New goal"}>
      <div className="flex flex-col gap-3">
        <Input placeholder="Goal title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <Textarea rows={2} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Select value={type} onChange={(e) => setType(e.target.value as GoalType)}>
            <option value="school">School</option><option value="coding">Coding</option><option value="robotics">Robotics</option>
            <option value="personal">Personal</option><option value="projects">Projects</option>
          </Select>
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 flex justify-between text-[11px] text-[var(--color-text-dim)]"><span>Progress</span><span>{progress}%</span></label>
          <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-[var(--color-text-dim)]">Linked projects</label>
          <div className="flex flex-wrap gap-1.5">
            {data.projects.map((p) => (
              <button key={p.id} onClick={() => toggleProject(p.id)} className={`rounded-full border px-2.5 py-1 text-[11px] ${linkedProjectIds.includes(p.id) ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]" : "border-[var(--color-border)] text-[var(--color-text-dim)]"}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between">
          {goal ? <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => { remove("goals", goal.id); push("Goal deleted"); onClose(); }}>Delete</Button> : <span />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{goal ? "Save changes" : "Create goal"}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
