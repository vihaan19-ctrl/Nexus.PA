import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, CheckSquare, Calendar, Bell, Timer, FolderKanban, ListTodo,
  Lightbulb, StickyNote, GraduationCap, BookOpen, ClipboardList, BarChart3,
  Target, Sparkles, Settings, ChevronsLeft, ChevronsRight, Video, History,
} from "lucide-react";
import { classNames } from "@/utils/helpers";

interface NavItem { to: string; label: string; icon: React.ReactNode }
interface NavSection { label: string; items: NavItem[] }

const sections: NavSection[] = [
  { label: "Overview", items: [{ to: "/", label: "Dashboard", icon: <LayoutDashboard size={17} /> }] },
  {
    label: "Productivity",
    items: [
      { to: "/tasks", label: "Tasks", icon: <CheckSquare size={17} /> },
      { to: "/calendar", label: "Calendar", icon: <Calendar size={17} /> },
      { to: "/reminders", label: "Reminders", icon: <Bell size={17} /> },
      { to: "/focus", label: "Focus", icon: <Timer size={17} /> },
    ],
  },
  {
    label: "Work",
    items: [
      { to: "/projects", label: "Projects", icon: <FolderKanban size={17} /> },
      { to: "/backlog", label: "Backlog", icon: <ListTodo size={17} /> },
      { to: "/ideas", label: "Ideas", icon: <Lightbulb size={17} /> },
      { to: "/notes", label: "Notes", icon: <StickyNote size={17} /> },
    ],
  },
  {
    label: "School",
    items: [
      { to: "/school", label: "School Hub", icon: <GraduationCap size={17} /> },
      { to: "/school/subjects", label: "Subjects", icon: <BookOpen size={17} /> },
      { to: "/school/assignments", label: "Assignments", icon: <ClipboardList size={17} /> },
      { to: "/school/lectures", label: "Lectures", icon: <Video size={17} /> },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/analytics", label: "Analytics", icon: <BarChart3 size={17} /> },
      { to: "/goals", label: "Goals", icon: <Target size={17} /> },
    ],
  },
  { label: "Intelligence", items: [
    { to: "/ai", label: "NEXUS AI", icon: <Sparkles size={17} /> },
    { to: "/history", label: "History", icon: <History size={17} /> },
  ] },
  { label: "System", items: [{ to: "/settings", label: "Settings", icon: <Settings size={17} /> }] },
];

export function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={onMobileClose} />
      )}
      <aside
        className={classNames(
          "fixed z-50 flex h-full flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-200 md:sticky md:top-0",
          collapsed ? "w-[68px]" : "w-[224px]",
          mobileOpen ? "left-0" : "-left-full md:left-0"
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-accent)] text-[11px] font-bold text-white">N</div>
              <span className="text-sm font-semibold tracking-tight">NEXUS</span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-accent)] text-[11px] font-bold text-white">N</div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {sections.map((section) => (
            <div key={section.label} className="mb-4">
              {!collapsed && (
                <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-faint)]">
                  {section.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      classNames(
                        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors focus-ring",
                        isActive
                          ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                          : "text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                      )
                    }
                  >
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="mx-2 mb-3 flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] py-2 text-xs text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] focus-ring hidden md:flex"
        >
          {collapsed ? <ChevronsRight size={14} /> : <><ChevronsLeft size={14} /> Collapse</>}
        </button>
      </aside>
    </>
  );
}
