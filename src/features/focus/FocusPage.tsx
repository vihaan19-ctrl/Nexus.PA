import React, { useEffect, useRef, useState } from "react";
import { useNexus, logHistory } from "@/data/store";
import { useToast } from "@/hooks/useToast";
import { Card, Button, Select, Input, Modal, Textarea } from "@/components/ui/Primitives";
import { Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";
import { nowISO, formatMinutes, classNames } from "@/utils/helpers";

const PRESETS = [
  { label: "25 / 5", work: 25, brk: 5 },
  { label: "45 / 10", work: 45, brk: 10 },
  { label: "50 / 10", work: 50, brk: 10 },
];

export function FocusPage() {
  const { data, add } = useNexus();
  const { push } = useToast();
  const [preset, setPreset] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(30);
  const [useCustom, setUseCustom] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[0].work * 60);
  const [running, setRunning] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [accomplishment, setAccomplishment] = useState("");
  const intervalRef = useRef<number | null>(null);

  const totalSeconds = (useCustom ? customMinutes : PRESETS[preset].work) * 60;

  useEffect(() => {
    setSecondsLeft(totalSeconds);
  }, [preset, customMinutes, useCustom]);

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            window.clearInterval(intervalRef.current!);
            setRunning(false);
            setShowComplete(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [running]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = 1 - secondsLeft / totalSeconds;

  const activeTasks = data.tasks.filter((t) => t.status !== "completed" && t.status !== "archived");
  const recentSessions = data.focusSessions.slice().sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 8);

  function saveSession() {
    const mins = Math.round((totalSeconds - secondsLeft) / 60) || Math.round(totalSeconds / 60);
    add("focusSessions", {
      taskId: taskId || undefined,
      durationMinutes: mins,
      completedAt: nowISO(),
      accomplishment: accomplishment.trim() || undefined,
    });
    logHistory(add, { type: "focus_session", title: `${mins} minute focus session`, detail: accomplishment.trim() || undefined });
    push("Focus session saved", "success");
    setShowComplete(false);
    setAccomplishment("");
    setSecondsLeft(totalSeconds);
  }

  return (
    <div className="animate-in">
      <h1 className="mb-5 text-xl font-semibold tracking-tight">Focus</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="col-span-2 flex flex-col items-center justify-center gap-6 p-10">
          <div className="relative flex h-56 w-56 items-center justify-center rounded-full border-4 border-[var(--color-surface-2)]">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(var(--color-accent) ${progress * 360}deg, transparent 0deg)`,
                mask: "radial-gradient(farthest-side, transparent calc(100% - 6px), black calc(100% - 6px))",
                WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 6px), black calc(100% - 6px))",
              }}
            />
            <p className="font-mono text-4xl font-semibold tabular-nums">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" icon={<RotateCcw size={14} />} onClick={() => { setRunning(false); setSecondsLeft(totalSeconds); }}>Reset</Button>
            <Button variant="primary" icon={running ? <Pause size={16} /> : <Play size={16} />} onClick={() => setRunning((r) => !r)}>
              {running ? "Pause" : "Start"}
            </Button>
            <Button variant="secondary" size="sm" icon={<CheckCircle2 size={14} />} onClick={() => { setRunning(false); setShowComplete(true); }}>Complete</Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {PRESETS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => { setPreset(i); setUseCustom(false); setRunning(false); }}
                className={classNames("rounded-lg border px-3 py-1.5 text-xs", !useCustom && preset === i ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]" : "border-[var(--color-border)] text-[var(--color-text-dim)]")}
              >
                {p.label}
              </button>
            ))}
            <div className="flex items-center gap-1">
              <Input type="number" min={5} className="w-16" value={customMinutes} onChange={(e) => { setCustomMinutes(Number(e.target.value)); setUseCustom(true); setRunning(false); }} />
              <span className="text-xs text-[var(--color-text-faint)]">min custom</span>
            </div>
          </div>

          <Select className="w-full max-w-xs" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">No linked task</option>
            {activeTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </Select>
        </Card>

        <Card className="p-4">
          <p className="mb-3 text-xs font-semibold text-[var(--color-text-dim)]">Recent sessions</p>
          <div className="flex flex-col gap-2">
            {recentSessions.length === 0 && <p className="text-xs text-[var(--color-text-faint)]">No sessions yet.</p>}
            {recentSessions.map((s) => (
              <div key={s.id} className="rounded-lg border border-[var(--color-border-soft)] p-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{formatMinutes(s.durationMinutes)}</span>
                  <span className="text-[var(--color-text-faint)]">{new Date(s.completedAt).toLocaleDateString()}</span>
                </div>
                {s.accomplishment && <p className="mt-1 text-[11px] text-[var(--color-text-dim)]">{s.accomplishment}</p>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal open={showComplete} onClose={() => setShowComplete(false)} title="Session complete">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[var(--color-text-dim)]">What did you accomplish?</p>
          <Textarea rows={3} value={accomplishment} onChange={(e) => setAccomplishment(e.target.value)} placeholder="e.g. Finished 2 calculus problems" autoFocus />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowComplete(false)}>Discard</Button>
            <Button variant="primary" onClick={saveSession}>Save session</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
