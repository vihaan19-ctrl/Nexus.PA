// ===== Shared =====
export type ID = string;

export type Priority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "inbox" | "todo" | "in_progress" | "completed" | "archived";

export interface Subtask {
  id: ID;
  title: string;
  done: boolean;
}

// ===== Tasks =====
export interface Task {
  id: ID;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  category?: string;
  dueDate?: string; // ISO date
  dueTime?: string; // HH:mm
  estimatedMinutes?: number;
  projectId?: ID;
  subjectId?: ID;
  tags: string[];
  subtasks: Subtask[];
  notes?: string;
  createdAt: string;
  completedAt?: string;
  isDemo?: boolean;
}

// ===== Projects =====
export type ProjectStatus = "idea" | "planning" | "building" | "testing" | "completed" | "paused" | "archived";
export type ProjectCategory = "robotics" | "coding" | "school" | "personal" | "other";

export interface Milestone {
  id: ID;
  title: string;
  done: boolean;
  dueDate?: string;
}

export interface ActivityEntry {
  id: ID;
  message: string;
  timestamp: string;
}

export interface ProjectResource {
  id: ID;
  label: string;
  url: string;
}

export interface RoboticsDetails {
  objective?: string;
  hardware?: string;
  software?: string;
  components?: string;
  wiring?: string;
  firmware?: string;
  mechanicalDesign?: string;
  testing?: string;
  problems?: string;
  solutions?: string;
  documentation?: string;
}

export interface Project {
  id: ID;
  name: string;
  description?: string;
  category: ProjectCategory;
  status: ProjectStatus;
  progress: number; // 0-100
  deadline?: string;
  priority: Priority;
  tags: string[];
  milestones: Milestone[];
  notes?: string;
  resources: ProjectResource[];
  activity: ActivityEntry[];
  robotics?: RoboticsDetails;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

// ===== Backlog =====
export type BacklogType = "lecture" | "homework" | "notebook" | "revision" | "project_task" | "coding_task" | "personal_task";
export type BacklogStatus = "pending" | "in_progress" | "done";

export interface BacklogItem {
  id: ID;
  title: string;
  type: BacklogType;
  subjectId?: ID;
  projectId?: ID;
  durationMinutes: number;
  priority: Priority;
  deadline?: string;
  status: BacklogStatus;
  notes?: string;
  createdAt: string;
  isDemo?: boolean;
}

// ===== School =====
export type LectureStatus = "not_started" | "watching" | "watched" | "notes_done" | "revised" | "completed";

export interface Lecture {
  id: ID;
  title: string;
  subjectId: ID;
  chapter?: string;
  durationMinutes: number;
  status: LectureStatus;
  createdAt: string;
  isDemo?: boolean;
}

export interface Assignment {
  id: ID;
  title: string;
  subjectId: ID;
  deadline?: string;
  status: TaskStatus;
  estimatedMinutes?: number;
  createdAt: string;
  isDemo?: boolean;
}

export interface Subject {
  id: ID;
  name: string;
  color: string;
  createdAt: string;
  isDemo?: boolean;
}

// ===== Notes =====
export type NoteCategory = "school" | "robotics" | "coding" | "projects" | "ideas" | "personal" | "research";

export interface Note {
  id: ID;
  title: string;
  content: string;
  tags: string[];
  category: NoteCategory;
  projectId?: ID;
  subjectId?: ID;
  pinned: boolean;
  archived: boolean;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

// ===== Ideas =====
export type IdeaStatus = "idea" | "planning" | "building" | "completed" | "abandoned";
export type IdeaCategory = "robotics" | "coding" | "websites" | "business" | "random";

export interface Idea {
  id: ID;
  title: string;
  description?: string;
  category: IdeaCategory;
  difficulty?: "easy" | "medium" | "hard";
  estimatedCost?: string;
  potential?: "low" | "medium" | "high";
  tags: string[];
  status: IdeaStatus;
  createdAt: string;
  convertedProjectId?: ID;
  isDemo?: boolean;
}

// ===== Reminders =====
export type RepeatOption = "once" | "daily" | "weekly" | "monthly" | "custom";

export interface Reminder {
  id: ID;
  title: string;
  date: string;
  time?: string;
  repeat: RepeatOption;
  priority: Priority;
  relatedTaskId?: ID;
  relatedProjectId?: ID;
  notes?: string;
  createdAt: string;
  isDemo?: boolean;
}

// ===== Calendar =====
export type CalendarEventType = "task" | "deadline" | "reminder" | "assignment" | "test" | "milestone";

export interface CalendarEvent {
  id: ID;
  title: string;
  date: string;
  time?: string;
  type: CalendarEventType;
  refId?: ID;
  isDemo?: boolean;
}

// ===== Focus =====
export interface FocusSession {
  id: ID;
  taskId?: ID;
  durationMinutes: number;
  completedAt: string;
  accomplishment?: string;
  isDemo?: boolean;
}

// ===== Goals =====
export type GoalType = "school" | "coding" | "robotics" | "personal" | "projects";

export interface Goal {
  id: ID;
  title: string;
  description?: string;
  type: GoalType;
  deadline?: string;
  progress: number;
  milestones: Milestone[];
  linkedTaskIds: ID[];
  linkedProjectIds: ID[];
  createdAt: string;
  isDemo?: boolean;
}

// ===== Recent History =====
export type HistoryType =
  | "task_created" | "task_completed" | "project_created" | "project_opened"
  | "note_created" | "backlog_updated" | "focus_session" | "ai_query" | "web_query" | "reminder_created";

export interface HistoryEntry {
  id: ID;
  type: HistoryType;
  title: string;
  detail?: string;
  relatedType?: "task" | "project" | "note" | "backlog" | "reminder";
  relatedId?: string;
  timestamp: string;
}

// ===== AI Conversations =====
export interface AIChatMessage {
  id: ID;
  role: "user" | "ai";
  text: string;
  meta?: string; // e.g. "via NVIDIA" or "from web: stooq.com"
}

export interface AIConversation {
  id: ID;
  title: string;
  messages: AIChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ===== Settings =====
export interface AppSettings {
  theme: "dark" | "light" | "system";
  accentColor: string;
  density: "comfortable" | "compact";
  dashboardWidgets: string[];
  notificationsEnabled: boolean;
  demoDataCleared: boolean;
  vaultPinHash?: string;
  voiceEnabled: boolean;
  ttsEnabled: boolean;
}

export interface NexusData {
  tasks: Task[];
  projects: Project[];
  backlogItems: BacklogItem[];
  subjects: Subject[];
  lectures: Lecture[];
  assignments: Assignment[];
  notes: Note[];
  ideas: Idea[];
  reminders: Reminder[];
  calendarEvents: CalendarEvent[];
  focusSessions: FocusSession[];
  goals: Goal[];
  historyEntries: HistoryEntry[];
  aiConversations: AIConversation[];
  settings: AppSettings;
}
