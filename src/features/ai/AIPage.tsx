import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNexus, logHistory } from "@/data/store";
import { Card, Button, Badge, Input, EmptyState } from "@/components/ui/Primitives";
import { formatMinutes, formatDate, priorityWeight, todayDateStr, isOverdue, isToday, nowISO, uid } from "@/utils/helpers";
import {
  Sparkles, Send, CalendarClock, FolderKanban, ListTodo, TrendingUp, Wifi, WifiOff,
  Mic, MicOff, Plus, Search, Trash2, Pencil, Volume2, VolumeX, Check, X,
} from "lucide-react";
import { buildDataContext } from "./buildDataContext";
import { AICore, AICoreState } from "@/components/AICore";
import { detectAction, describeAction, PendingAction } from "./aiActions";
import { tryWebQuery } from "./webQueries";
import { isSpeechRecognitionSupported, isSpeechSynthesisSupported, createRecognizer, speak, stopSpeaking } from "@/lib/speech";
import { AIChatMessage, AIConversation } from "@/types";

const AI_BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL || "http://localhost:8787";

export function AIPage() {
  const { data, add, update, remove, updateSettings } = useNexus();
  const [activeId, setActiveId] = useState<string | null>(data.aiConversations[0]?.id ?? null);
  const [input, setInput] = useState("");
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [coreState, setCoreState] = useState<AICoreState>("idle");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [conversationSearch, setConversationSearch] = useState("");
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const recognizerRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${AI_BACKEND_URL}/api/ai/health`)
      .then((r) => r.json())
      .then((d) => setBackendStatus(d.configured ? "online" : "offline"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  const active = data.aiConversations.find((c) => c.id === activeId) || null;
  const messages = active?.messages || [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pendingAction]);

  function ensureConversation(): AIConversation {
    if (active) return active;
    const id = add("aiConversations", { title: "New conversation", messages: [], createdAt: nowISO(), updatedAt: nowISO() });
    setActiveId(id);
    return { id, title: "New conversation", messages: [], createdAt: nowISO(), updatedAt: nowISO() };
  }

  function appendMessage(convId: string, msg: AIChatMessage, retitle?: string) {
    const conv = data.aiConversations.find((c) => c.id === convId);
    const nextMessages = [...(conv?.messages || []), msg];
    const title = conv?.title === "New conversation" && retitle ? retitle.slice(0, 40) : conv?.title;
    update("aiConversations", convId, { messages: nextMessages, updatedAt: nowISO(), title });
  }

  async function send(rawText?: string) {
    const text = (rawText ?? input).trim();
    if (!text) return;
    setInput("");
    setInterimTranscript("");

    const conv = ensureConversation();
    const userMsg: AIChatMessage = { id: uid(), role: "user", text };
    appendMessage(conv.id, userMsg, text);

    // 1. Natural-language action detection (confirm before executing)
    const action = detectAction(text);
    if (action) {
      setPendingAction(action);
      appendMessage(conv.id, { id: uid(), role: "ai", text: describeAction(action) });
      return;
    }

    setCoreState("thinking");

    // 2. Web / current-info queries (stock, weather) — always answered from a live source, never invented
    const webResult = await tryWebQuery(text);
    if (webResult) {
      logHistory(add, { type: "web_query", title: text, detail: webResult.text });
      const reply: AIChatMessage = { id: uid(), role: "ai", text: webResult.text, meta: `from web: ${webResult.source}` };
      appendMessage(conv.id, reply);
      maybeSpeak(webResult.text);
      setCoreState("idle");
      return;
    }

    logHistory(add, { type: "ai_query", title: text });

    // 3. Connected mode (real LLM via backend) or local rule-based fallback
    if (backendStatus === "online") {
      try {
        const history = [...messages, userMsg].map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));
        const res = await fetch(`${AI_BACKEND_URL}/api/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, context: buildDataContext(data) }),
        });
        const json = await res.json();
        const replyText = res.ok ? json.reply : `Backend error: ${json.error || "unknown"}`;
        const meta = res.ok ? `via ${json.provider}${json.usedFallback ? " (fallback)" : ""}` : undefined;
        appendMessage(conv.id, { id: uid(), role: "ai", text: replyText, meta });
        maybeSpeak(replyText);
      } catch {
        const fallbackText = respondLocally(text, data);
        appendMessage(conv.id, { id: uid(), role: "ai", text: "Couldn't reach the AI backend — answering locally instead.\n\n" + fallbackText });
        maybeSpeak(fallbackText);
      }
    } else {
      const replyText = respondLocally(text, data);
      appendMessage(conv.id, { id: uid(), role: "ai", text: replyText });
      maybeSpeak(replyText);
    }
    setCoreState("idle");
  }

  function maybeSpeak(text: string) {
    if (!data.settings.ttsEnabled || !isSpeechSynthesisSupported()) return;
    setCoreState("speaking");
    speak(text);
    setTimeout(() => setCoreState("idle"), Math.min(8000, text.length * 60));
  }

  function confirmAction() {
    if (!pendingAction || !active) return;
    setCoreState("executing");
    if (pendingAction.kind === "create_task") {
      add("tasks", {
        title: pendingAction.title, status: "todo", priority: (pendingAction.priority as any) || "medium",
        category: pendingAction.category, dueDate: pendingAction.dueDate, tags: [], subtasks: [], createdAt: nowISO(),
      });
      logHistory(add, { type: "task_created", title: pendingAction.title, relatedType: "task" });
      appendMessage(active.id, { id: uid(), role: "ai", text: `Done — created task "${pendingAction.title}".` });
    } else {
      add("reminders", { title: pendingAction.title, date: pendingAction.date || todayDateStr(), repeat: "once", priority: "medium", createdAt: nowISO() });
      logHistory(add, { type: "reminder_created", title: pendingAction.title, relatedType: "reminder" });
      appendMessage(active.id, { id: uid(), role: "ai", text: `Done — set a reminder for "${pendingAction.title}".` });
    }
    setPendingAction(null);
    setTimeout(() => setCoreState("idle"), 400);
  }

  function cancelAction() {
    if (active) appendMessage(active.id, { id: uid(), role: "ai", text: "Cancelled." });
    setPendingAction(null);
  }

  function toggleVoice() {
    if (!isSpeechRecognitionSupported()) {
      setVoiceError("Voice input isn't supported in this browser. Try Chrome or Edge — the text box below always works.");
      return;
    }
    if (listening) {
      recognizerRef.current?.stop();
      setListening(false);
      setCoreState("idle");
      return;
    }
    setVoiceError("");
    const recognizer = createRecognizer(
      (text, isFinal) => {
        setInterimTranscript(text);
        if (isFinal) {
          setListening(false);
          setCoreState("idle");
          send(text);
        }
      },
      () => setListening(false),
      (err) => { setVoiceError(`Voice error: ${err}`); setListening(false); setCoreState("idle"); }
    );
    if (!recognizer) return;
    recognizerRef.current = recognizer;
    recognizer.start();
    setListening(true);
    setCoreState("listening");
  }

  const filteredConversations = useMemo(() => {
    const list = data.aiConversations.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (!conversationSearch.trim()) return list;
    const q = conversationSearch.toLowerCase();
    return list.filter((c) => c.title.toLowerCase().includes(q) || c.messages.some((m) => m.text.toLowerCase().includes(q)));
  }, [data.aiConversations, conversationSearch]);

  const prompts = [
    { icon: <CalendarClock size={13} />, text: "What should I do today?" },
    { icon: <FolderKanban size={13} />, text: "What's left on my projects?" },
    { icon: <ListTodo size={13} />, text: "How can I clear my backlog in 7 days?" },
    { icon: <TrendingUp size={13} />, text: "How productive was this week?" },
  ];

  return (
    <div className="animate-in flex h-[calc(100vh-110px)] gap-4">
      {/* Conversation sidebar */}
      <div className="hidden w-56 shrink-0 flex-col md:flex">
        <Button variant="secondary" size="sm" icon={<Plus size={13} />} className="mb-2" onClick={() => setActiveId(null)}>New conversation</Button>
        <div className="relative mb-2">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
          <Input className="pl-7 text-xs" placeholder="Search conversations" value={conversationSearch} onChange={(e) => setConversationSearch(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 && <p className="px-2 py-4 text-center text-[11px] text-[var(--color-text-faint)]">No conversations yet.</p>}
          <div className="flex flex-col gap-0.5">
            {filteredConversations.map((c) => (
              <ConversationRow key={c.id} conv={c} active={c.id === activeId} onSelect={() => setActiveId(c.id)} onRename={(t) => update("aiConversations", c.id, { title: t })} onDelete={() => { remove("aiConversations", c.id); if (activeId === c.id) setActiveId(null); }} />
            ))}
          </div>
        </div>
      </div>

      {/* Main panel */}
      <div className="flex flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="mb-0.5 flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Sparkles size={18} /> NEXUS AI</h1>
              {backendStatus === "online" && <Badge tone="success"><Wifi size={11} /> Connected</Badge>}
              {backendStatus === "offline" && <Badge><WifiOff size={11} /> Local mode</Badge>}
            </div>
            <p className="text-xs text-[var(--color-text-dim)]">
              {backendStatus === "online" ? "Real AI provider, grounded in your NEXUS data." : "Answers only from your stored data — run /server for free-form conversation."}
            </p>
          </div>
          <AICore state={coreState} size={64} onClick={() => setInput((i) => i)} />
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {prompts.map((p) => (
            <button key={p.text} onClick={() => send(p.text)} className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-dim)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)]">
              {p.icon}{p.text}
            </button>
          ))}
        </div>

        <Card ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <EmptyState title="Ask NEXUS anything." subtitle='Try "what should I do today?" or "create a task called finish physics lecture tomorrow".' />
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((m) => (
                <div key={m.id} className={`max-w-[85%] ${m.role === "user" ? "ml-auto" : ""}`}>
                  <div className={`rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-line ${m.role === "user" ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-surface-2)] text-[var(--color-text)]"}`}>
                    {m.text}
                  </div>
                  {m.meta && <p className="mt-1 text-[10px] text-[var(--color-text-faint)]">{m.meta}</p>}
                </div>
              ))}
              {pendingAction && (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-3.5 py-2.5">
                  <span className="flex-1 text-xs text-[var(--color-text)]">Confirm this action above?</span>
                  <Button size="sm" variant="secondary" icon={<X size={13} />} onClick={cancelAction}>Cancel</Button>
                  <Button size="sm" variant="primary" icon={<Check size={13} />} onClick={confirmAction}>Confirm</Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {voiceError && <p className="mt-2 text-xs text-[var(--color-critical)]">{voiceError}</p>}
        {listening && <p className="mt-2 text-xs text-[var(--color-accent)]">Listening... {interimTranscript && `"${interimTranscript}"`}</p>}

        <div className="mt-3 flex gap-2">
          <button
            onClick={toggleVoice}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${listening ? "border-[var(--color-critical)] text-[var(--color-critical)]" : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]"}`}
            title={listening ? "Stop listening" : "Voice input"}
          >
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about your tasks, projects, backlog, or anything else..."
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm focus-ring"
          />
          <button
            onClick={() => updateSettings({ ttsEnabled: !data.settings.ttsEnabled })}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${data.settings.ttsEnabled ? "border-[var(--color-accent)] text-[var(--color-accent)]" : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]"}`}
            title={data.settings.ttsEnabled ? "Voice replies on" : "Voice replies off"}
          >
            {data.settings.ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
          <Button variant="primary" icon={<Send size={14} />} onClick={() => send()}>Send</Button>
        </div>
      </div>
    </div>
  );
}

function ConversationRow({ conv, active, onSelect, onRename, onDelete }: { conv: AIConversation; active: boolean; onSelect: () => void; onRename: (t: string) => void; onDelete: () => void }) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(conv.title);

  if (renaming) {
    return (
      <div className="flex items-center gap-1 px-1">
        <Input className="text-xs" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === "Enter") { onRename(title); setRenaming(false); } }} />
        <button onClick={() => { onRename(title); setRenaming(false); }} className="text-[var(--color-text-faint)] hover:text-[var(--color-accent)]"><Check size={13} /></button>
      </div>
    );
  }

  return (
    <div className={`group flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs ${active ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]" : "text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"}`}>
      <button onClick={onSelect} className="min-w-0 flex-1 truncate text-left">{conv.title}</button>
      <button onClick={() => setRenaming(true)} className="shrink-0 opacity-0 group-hover:opacity-100"><Pencil size={11} /></button>
      <button onClick={onDelete} className="shrink-0 opacity-0 hover:text-[var(--color-critical)] group-hover:opacity-100"><Trash2 size={11} /></button>
    </div>
  );
}

// ---------- Local rule-based fallback (used when no backend is connected) ----------
function respondLocally(query: string, data: ReturnType<typeof useNexus>["data"]): string {
  const q = query.toLowerCase();
  const today = todayDateStr();

  if (q.includes("today") || q.includes("what should i do")) {
    const todays = data.tasks.filter((t) => t.status !== "completed" && t.status !== "archived" && (isToday(t.dueDate) || isOverdue(t.dueDate, t.status)))
      .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority));
    const backlogDue = data.backlogItems.filter((b) => b.status !== "done" && b.deadline && b.deadline <= today);
    if (todays.length === 0 && backlogDue.length === 0) return "Nothing due today or overdue. Good time to pull from your backlog or work ahead on a project.";
    let out = `You have ${todays.length} task(s) due or overdue today:\n`;
    todays.slice(0, 6).forEach((t) => { out += `- [${t.priority}] ${t.title}${t.dueDate && t.dueDate < today ? " (overdue)" : ""}\n`; });
    if (backlogDue.length) out += `\nBacklog items due: ${backlogDue.map((b) => b.title).join(", ")}`;
    return out.trim();
  }

  if (q.includes("backlog")) {
    const pending = data.backlogItems.filter((b) => b.status !== "done");
    const totalMinutes = pending.reduce((s, b) => s + b.durationMinutes, 0);
    const daysMatch = q.match(/(\d+)\s*day/);
    const days = daysMatch ? Number(daysMatch[1]) : 7;
    if (pending.length === 0) return "Your backlog is empty right now.";
    const perDay = Math.ceil(totalMinutes / days);
    return `You have ${formatMinutes(totalMinutes)} of backlog across ${pending.length} items. To clear it in ${days} days, you'd need about ${formatMinutes(perDay)}/day. Highest priority items: ${pending.slice().sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority)).slice(0, 3).map((b) => b.title).join(", ")}.`;
  }

  if (q.includes("productive") || q.includes("review") || q.includes("week")) {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().slice(0, 10);
    const completed = data.tasks.filter((t) => t.completedAt && t.completedAt.slice(0, 10) >= weekAgoStr).length;
    const focusMinutes = data.focusSessions.filter((f) => f.completedAt.slice(0, 10) >= weekAgoStr).reduce((s, f) => s + f.durationMinutes, 0);
    const backlogCleared = data.backlogItems.filter((b) => b.status === "done").length;
    return `In the last 7 days: ${completed} task(s) completed, ${formatMinutes(focusMinutes)} of focus time logged, and ${backlogCleared} backlog item(s) cleared overall.`;
  }

  const project = data.projects.find((p) => q.includes(p.name.toLowerCase()));
  if (project) {
    const tasks = data.tasks.filter((t) => t.projectId === project.id);
    const done = tasks.filter((t) => t.status === "completed").length;
    const remaining = tasks.filter((t) => t.status !== "completed");
    const nextMilestone = project.milestones.find((m) => !m.done);
    let out = `${project.name} is at ${project.progress}% (${project.status.replace("_", " ")}). ${done}/${tasks.length} linked tasks completed.`;
    if (remaining.length) out += `\nRemaining: ${remaining.slice(0, 5).map((t) => t.title).join(", ")}.`;
    if (nextMilestone) out += `\nNext milestone: ${nextMilestone.title}.`;
    if (project.deadline) out += `\nDeadline: ${formatDate(project.deadline)}.`;
    return out;
  }

  if (q.includes("project")) {
    const activeP = data.projects.filter((p) => !["completed", "archived"].includes(p.status));
    if (!activeP.length) return "You have no active projects right now.";
    return `Active projects: ${activeP.map((p) => `${p.name} (${p.progress}%)`).join(", ")}.`;
  }

  return "In local mode I can only answer using your NEXUS data — try asking about today's priorities, a project by name, your backlog, or a recent week review. Connect an AI provider in Settings -> API Vault for free-form questions.";
}
