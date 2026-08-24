import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNexus } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { Card, Badge, Button, Input, Textarea, Select, EmptyState, Modal, Tabs } from "@/components/ui/Primitives";
import { Idea, IdeaCategory, IdeaStatus } from "@/types";
import { nowISO } from "@/utils/helpers";
import { Plus, Sparkles, ArrowRightCircle, Trash2 } from "lucide-react";

const statusTone: Record<IdeaStatus, any> = { idea: "default", planning: "accent", building: "high", completed: "success", abandoned: "default" };

export function IdeasPage() {
  const { data, add, update, remove } = useNexus();
  const { push } = useToast();
  const navigate = useNavigate();
  const [view, setView] = useState<"all" | IdeaCategory>("all");
  const [quickTitle, setQuickTitle] = useState("");
  const [editing, setEditing] = useState<Idea | null | undefined>(undefined);

  const filtered = useMemo(() => data.ideas.filter((i) => view === "all" || i.category === view), [data.ideas, view]);

  function quickAdd() {
    if (!quickTitle.trim()) return;
    add("ideas", { title: quickTitle.trim(), category: "random", tags: [], status: "idea", createdAt: nowISO() });
    setQuickTitle("");
    push("Idea captured", "success");
  }

  function convertToProject(idea: Idea) {
    const projectId = add("projects", {
      name: idea.title,
      description: idea.description,
      category: idea.category === "websites" ? "coding" : (idea.category as any === "business" || idea.category as any === "random" ? "other" : idea.category),
      status: "planning",
      progress: 0,
      priority: "medium",
      tags: idea.tags,
      milestones: [],
      resources: [],
      activity: [{ id: crypto.randomUUID?.() || Math.random().toString(36), message: "Converted from idea vault", timestamp: nowISO() }],
      createdAt: nowISO(),
      updatedAt: nowISO(),
    });
    update("ideas", idea.id, { status: "planning", convertedProjectId: projectId });
    push("Converted to project", "success");
    navigate(`/projects/${projectId}`);
  }

  return (
    <div className="animate-in">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Sparkles size={18} /> Idea Vault</h1>
          <p className="text-sm text-[var(--color-text-dim)]">Dump ideas instantly, refine later.</p>
        </div>
      </div>

      <div className="mb-5 flex gap-2">
        <Input placeholder="Your next crazy idea..." value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && quickAdd()} />
        <Button variant="primary" icon={<Plus size={15} />} onClick={quickAdd}>Capture</Button>
      </div>

      <div className="mb-4">
        <Tabs
          tabs={[{ key: "all", label: "All" }, { key: "robotics", label: "Robotics" }, { key: "coding", label: "Coding" }, { key: "websites", label: "Websites" }, { key: "business", label: "Business" }, { key: "random", label: "Random" }]}
          active={view}
          onChange={(k) => setView(k as any)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Your next crazy idea goes here." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((idea) => (
            <Card key={idea.id} className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <Badge tone={statusTone[idea.status]}>{idea.status}</Badge>
                <button onClick={() => { remove("ideas", idea.id); push("Idea removed"); }} className="text-[var(--color-text-faint)] hover:text-[var(--color-critical)]"><Trash2 size={13} /></button>
              </div>
              <p className="mb-1 cursor-pointer text-sm font-semibold" onClick={() => setEditing(idea)}>{idea.title}</p>
              {idea.description && <p className="mb-2 line-clamp-2 text-xs text-[var(--color-text-dim)]">{idea.description}</p>}
              <div className="mb-3 flex flex-wrap gap-1.5 text-[11px] text-[var(--color-text-faint)]">
                {idea.difficulty && <Badge>{idea.difficulty}</Badge>}
                {idea.potential && <Badge>{idea.potential} potential</Badge>}
                {idea.estimatedCost && <Badge>{idea.estimatedCost}</Badge>}
              </div>
              {idea.convertedProjectId ? (
                <Button size="sm" variant="secondary" className="w-full" onClick={() => navigate(`/projects/${idea.convertedProjectId}`)}>View project</Button>
              ) : (
                <Button size="sm" variant="outline" icon={<ArrowRightCircle size={13} />} className="w-full" onClick={() => convertToProject(idea)}>Convert to project</Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={editing !== undefined} onClose={() => setEditing(undefined)} title="Edit idea">
        {editing && (
          <div className="flex flex-col gap-3">
            <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <Textarea rows={3} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Description" />
            <div className="grid grid-cols-2 gap-3">
              <Select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as IdeaCategory })}>
                <option value="robotics">Robotics</option><option value="coding">Coding</option>
                <option value="websites">Websites</option><option value="business">Business</option><option value="random">Random</option>
              </Select>
              <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as IdeaStatus })}>
                <option value="idea">Idea</option><option value="planning">Planning</option><option value="building">Building</option>
                <option value="completed">Completed</option><option value="abandoned">Abandoned</option>
              </Select>
              <Select value={editing.difficulty || ""} onChange={(e) => setEditing({ ...editing, difficulty: e.target.value as any })}>
                <option value="">Difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </Select>
              <Select value={editing.potential || ""} onChange={(e) => setEditing({ ...editing, potential: e.target.value as any })}>
                <option value="">Potential</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </Select>
            </div>
            <Input placeholder="Estimated cost" value={editing.estimatedCost || ""} onChange={(e) => setEditing({ ...editing, estimatedCost: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(undefined)}>Cancel</Button>
              <Button variant="primary" onClick={() => { update("ideas", editing.id, editing); push("Idea updated"); setEditing(undefined); }}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
