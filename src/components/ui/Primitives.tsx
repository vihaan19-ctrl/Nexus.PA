import React, { useEffect, useRef } from "react";
import { classNames } from "@/utils/helpers";
import { X } from "lucide-react";

// ---------- Button ----------
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  icon?: React.ReactNode;
}
export function Button({ variant = "secondary", size = "md", icon, className, children, ...rest }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150 focus-ring disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";
  const sizes = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-[var(--color-accent)] text-white hover:brightness-110",
    secondary: "bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[#202226]",
    ghost: "text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
    danger: "bg-[color-mix(in_srgb,var(--color-critical)_18%,transparent)] text-[var(--color-critical)] hover:bg-[color-mix(in_srgb,var(--color-critical)_28%,transparent)]",
    outline: "border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
  };
  return (
    <button className={classNames(base, sizes, variants[variant], className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

// ---------- Card ----------
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function Card({ className, children, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={classNames(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

// ---------- Badge ----------
type BadgeTone = "default" | "critical" | "high" | "medium" | "low" | "accent" | "success";
export function Badge({ tone = "default", children, className }: { tone?: BadgeTone; children: React.ReactNode; className?: string }) {
  const tones: Record<BadgeTone, string> = {
    default: "bg-[var(--color-surface-2)] text-[var(--color-text-dim)] border-[var(--color-border)]",
    critical: "bg-[color-mix(in_srgb,var(--color-critical)_14%,transparent)] text-[var(--color-critical)] border-[color-mix(in_srgb,var(--color-critical)_30%,transparent)]",
    high: "bg-[color-mix(in_srgb,var(--color-high)_14%,transparent)] text-[var(--color-high)] border-[color-mix(in_srgb,var(--color-high)_30%,transparent)]",
    medium: "bg-[color-mix(in_srgb,var(--color-medium)_14%,transparent)] text-[var(--color-medium)] border-[color-mix(in_srgb,var(--color-medium)_30%,transparent)]",
    low: "bg-[color-mix(in_srgb,var(--color-low)_14%,transparent)] text-[var(--color-low)] border-[color-mix(in_srgb,var(--color-low)_30%,transparent)]",
    accent: "bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)]",
    success: "bg-[color-mix(in_srgb,#4ade80_14%,transparent)] text-[#4ade80] border-[color-mix(in_srgb,#4ade80_30%,transparent)]",
  };
  return (
    <span className={classNames("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

// ---------- Input / Textarea / Select ----------
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={classNames(
        "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus-ring",
        props.className
      )}
    />
  );
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={classNames(
        "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus-ring resize-none",
        props.className
      )}
    />
  );
}
export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={classNames(
        "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)] focus-ring",
        className
      )}
    >
      {children}
    </select>
  );
}

// ---------- Modal ----------
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[8vh]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in" onClick={onClose} />
      <div
        ref={ref}
        className={classNames(
          "relative z-10 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl animate-in",
          wide ? "max-w-2xl" : "max-w-md"
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
            <button onClick={onClose} className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] focus-ring rounded">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ---------- ProgressBar ----------
export function ProgressBar({ value, tone = "accent" }: { value: number; tone?: "accent" | "success" }) {
  const color = tone === "success" ? "#4ade80" : "var(--color-accent)";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}

// ---------- EmptyState ----------
export function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-14 text-center animate-in">
      <p className="text-sm font-medium text-[var(--color-text)]">{title}</p>
      {subtitle && <p className="max-w-xs text-xs text-[var(--color-text-dim)]">{subtitle}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ---------- Tabs ----------
export function Tabs({ tabs, active, onChange }: { tabs: { key: string; label: string }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1 w-fit">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={classNames(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-ring",
            active === t.key ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Toast ----------
export interface ToastMessage { id: string; text: string; tone?: "default" | "success" | "error" }
export function ToastStack({ toasts }: { toasts: ToastMessage[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={classNames(
            "animate-in rounded-lg border px-4 py-2.5 text-sm shadow-lg glass",
            t.tone === "success" && "border-[#4ade8055] text-[#4ade80]",
            t.tone === "error" && "border-[var(--color-critical)] text-[var(--color-critical)]",
            (!t.tone || t.tone === "default") && "border-[var(--color-border)] text-[var(--color-text)]"
          )}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
