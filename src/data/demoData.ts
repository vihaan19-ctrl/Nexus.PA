import { NexusData } from "@/types";
import { uid, nowISO, addDays, todayDateStr } from "@/utils/helpers";

export function buildDemoData(): NexusData {
  const now = nowISO();
  const today = todayDateStr();

  const subjMath = uid();
  const subjPhysics = uid();
  const subjCS = uid();

  const projRobot = uid();
  const projWebApp = uid();

  const ideaWeather = uid();

  return {
    subjects: [
      { id: subjMath, name: "Mathematics", color: "#6366f1", createdAt: now, isDemo: true },
      { id: subjPhysics, name: "Physics", color: "#22d3ee", createdAt: now, isDemo: true },
      { id: subjCS, name: "Computer Science", color: "#a78bfa", createdAt: now, isDemo: true },
    ],
    tasks: [
      {
        id: uid(), title: "Finish calculus problem set 4", status: "todo", priority: "high",
        category: "School", dueDate: today, subjectId: subjMath, tags: ["homework"],
        subtasks: [], notes: "", createdAt: now, isDemo: true, description: "Integration by parts + series",
      },
      {
        id: uid(), title: "Review PID controller code", status: "todo", priority: "critical",
        category: "Project", dueDate: today, projectId: projRobot, tags: ["robotics", "code"],
        subtasks: [
          { id: uid(), title: "Tune Kp/Ki/Kd", done: false },
          { id: uid(), title: "Test on bench", done: false },
        ], notes: "", createdAt: now, isDemo: true,
      },
      {
        id: uid(), title: "Reply to team about hackathon", status: "inbox", priority: "medium",
        category: "Personal", tags: [], subtasks: [], notes: "", createdAt: now, isDemo: true,
      },
      {
        id: uid(), title: "Push latest changes to GitHub", status: "completed", priority: "low",
        category: "Project", projectId: projWebApp, tags: ["code"], subtasks: [], notes: "",
        createdAt: now, completedAt: now, isDemo: true,
      },
    ],
    projects: [
      {
        id: projRobot, name: "Hospital Delivery Robot", description: "Autonomous indoor delivery robot for a school science fair",
        category: "robotics", status: "building", progress: 62, deadline: addDays(today, 21), priority: "high",
        tags: ["robotics", "esp32"], milestones: [
          { id: uid(), title: "Chassis assembled", done: true },
          { id: uid(), title: "Motor control working", done: true },
          { id: uid(), title: "Obstacle avoidance", done: false },
          { id: uid(), title: "Full demo run", done: false },
        ], notes: "Using ESP32 + ultrasonic sensors.", resources: [
          { id: uid(), label: "Wiring diagram (Drive)", url: "https://drive.google.com" },
        ], activity: [
          { id: uid(), message: "Soldered motor driver board", timestamp: now },
          { id: uid(), message: "Fixed PID overshoot bug", timestamp: now },
        ],
        robotics: {
          objective: "Navigate a hospital-like corridor mockup and deliver a small payload autonomously.",
          hardware: "ESP32, 2x DC motors, ultrasonic sensors, IMU, chassis kit",
          software: "Arduino C++, PID loop, basic SLAM-lite obstacle avoidance",
          components: "L298N motor driver, HC-SR04 x3, MPU6050",
          wiring: "Motors on GPIO 25/26/27/14, sensors on I2C + GPIO",
          firmware: "State machine: idle -> navigate -> avoid -> deliver -> return",
          mechanicalDesign: "3D printed chassis, top tray for payload",
          testing: "Bench tested motor response; corridor test pending",
          problems: "Overshoot in turns, sensor noise near walls",
          solutions: "Tuned PID, added moving average filter",
          documentation: "Build log in project notes",
        },
        createdAt: now, updatedAt: now, isDemo: true,
      },
      {
        id: projWebApp, name: "Study Tracker Web App", description: "Personal app to track study sessions",
        category: "coding", status: "testing", progress: 85, deadline: addDays(today, 10), priority: "medium",
        tags: ["react", "sideproject"], milestones: [
          { id: uid(), title: "Core UI built", done: true },
          { id: uid(), title: "Persistence added", done: true },
          { id: uid(), title: "Deploy", done: false },
        ], notes: "", resources: [], activity: [
          { id: uid(), message: "Fixed timer bug", timestamp: now },
        ], createdAt: now, updatedAt: now, isDemo: true,
      },
    ],
    backlogItems: [
      {
        id: uid(), title: "Physics Ch.7 Lecture - Rotational Motion", type: "lecture", subjectId: subjPhysics,
        durationMinutes: 45, priority: "high", deadline: addDays(today, 3), status: "pending", createdAt: now, isDemo: true,
      },
      {
        id: uid(), title: "CS Assignment 3 - Sorting Algorithms", type: "homework", subjectId: subjCS,
        durationMinutes: 90, priority: "critical", deadline: addDays(today, 1), status: "pending", createdAt: now, isDemo: true,
      },
      {
        id: uid(), title: "Revise Math Ch.4 (Series)", type: "revision", subjectId: subjMath,
        durationMinutes: 30, priority: "medium", status: "pending", createdAt: now, isDemo: true,
      },
      {
        id: uid(), title: "Write firmware for obstacle avoidance", type: "coding_task", projectId: projRobot,
        durationMinutes: 120, priority: "high", status: "pending", createdAt: now, isDemo: true,
      },
    ],
    lectures: [
      { id: uid(), title: "Rotational Motion", subjectId: subjPhysics, chapter: "Ch.7", durationMinutes: 45, status: "not_started", createdAt: now, isDemo: true },
      { id: uid(), title: "Series & Sequences", subjectId: subjMath, chapter: "Ch.4", durationMinutes: 40, status: "watched", createdAt: now, isDemo: true },
      { id: uid(), title: "Binary Trees", subjectId: subjCS, chapter: "Ch.6", durationMinutes: 35, status: "completed", createdAt: now, isDemo: true },
    ],
    assignments: [
      { id: uid(), title: "Sorting Algorithms Assignment", subjectId: subjCS, deadline: addDays(today, 1), status: "todo", estimatedMinutes: 90, createdAt: now, isDemo: true },
      { id: uid(), title: "Calculus Problem Set 4", subjectId: subjMath, deadline: today, status: "in_progress", estimatedMinutes: 60, createdAt: now, isDemo: true },
    ],
    notes: [
      {
        id: uid(), title: "PID Tuning Notes", content: "Kp=2.1, Ki=0.4, Kd=0.15 gave the smoothest response on carpet.\n\nStill overshoots on tile — try lowering Kd slightly.",
        tags: ["robotics", "pid"], category: "robotics", projectId: projRobot, pinned: true, archived: false, favorite: true,
        createdAt: now, updatedAt: now, isDemo: true,
      },
      {
        id: uid(), title: "Integration by Parts Cheatsheet", content: "∫u dv = uv - ∫v du\n\nChoose u using LIATE order.",
        tags: ["math"], category: "school", subjectId: subjMath, pinned: false, archived: false, favorite: false,
        createdAt: now, updatedAt: now, isDemo: true,
      },
    ],
    ideas: [
      {
        id: ideaWeather, title: "Desk weather + air quality display", description: "Small e-ink display showing local weather and room AQI using an ESP32.",
        category: "robotics", difficulty: "medium", estimatedCost: "₹2500", potential: "medium", tags: ["esp32", "eink"],
        status: "idea", createdAt: now, isDemo: true,
      },
      {
        id: uid(), title: "Chrome extension: auto-summarize lecture transcripts", description: "",
        category: "coding", difficulty: "hard", potential: "high", tags: [], status: "idea", createdAt: now, isDemo: true,
      },
    ],
    reminders: [
      { id: uid(), title: "Submit CS assignment", date: addDays(today, 1), time: "18:00", repeat: "once", priority: "critical", createdAt: now, isDemo: true },
      { id: uid(), title: "Weekly robotics team sync", date: addDays(today, 2), time: "17:00", repeat: "weekly", priority: "medium", createdAt: now, isDemo: true },
    ],
    calendarEvents: [
      { id: uid(), title: "CS Assignment due", date: addDays(today, 1), type: "deadline", isDemo: true },
      { id: uid(), title: "Physics test", date: addDays(today, 5), type: "test", isDemo: true },
      { id: uid(), title: "Robot demo run", date: addDays(today, 21), type: "milestone", refId: projRobot, isDemo: true },
    ],
    focusSessions: [
      { id: uid(), durationMinutes: 25, completedAt: now, accomplishment: "Tuned PID constants", isDemo: true },
      { id: uid(), durationMinutes: 45, completedAt: now, accomplishment: "Finished 2 calculus problems", isDemo: true },
    ],
    goals: [
      {
        id: uid(), title: "Finish robot in time for science fair", type: "robotics", deadline: addDays(today, 21),
        progress: 62, milestones: [], linkedTaskIds: [], linkedProjectIds: [projRobot], createdAt: now, isDemo: true,
      },
      {
        id: uid(), title: "Clear all backlog lectures this month", type: "school", deadline: addDays(today, 25),
        progress: 30, milestones: [], linkedTaskIds: [], linkedProjectIds: [], createdAt: now, isDemo: true,
      },
    ],
    historyEntries: [],
    aiConversations: [],
    settings: {
      theme: "dark",
      accentColor: "#6366f1",
      density: "comfortable",
      dashboardWidgets: ["priorities", "upcoming", "projects", "backlog", "progress"],
      notificationsEnabled: false,
      demoDataCleared: false,
      voiceEnabled: true,
      ttsEnabled: false,
    },
  };
}

export function emptyData(): NexusData {
  return {
    tasks: [], projects: [], backlogItems: [], subjects: [], lectures: [], assignments: [],
    notes: [], ideas: [], reminders: [], calendarEvents: [], focusSessions: [], goals: [],
    historyEntries: [], aiConversations: [],
    settings: {
      theme: "dark", accentColor: "#6366f1", density: "comfortable",
      dashboardWidgets: ["priorities", "upcoming", "projects", "backlog", "progress"],
      notificationsEnabled: false, demoDataCleared: true, voiceEnabled: true, ttsEnabled: false,
    },
  };
}
