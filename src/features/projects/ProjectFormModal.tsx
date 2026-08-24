import React, { useEffect, useState } from "react";
import { Modal, Input, Textarea, Select, Button, Tabs } from "@/components/ui/Primitives";
import { useNexus, logHistory } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { Project, ProjectCategory, ProjectStatus, Priority } from "@/types";
import { nowISO } from "@/utils/helpers";
import { Trash2 } from "lucide-react";

const roboFields: { key: keyof NonNullable<Project["robotics"]>; label: string }[] = [
  { key: "objective", label: "Objective" },
  { key: "hardware", label: "Hardware" },
  { key: "software", label: "Software" },
  { key: "components", label: "Components" },
  { key: "wiring", label: "Wiring" },
  { key: "firmware", label: "Firmware" },
  { key: "mechanicalDesign", label: "Mechanical design" },
  { key: "testing", label: "Testing" },
  { key: "problems", label: "Problems" },
  { key: "solutions", label: "Solutions" },
  { key: "documentation", label: "Documentation" },
];

export function ProjectFormModal({ open, onClose, project }: { open: boolean; onClose: () => void; project?: Project | null }) {
  const { add, update, remove } = useNexus();
  const { push } = useToast();
  const [tab, setTab] = useState("basics");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProjectCategory>("coding");
  const [status, setStatus] = useState<ProjectStatus>("idea");
  const [progress, setProgress] = useState(0);
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [robotics, setRobotics] = useState<NonNullable<Project["robotics"]>>({});

  useEffect(() => {
    if (project) {
      setName(project.name); setDescription(project.description || "");
      setCategory(project.category); setStatus(project.status); setProgress(project.progress);
      setDeadline(project.deadline || ""); setPriority(project.priority);
      setTags(project.tags.join(", ")); setNotes(project.notes || "");
      setRobotics(project.robotics || {});
    } else {
      setName(""); setDescription(""); setCategory("coding"); setStatus("idea");
      setProgress(0); setDeadline(""); setPriority("medium"); setTags(""); setNotes(""); setRobotics({});
    }
    setTab("basics");
  }, [project, open]);

  function handleSave() {
    if (!name.trim()) return;
    const payload: Partial<Project> = {
      name: name.trim(), description: description.trim() || undefined,
      category, status, progress, deadline: deadline || undefined, priority,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      notes: notes.trim() || undefined,
      robotics: category === "robotics" ? robotics : undefined,
      updatedAt: nowISO(),
    };
    if (project) {
      update("projects", project.id, payload);
      push("Project updated");
    } else {
      add("projects", {
        ...payload, milestones: [], resources: [],
        activity: [{ id: crypto.randomUUID?.() || Math.random().toString(36), message: "Project created", timestamp: nowISO() }],
        createdAt: nowISO(),
      });
      logHistory(add, { type: "project_created", title: name.trim() });
      push("Project created", "success");
    }
    onClose();
  }

  function handleDelete() {
    if (project) { remove("projects", project.id); push("Project deleted"); onClose(); }
  }

  return (
    <Modal open={open} onClose={onClose} title={project ? "Edit project" : "New project"} wide>
      <Tabs
        tabs={[{ key: "basics", label: "Basics" }, ...(category === "robotics" ? [{ key: "robotics", label: "Robotics details" }] : [])]}
        active={tab}
        onChange={setTab}
      />
      <div className="mt-4 flex flex-col gap-3">
        {tab === "basics" && (
          <>
            <Input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <Textarea placeholder="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px] text-[var(--color-text-dim)]">Category</label>
                <Select value={category} onChange={(e) => setCategory(e.target.value as ProjectCategory)}>
                  <option value="robotics">Robotics</option>
                  <option value="coding">Coding</option>
                  <option value="school">School</option>
                  <option value="personal">Personal</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-[var(--color-text-dim)]">Status</label>
                <Select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                  <option value="idea">Idea</option>
                  <option value="planning">Planning</option>
                  <option value="building">Building</option>
                  <option value="testing">Testing</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
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
                <label className="mb-1 block text-[11px] text-[var(--color-text-dim)]">Deadline</label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1 flex justify-between text-[11px] text-[var(--color-text-dim)]"><span>Progress</span><span>{progress}%</span></label>
              <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
            </div>
            <Input placeholder="Tags, comma separated" value={tags} onChange={(e) => setTags(e.target.value)} />
            <Textarea placeholder="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </>
        )}
        {tab === "robotics" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {roboFields.map((f) => (
              <div key={f.key} className={f.key === "objective" ? "sm:col-span-2" : ""}>
                <label className="mb-1 block text-[11px] text-[var(--color-text-dim)]">{f.label}</label>
                <Textarea rows={2} value={robotics[f.key] || ""} onChange={(e) => setRobotics((r) => ({ ...r, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-1 flex items-center justify-between">
          {project ? <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={handleDelete}>Delete</Button> : <span />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{project ? "Save changes" : "Create project"}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
