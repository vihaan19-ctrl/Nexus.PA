import React from "react";
import { Menu, Search, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/Primitives";

export function TopBar({
  onMobileMenu,
  onOpenSearch,
  onOpenCapture,
  onOpenQuickAdd,
}: {
  onMobileMenu: () => void;
  onOpenSearch: () => void;
  onOpenCapture: () => void;
  onOpenQuickAdd: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 px-4 py-3 backdrop-blur">
      <button onClick={onMobileMenu} className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] md:hidden focus-ring rounded">
        <Menu size={20} />
      </button>

      <button
        onClick={onOpenSearch}
        className="flex flex-1 max-w-md items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-faint)] hover:border-[var(--color-accent)] focus-ring"
      >
        <Search size={15} />
        <span className="hidden sm:inline">Search NEXUS...</span>
        <span className="ml-auto hidden items-center gap-0.5 rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] sm:flex">
          Ctrl K
        </span>
      </button>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" icon={<Zap size={14} />} onClick={onOpenCapture} className="hidden sm:inline-flex">
          Capture
        </Button>
        <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={onOpenQuickAdd}>
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>
    </header>
  );
}
