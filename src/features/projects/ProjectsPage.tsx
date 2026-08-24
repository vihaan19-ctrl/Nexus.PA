import React, { useMemo, useState } from "react";
import { useNexus } from "@/data/store";
import { Button, Select, EmptyState } from "@/components/ui/Primitives";
import { ProjectCard } from "./ProjectCard";
import { ProjectFormModal } from "./ProjectFormModal";
import { Plus } from "lucide-react";

export function ProjectsPage() {
  const { data } = useNexus();
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    return data.projects.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      return p.status !== "archived" || statusFilter === "archived";
    });
  }, [data.projects, statusFilter, categoryFilter]);

  return (
    <div className="animate-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-[var(--color-text-dim)]">{filtered.length} projects</p>
        </div>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => setCreating(true)}>New project</Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Select className="w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Any status</option>
          <option value="idea">Idea</option>
          <option value="planning">Planning</option>
          <option value="building">Building</option>
          <option value="testing">Testing</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </Select>
        <Select className="w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Any category</option>
          <option value="robotics">Robotics</option>
          <option value="coding">Coding</option>
          <option value="school">School</option>
          <option value="personal">Personal</option>
          <option value="other">Other</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No active projects yet." action={<Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setCreating(true)}>Create project</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      <ProjectFormModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
