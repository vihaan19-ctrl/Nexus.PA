import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NexusProvider } from "@/data/store";
import { ToastProvider } from "@/hooks/useToast";
import { AppShell } from "@/layouts/AppShell";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { TasksPage } from "@/features/tasks/TasksPage";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { ProjectDetailPage } from "@/features/projects/ProjectDetailPage";
import { BacklogPage } from "@/features/backlog/BacklogPage";
import { SchoolHubPage, SubjectsPage, SubjectDetailPage, LecturesPage, AssignmentsPage } from "@/features/school/SchoolPages";
import { NotesPage } from "@/features/notes/NotesPage";
import { IdeasPage } from "@/features/ideas/IdeasPage";
import { CalendarPage } from "@/features/calendar/CalendarPage";
import { RemindersPage } from "@/features/reminders/RemindersPage";
import { FocusPage } from "@/features/focus/FocusPage";
import { GoalsPage } from "@/features/goals/GoalsPage";
import { AnalyticsPage } from "@/features/analytics/AnalyticsPage";
import { AIPage } from "@/features/ai/AIPage";
import { HistoryPage } from "@/features/history/HistoryPage";
import { SettingsPage } from "@/features/settings/SettingsPage";

export default function App() {
  return (
    <NexusProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/backlog" element={<BacklogPage />} />
              <Route path="/school" element={<SchoolHubPage />} />
              <Route path="/school/subjects" element={<SubjectsPage />} />
              <Route path="/school/subjects/:id" element={<SubjectDetailPage />} />
              <Route path="/school/lectures" element={<LecturesPage />} />
              <Route path="/school/assignments" element={<AssignmentsPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/ideas" element={<IdeasPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/reminders" element={<RemindersPage />} />
              <Route path="/focus" element={<FocusPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/ai" element={<AIPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </NexusProvider>
  );
}
