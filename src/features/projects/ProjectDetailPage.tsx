import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNexus, addProjectActivity } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { Card, Badge, ProgressBar, Tabs, Button, Input, Textarea, EmptyState } from "@/components/ui/Primitives";
import { TaskItem } from "@/features/tasks/TaskItem";
import { TaskFormModal } from "@/features/tasks/TaskFormModal";
import { ProjectFormModal } from "./ProjectFormModal";
import { formatDate, formatMinutes, uid, nowISO } from "@/utils/helpers";
import { ArrowLeft, Plus, Pencil, Trash2, Link as LinkIcon } from "lucide-react";
import { Task, Milestone } from "@/types";

export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, update, remove } = useNexus();
  const { push } = useToast();
  const [tab, setTab] = useState("overview");
  const [editingTask, setEditingTask] = useState<Task | null | undefined>(undefined);
  const [editingProject, setEditingProject] = useState(false);
  const [newMilestone, setNewMilestone] = useState("");
  const [newResourceLabel, setNewResourceLabel] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");

  const project = data.projects.find((p) => p.id === id);
  const projectTasks = useMemo(() => data.tasks.filter((t) => t.projectId === id), [data.tasks, id]);
  const focusSessions = useMemo(() => data.focusSessions.filter((f) => projectTasks.some((t) => t.id === f.taskId)), [data.focusSessions, projectTasks]);

  if (!project) {
    return <EmptyState title="Project not found" action={<Button onClick={() => navigate("/projects")}>Back to projects</Button>} />;
  }

  function addMilestone() {
    if (!newMilestone.trim() || !project) return;
    const m: Milestone = { id: uid(), title: newMilestone.trim(), done: false };
    update("projects", project.id, { milestones: [...project.milestones, m] });
    addProjectActivity(update, project, `Added milestone "${m.title}"`);
    setNewMilestone("");
  }
  function toggleMilestone(m: Milestone) {
    if (!project) return;
    update("projects", project.id, { milestones: project.milestones.map((x) => x.id === m.id ? { ...x, done: !x.done } : x) });
  }
  function addResource() {
    if (!newResourceLabel.trim() || !newResourceUrl.trim() || !project) return;
    update("projects", project.id, { resources: [...project.resources, { id: uid(), label: newResourceLabel, url: newResourceUrl }] });
    setNewResourceLabel(""); setNewResourceUrl("");
  }

  const completedTasks = projectTasks.filter((t) => t.status === "completed").length;
  const totalFocusMinutes = focusSessions.reduce((s, f) => s + f.durationMinutes, 0);

  return (
    <div className="animate-in">
      <button onClick={() => navigate("/projects")} className="mb-3 flex items-center gap-1.5 text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] focus-ring rounded">
        <ArrowLeft size={13} /> All projects
      </button>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
            <Badge tone="accent">{project.status.replace("_", " ")}</Badge>
          </div>
          {project.description && <p className="max-w-xl text-sm text-[var(--color-text-dim)]">{project.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => setEditingProject(true)}>Edit</Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => { remove("projects", project.id); push("Project deleted"); navigate("/projects"); }}>Delete</Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3"><p className="text-[11px] text-[var(--color-text-faint)]">Progress</p><p className="text-lg font-semibold">{project.progress}%</p></Card>
        <Card className="p-3"><p className="text-[11px] text-[var(--color-text-faint)]">Tasks done</p><p className="text-lg font-semibold">{completedTasks}/{projectTasks.length}</p></Card>
        <Card className="p-3"><p className="text-[11px] text-[var(--color-text-faint)]">Deadline</p><p className="text-lg font-semibold">{project.deadline ? formatDate(project.deadline) : "—"}</p></Card>
        <Card className="p-3"><p className="text-[11px] text-[var(--color-text-faint)]">Focus time</p><p className="text-lg font-semibold">{formatMinutes(totalFocusMinutes)}</p></Card>
      </div>

      <Tabs
        tabs={[
          { key: "overview", label: "Overview" }, { key: "tasks", label: "Tasks" },
          { key: "milestones", label: "Milestones" }, { key: "notes", label: "Notes" },
          { key: "resources", label: "Resources" }, { key: "activity", label: "Activity" },
        ]}
        active={tab} onChange={setTab}
      />

      <div className="mt-4">
        {tab === "overview" && (
          <div className="flex flex-col gap-4">
            <Card className="p-4"><p className="mb-2 text-xs font-medium text-[var(--color-text-dim)]">Progress</p><ProgressBar value={project.progress} /></Card>
            {project.robotics && (
              <Card className="p-4">
                <p className="mb-3 text-xs font-medium text-[var(--color-text-dim)]">Robotics details</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Object.entries(project.robotics).filter(([, v]) => v).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[11px] font-medium capitalize text-[var(--color-text-faint)]">{k.replace(/([A-Z])/g, " $1")}</p>
                      <p className="text-sm text-[var(--color-text)]">{v as string}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {tab === "tasks" && (
          <div>
            <div className="mb-3 flex justify-end">
              <Button size="sm" variant="secondary" icon={<Plus size={13} />} onClick={() => setEditingTask(null)}>Add task</Button>
            </div>
            {projectTasks.length === 0 ? <EmptyState title="No tasks linked to this project yet." /> : (
              <div className="flex flex-col gap-1">{projectTasks.map((t) => <TaskItem key={t.id} task={t} onClick={() => setEditingTask(t)} />)}</div>
            )}
          </div>
        )}

        {tab === "milestones" && (
          <div className="flex flex-col gap-2">
            {project.milestones.map((m) => (
              <label key={m.id} className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2">
                <input type="checkbox" checked={m.done} onChange={() => toggleMilestone(m)} />
                <span className={m.done ? "text-[var(--color-text-faint)] line-through" : "text-sm"}>{m.title}</span>
              </label>
            ))}
            <div className="flex gap-2 mt-1">
              <Input placeholder="New milestone" value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMilestone()} />
              <Button variant="secondary" onClick={addMilestone}>Add</Button>
            </div>
          </div>
        )}

        {tab === "notes" && (
          <Textarea rows={8} value={project.notes || ""} onChange={(e) => update("projects", project.id, { notes: e.target.value })} placeholder="Project notes..." />
        )}

        {tab === "resources" && (
          <div className="flex flex-col gap-2">
            {project.resources.map((r) => (
              <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm hover:border-[var(--color-accent)]">
                <LinkIcon size={13} className="text-[var(--color-text-faint)]" /> {r.label}
              </a>
            ))}
            <div className="flex gap-2 mt-1">
              <Input placeholder="Label" value={newResourceLabel} onChange={(e) => setNewResourceLabel(e.target.value)} />
              <Input placeholder="URL" value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)} />
              <Button variant="secondary" onClick={addResource}>Add</Button>
            </div>
          </div>
        )}

        {tab === "activity" && (
          <div className="flex flex-col gap-2">
            {project.activity.length === 0 ? <EmptyState title="No activity yet." /> : project.activity.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm">
                <span>{a.message}</span>
                <span className="text-[11px] text-[var(--color-text-faint)]">{formatDate(a.timestamp.slice(0, 10))}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <TaskFormModal open={editingTask !== undefined} onClose={() => setEditingTask(undefined)} task={editingTask} defaultProjectId={project.id} />
      <ProjectFormModal open={editingProject} onClose={() => setEditingProject(false)} project={project} />
    </div>
  );
}
