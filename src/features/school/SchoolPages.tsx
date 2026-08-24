import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useNexus } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { Card, Badge, ProgressBar, Button, Input, Select, Modal, EmptyState } from "@/components/ui/Primitives";
import { Plus, GraduationCap, Trash2, ArrowLeft } from "lucide-react";
import { Subject, Lecture, LectureStatus, Assignment, TaskStatus } from "@/types";
import { formatDate, nowISO, uid } from "@/utils/helpers";

const lectureStatuses: LectureStatus[] = ["not_started", "watching", "watched", "notes_done", "revised", "completed"];
const lectureLabel: Record<string, string> = {
  not_started: "Not started", watching: "Watching", watched: "Watched",
  notes_done: "Notes done", revised: "Revised", completed: "Completed",
};
const COLORS = ["#6366f1", "#22d3ee", "#a78bfa", "#f0a256", "#4ade80", "#f0576b", "#e0c95c"];

// ---------- Subjects ----------
export function SubjectsPage() {
  const { data, add, remove } = useNexus();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  function createSubject() {
    if (!name.trim()) return;
    add("subjects", { name: name.trim(), color: COLORS[data.subjects.length % COLORS.length], createdAt: nowISO() });
    push("Subject added", "success");
    setName(""); setModalOpen(false);
  }

  return (
    <div className="animate-in">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Subjects</h1>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>New subject</Button>
      </div>
      {data.subjects.length === 0 ? (
        <EmptyState title="No subjects yet." action={<Button size="sm" variant="primary" onClick={() => setModalOpen(true)}>Add subject</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.subjects.map((s) => {
            const lectures = data.lectures.filter((l) => l.subjectId === s.id);
            const done = lectures.filter((l) => l.status === "completed").length;
            const progress = lectures.length ? Math.round((done / lectures.length) * 100) : 0;
            return (
              <Card key={s.id} className="cursor-pointer p-4 hover:border-[var(--color-accent)]" onClick={() => navigate(`/school/subjects/${s.id}`)}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-sm font-semibold">{s.name}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); remove("subjects", s.id); push("Subject removed"); }} className="text-[var(--color-text-faint)] hover:text-[var(--color-critical)]"><Trash2 size={13} /></button>
                </div>
                <p className="mb-2 text-[11px] text-[var(--color-text-faint)]">{lectures.length} lectures · {progress}% complete</p>
                <ProgressBar value={progress} />
              </Card>
            );
          })}
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New subject">
        <div className="flex flex-col gap-3">
          <Input placeholder="Subject name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createSubject()} autoFocus />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={createSubject}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---------- Subject Detail ----------
export function SubjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data } = useNexus();
  const subject = data.subjects.find((s) => s.id === id);
  if (!subject) return <EmptyState title="Subject not found" />;
  const lectures = data.lectures.filter((l) => l.subjectId === id);
  const assignments = data.assignments.filter((a) => a.subjectId === id);
  const pendingLectures = lectures.filter((l) => l.status !== "completed").length;
  const upcomingAssignments = assignments.filter((a) => a.status !== "completed").length;

  return (
    <div className="animate-in">
      <button onClick={() => navigate("/school/subjects")} className="mb-3 flex items-center gap-1.5 text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)]"><ArrowLeft size={13} /> Subjects</button>
      <h1 className="mb-4 text-xl font-semibold tracking-tight flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ background: subject.color }} />{subject.name}
      </h1>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3"><p className="text-[11px] text-[var(--color-text-faint)]">Lectures</p><p className="text-lg font-semibold">{lectures.length}</p></Card>
        <Card className="p-3"><p className="text-[11px] text-[var(--color-text-faint)]">Pending lectures</p><p className="text-lg font-semibold">{pendingLectures}</p></Card>
        <Card className="p-3"><p className="text-[11px] text-[var(--color-text-faint)]">Assignments</p><p className="text-lg font-semibold">{assignments.length}</p></Card>
        <Card className="p-3"><p className="text-[11px] text-[var(--color-text-faint)]">Pending assignments</p><p className="text-lg font-semibold">{upcomingAssignments}</p></Card>
      </div>
      <h2 className="mb-2 text-sm font-semibold">Lectures</h2>
      <div className="mb-6 flex flex-col gap-1">
        {lectures.length === 0 ? <p className="text-xs text-[var(--color-text-faint)]">No lectures yet.</p> : lectures.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm">
            <span>{l.title} {l.chapter && <span className="text-[var(--color-text-faint)]">· {l.chapter}</span>}</span>
            <Badge tone={l.status === "completed" ? "success" : "default"}>{lectureLabel[l.status]}</Badge>
          </div>
        ))}
      </div>
      <h2 className="mb-2 text-sm font-semibold">Assignments</h2>
      <div className="flex flex-col gap-1">
        {assignments.length === 0 ? <p className="text-xs text-[var(--color-text-faint)]">No assignments yet.</p> : assignments.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm">
            <span>{a.title}</span>
            <span className="text-[11px] text-[var(--color-text-faint)]">{a.deadline ? formatDate(a.deadline) : "No deadline"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Lectures ----------
export function LecturesPage() {
  const { data, add, update, remove } = useNexus();
  const { push } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapter, setChapter] = useState("");
  const [duration, setDuration] = useState(30);

  function createLecture() {
    if (!title.trim() || !subjectId) return;
    add("lectures", { title: title.trim(), subjectId, chapter: chapter.trim() || undefined, durationMinutes: duration, status: "not_started", createdAt: nowISO() });
    push("Lecture added", "success");
    setTitle(""); setChapter(""); setDuration(30); setModalOpen(false);
  }

  return (
    <div className="animate-in">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Lectures</h1>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => setModalOpen(true)} disabled={data.subjects.length === 0}>New lecture</Button>
      </div>
      {data.lectures.length === 0 ? (
        <EmptyState title="No lectures tracked yet." subtitle={data.subjects.length === 0 ? "Add a subject first." : undefined} />
      ) : (
        <div className="flex flex-col gap-1">
          {data.lectures.map((l) => {
            const subject = data.subjects.find((s) => s.id === l.subjectId);
            return (
              <div key={l.id} className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{l.title} {l.chapter && <span className="text-[var(--color-text-faint)]">· {l.chapter}</span>}</p>
                  <p className="text-[11px] text-[var(--color-text-faint)]">{subject?.name} · {l.durationMinutes}m</p>
                </div>
                <Select className="w-auto" value={l.status} onChange={(e) => update("lectures", l.id, { status: e.target.value as LectureStatus })}>
                  {lectureStatuses.map((s) => <option key={s} value={s}>{lectureLabel[s]}</option>)}
                </Select>
                <button onClick={() => { remove("lectures", l.id); push("Removed"); }} className="text-[var(--color-text-faint)] hover:text-[var(--color-critical)]"><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New lecture">
        <div className="flex flex-col gap-3">
          <Input placeholder="Lecture title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select subject</option>
            {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Chapter" value={chapter} onChange={(e) => setChapter(e.target.value)} />
            <Input type="number" placeholder="Minutes" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={createLecture}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---------- Assignments ----------
export function AssignmentsPage() {
  const { data, add, update, remove } = useNexus();
  const { push } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);

  function createAssignment() {
    if (!title.trim() || !subjectId) return;
    add("assignments", { title: title.trim(), subjectId, deadline: deadline || undefined, estimatedMinutes, status: "todo", createdAt: nowISO() });
    push("Assignment added", "success");
    setTitle(""); setDeadline(""); setModalOpen(false);
  }

  return (
    <div className="animate-in">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Assignments</h1>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => setModalOpen(true)} disabled={data.subjects.length === 0}>New assignment</Button>
      </div>
      {data.assignments.length === 0 ? (
        <EmptyState title="No assignments tracked yet." subtitle={data.subjects.length === 0 ? "Add a subject first." : undefined} />
      ) : (
        <div className="flex flex-col gap-1">
          {data.assignments.map((a) => {
            const subject = data.subjects.find((s) => s.id === a.subjectId);
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{a.title}</p>
                  <p className="text-[11px] text-[var(--color-text-faint)]">{subject?.name} {a.deadline && `· Due ${formatDate(a.deadline)}`}</p>
                </div>
                <Select className="w-auto" value={a.status} onChange={(e) => update("assignments", a.id, { status: e.target.value as TaskStatus })}>
                  <option value="todo">Todo</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </Select>
                <button onClick={() => { remove("assignments", a.id); push("Removed"); }} className="text-[var(--color-text-faint)] hover:text-[var(--color-critical)]"><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New assignment">
        <div className="flex flex-col gap-3">
          <Input placeholder="Assignment title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select subject</option>
            {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            <Input type="number" placeholder="Est. minutes" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(Number(e.target.value))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={createAssignment}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---------- School Hub ----------
export function SchoolHubPage() {
  const { data } = useNexus();
  const navigate = useNavigate();
  const pendingLectures = data.lectures.filter((l) => l.status !== "completed").length;
  const pendingAssignments = data.assignments.filter((a) => a.status !== "completed").length;

  return (
    <div className="animate-in">
      <h1 className="mb-1 text-xl font-semibold tracking-tight flex items-center gap-2"><GraduationCap size={20} /> School Hub</h1>
      <p className="mb-5 text-sm text-[var(--color-text-dim)]">A snapshot of everything school-related.</p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4"><p className="text-[11px] text-[var(--color-text-faint)]">Subjects</p><p className="text-2xl font-semibold">{data.subjects.length}</p></Card>
        <Card className="p-4"><p className="text-[11px] text-[var(--color-text-faint)]">Pending lectures</p><p className="text-2xl font-semibold">{pendingLectures}</p></Card>
        <Card className="p-4"><p className="text-[11px] text-[var(--color-text-faint)]">Pending assignments</p><p className="text-2xl font-semibold">{pendingAssignments}</p></Card>
        <Card className="p-4"><p className="text-[11px] text-[var(--color-text-faint)]">Backlog (school)</p><p className="text-2xl font-semibold">{data.backlogItems.filter((b) => b.status !== "done" && ["lecture", "homework", "revision", "notebook"].includes(b.type)).length}</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="cursor-pointer p-4 hover:border-[var(--color-accent)]" onClick={() => navigate("/school/subjects")}>
          <p className="text-sm font-semibold">Subjects</p><p className="text-xs text-[var(--color-text-dim)]">Manage subjects and their progress</p>
        </Card>
        <Card className="cursor-pointer p-4 hover:border-[var(--color-accent)]" onClick={() => navigate("/school/lectures")}>
          <p className="text-sm font-semibold">Lectures</p><p className="text-xs text-[var(--color-text-dim)]">Track watch/notes/revision status</p>
        </Card>
        <Card className="cursor-pointer p-4 hover:border-[var(--color-accent)]" onClick={() => navigate("/school/assignments")}>
          <p className="text-sm font-semibold">Assignments</p><p className="text-xs text-[var(--color-text-dim)]">Deadlines and status</p>
        </Card>
      </div>
    </div>
  );
}
