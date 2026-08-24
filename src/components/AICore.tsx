import React from "react";
import { classNames } from "@/utils/helpers";

export type AICoreState = "idle" | "listening" | "thinking" | "executing" | "speaking";

const STATE_LABEL: Record<AICoreState, string> = {
  idle: "READY", listening: "LISTENING", thinking: "THINKING", executing: "EXECUTING", speaking: "SPEAKING",
};
const STATE_COLOR: Record<AICoreState, string> = {
  idle: "#22d3ee", listening: "#4ade80", thinking: "#f0a256", executing: "#a78bfa", speaking: "#6366f1",
};

export function AICore({ state = "idle", size = 120, onClick }: { state?: AICoreState; size?: number; onClick?: () => void }) {
  const color = STATE_COLOR[state];
  const animated = state !== "idle";

  return (
    <button
      onClick={onClick}
      className="group relative flex items-center justify-center focus-ring rounded-full"
      style={{ width: size, height: size }}
      aria-label={`NEXUS AI Core: ${STATE_LABEL[state]}`}
    >
      <svg width={size} height={size} viewBox="0 0 120 120" className="absolute inset-0">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#1c1e22" strokeWidth="1.5" />
        <circle
          cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="1.5"
          strokeDasharray="4 7" strokeLinecap="round"
          className={animated ? "animate-[spin_6s_linear_infinite]" : ""}
          style={{ transformOrigin: "60px 60px", opacity: 0.6 }}
        />
        <circle cx="60" cy="60" r="42" fill="none" stroke={color} strokeWidth="1" opacity="0.25" />
        <circle
          cx="60" cy="60" r="42" fill="none" stroke={color} strokeWidth="2"
          strokeDasharray="90 174" strokeLinecap="round"
          className={animated ? "animate-[spin_2.4s_linear_infinite_reverse]" : ""}
          style={{ transformOrigin: "60px 60px" }}
        />
        <circle cx="60" cy="60" r="30" fill={color} opacity={animated ? 0.14 : 0.08} className={animated ? "animate-pulse" : ""} />
      </svg>
      <div className="relative flex flex-col items-center">
        <span className="text-[9px] font-semibold tracking-[0.2em]" style={{ color }}>NEXUS</span>
        <span className="mt-0.5 font-mono text-[8px] tracking-[0.15em] text-[var(--color-text-faint)]">{STATE_LABEL[state]}</span>
      </div>
    </button>
  );
}

export function AICoreMini({ state = "idle" }: { state?: AICoreState }) {
  const color = STATE_COLOR[state];
  return (
    <span className="relative inline-flex h-2 w-2">
      {state !== "idle" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: color }} />}
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
  );
}
