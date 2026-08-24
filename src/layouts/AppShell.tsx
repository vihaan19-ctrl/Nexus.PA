import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandPalette } from "@/components/CommandPalette";
import { QuickCapture } from "@/components/QuickCapture";
import { QuickAddMenu } from "@/components/QuickAddMenu";
import { TaskFormModal } from "@/features/tasks/TaskFormModal";
import { ProjectFormModal } from "@/features/projects/ProjectFormModal";
import { NoteQuickModal } from "@/features/notes/NoteQuickModal";
import { IdeaQuickModal } from "@/features/ideas/IdeaQuickModal";
import { ReminderQuickModal } from "@/features/reminders/ReminderQuickModal";
import { BacklogFormModal } from "@/features/backlog/BacklogFormModal";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showBacklogForm, setShowBacklogForm] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isCtrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      const isCaptureShortcut = (e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "Space";
      if (isCtrlK) { e.preventDefault(); setPaletteOpen((o) => !o); }
      if (isCaptureShortcut) { e.preventDefault(); setCaptureOpen((o) => !o); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function handleQuickAddPick(kind: string) {
    if (kind === "task") setShowTaskForm(true);
    if (kind === "project") setShowProjectForm(true);
    if (kind === "note") setShowNoteForm(true);
    if (kind === "idea") setShowIdeaForm(true);
    if (kind === "reminder") setShowReminderForm(true);
    if (kind === "backlog") setShowBacklogForm(true);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar
          onMobileMenu={() => setMobileOpen(true)}
          onOpenSearch={() => setPaletteOpen(true)}
          onOpenCapture={() => setCaptureOpen(true)}
          onOpenQuickAdd={() => setQuickAddOpen(true)}
        />
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNewTask={() => setShowTaskForm(true)}
        onNewProject={() => setShowProjectForm(true)}
        onNewNote={() => setShowNoteForm(true)}
        onNewIdea={() => setShowIdeaForm(true)}
        onNewReminder={() => setShowReminderForm(true)}
      />
      <QuickCapture open={captureOpen} onClose={() => setCaptureOpen(false)} />
      <QuickAddMenu open={quickAddOpen} onClose={() => setQuickAddOpen(false)} onPick={handleQuickAddPick} />

      <TaskFormModal open={showTaskForm} onClose={() => setShowTaskForm(false)} task={null} />
      <ProjectFormModal open={showProjectForm} onClose={() => setShowProjectForm(false)} />
      <NoteQuickModal open={showNoteForm} onClose={() => setShowNoteForm(false)} />
      <IdeaQuickModal open={showIdeaForm} onClose={() => setShowIdeaForm(false)} />
      <ReminderQuickModal open={showReminderForm} onClose={() => setShowReminderForm(false)} />
      <BacklogFormModal open={showBacklogForm} onClose={() => setShowBacklogForm(false)} />
    </div>
  );
}
