import React from "react";
import { useNavigate } from "react-router-dom";
import { Project } from "@/types";
import { Card, Badge, ProgressBar } from "@/components/ui/Primitives";
import { formatDate, isOverdue } from "@/utils/helpers";
import { useNexus, logHistory } from "@/data/store";
import { Cpu, Code2, GraduationCap, User, Folder } from "lucide-react";

const catIcon: Record<string, React.ReactNode> = {
  robotics: <Cpu size={13} />, coding: <Code2 size={13} />, school: <GraduationCap size={13} />,
  personal: <User size={13} />, other: <Folder size={13} />,
};
const statusTone: Record<string, any> = {
  idea: "default", planning: "accent", building: "high", testing: "medium",
  completed: "success", paused: "default", archived: "default",
};

export function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();
  const { add } = useNexus();
  const overdue = isOverdue(project.deadline, project.status === "completed" ? "completed" : "active");
  return (
    <Card
      onClick={() => { logHistory(add, { type: "project_opened", title: project.name, relatedType: "project", relatedId: project.id }); navigate(`/projects/${project.id}`); }}
      className="cursor-pointer p-4 transition-colors hover:border-[var(--color-accent)] animate-in"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[var(--color-text-faint)]">{catIcon[project.category]}<span className="text-[11px] uppercase tracking-wide">{project.category}</span></div>
        <Badge tone={statusTone[project.status]}>{project.status.replace("_", " ")}</Badge>
      </div>
      <h3 className="mb-1 truncate text-sm font-semibold text-[var(--color-text)]">{project.name}</h3>
      {project.description && <p className="mb-3 line-clamp-2 text-xs text-[var(--color-text-dim)]">{project.description}</p>}
      <div className="mb-2 flex items-center justify-between text-[11px] text-[var(--color-text-faint)]">
        <span>Progress</span><span>{project.progress}%</span>
      </div>
      <ProgressBar value={project.progress} tone={project.status === "completed" ? "success" : "accent"} />
      <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--color-text-faint)]">
        <span className={overdue ? "font-medium text-[var(--color-critical)]" : ""}>
          {project.deadline ? `Due ${formatDate(project.deadline)}` : "No deadline"}
        </span>
        <span>{project.activity[0] ? `Updated ${formatDate(project.updatedAt.slice(0,10))}` : ""}</span>
      </div>
    </Card>
  );
}
