import React, { createContext, useCallback, useContext, useState } from "react";
import { ToastStack, ToastMessage } from "@/components/ui/Primitives";
import { uid } from "@/utils/helpers";

interface ToastContextValue {
  push: (text: string, tone?: ToastMessage["tone"]) => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const push = useCallback((text: string, tone: ToastMessage["tone"] = "default") => {
    const id = uid();
    setToasts((prev) => [...prev, { id, text, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <ToastStack toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
