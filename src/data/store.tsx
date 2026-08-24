import React, { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import { NexusData, AppSettings } from "@/types";
import { buildDemoData, emptyData } from "@/data/demoData";
import { uid, nowISO } from "@/utils/helpers";

const STORAGE_KEY = "nexus_data_v1";

export type EntityKey =
  | "tasks" | "projects" | "backlogItems" | "subjects" | "lectures" | "assignments"
  | "notes" | "ideas" | "reminders" | "calendarEvents" | "focusSessions" | "goals"
  | "historyEntries" | "aiConversations";

type Action =
  | { type: "ADD"; entity: EntityKey; item: any }
  | { type: "UPDATE"; entity: EntityKey; id: string; patch: any }
  | { type: "DELETE"; entity: EntityKey; id: string }
  | { type: "BULK_DELETE"; entity: EntityKey; ids: string[] }
  | { type: "BULK_UPDATE"; entity: EntityKey; ids: string[]; patch: any }
  | { type: "SET_ALL"; data: NexusData }
  | { type: "UPDATE_SETTINGS"; patch: Partial<AppSettings> }
  | { type: "RESET_DEMO" }
  | { type: "CLEAR_DEMO" }
  | { type: "RESET_ALL" };

function loadInitial(): NexusData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) {
    console.error("Failed to load NEXUS data", e);
  }
  return buildDemoData();
}

// Backfills fields added in later versions so existing saved data doesn't break.
function migrate(data: any): NexusData {
  const fallback = emptyData();
  return {
    ...fallback,
    ...data,
    historyEntries: data.historyEntries || [],
    aiConversations: data.aiConversations || [],
    settings: {
      ...fallback.settings,
      ...data.settings,
      voiceEnabled: data.settings?.voiceEnabled ?? true,
      ttsEnabled: data.settings?.ttsEnabled ?? false,
    },
  };
}

function reducer(state: NexusData, action: Action): NexusData {
  switch (action.type) {
    case "ADD":
      return { ...state, [action.entity]: [...(state as any)[action.entity], action.item] };
    case "UPDATE":
      return {
        ...state,
        [action.entity]: (state as any)[action.entity].map((it: any) =>
          it.id === action.id ? { ...it, ...action.patch } : it
        ),
      };
    case "DELETE":
      return {
        ...state,
        [action.entity]: (state as any)[action.entity].filter((it: any) => it.id !== action.id),
      };
    case "BULK_DELETE":
      return {
        ...state,
        [action.entity]: (state as any)[action.entity].filter((it: any) => !action.ids.includes(it.id)),
      };
    case "BULK_UPDATE":
      return {
        ...state,
        [action.entity]: (state as any)[action.entity].map((it: any) =>
          action.ids.includes(it.id) ? { ...it, ...action.patch } : it
        ),
      };
    case "SET_ALL":
      return action.data;
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "RESET_DEMO":
      return buildDemoData();
    case "CLEAR_DEMO": {
      const clean: any = { settings: { ...state.settings, demoDataCleared: true } };
      (Object.keys(state) as (keyof NexusData)[]).forEach((k) => {
        if (k === "settings") return;
        const arr = (state as any)[k];
        if (Array.isArray(arr)) clean[k] = arr.filter((it: any) => !it.isDemo);
      });
      return clean as NexusData;
    }
    case "RESET_ALL":
      return emptyData();
    default:
      return state;
  }
}

interface NexusContextValue {
  data: NexusData;
  add: (entity: EntityKey, item: any) => string;
  update: (entity: EntityKey, id: string, patch: any) => void;
  remove: (entity: EntityKey, id: string) => void;
  bulkRemove: (entity: EntityKey, ids: string[]) => void;
  bulkUpdate: (entity: EntityKey, ids: string[], patch: any) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetDemo: () => void;
  clearDemo: () => void;
  resetAll: () => void;
  replaceAll: (data: NexusData) => void;
  logActivity: (projectId: string, message: string) => void;
}

const NexusContext = createContext<NexusContextValue | null>(null);

export function NexusProvider({ children }: { children: React.ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const add = useCallback((entity: EntityKey, item: any) => {
    const id = item.id || uid();
    dispatch({ type: "ADD", entity, item: { ...item, id } });
    return id;
  }, []);

  const update = useCallback((entity: EntityKey, id: string, patch: any) => {
    dispatch({ type: "UPDATE", entity, id, patch });
  }, []);

  const remove = useCallback((entity: EntityKey, id: string) => {
    dispatch({ type: "DELETE", entity, id });
  }, []);

  const bulkRemove = useCallback((entity: EntityKey, ids: string[]) => {
    dispatch({ type: "BULK_DELETE", entity, ids });
  }, []);

  const bulkUpdate = useCallback((entity: EntityKey, ids: string[], patch: any) => {
    dispatch({ type: "BULK_UPDATE", entity, ids, patch });
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    dispatch({ type: "UPDATE_SETTINGS", patch });
  }, []);

  const resetDemo = useCallback(() => dispatch({ type: "RESET_DEMO" }), []);
  const clearDemo = useCallback(() => dispatch({ type: "CLEAR_DEMO" }), []);
  const resetAll = useCallback(() => dispatch({ type: "RESET_ALL" }), []);
  const replaceAll = useCallback((newData: NexusData) => dispatch({ type: "SET_ALL", data: newData }), []);

  const logActivity = useCallback((projectId: string, message: string) => {
    dispatch({
      type: "UPDATE",
      entity: "projects",
      id: projectId,
      patch: {},
    });
    // append activity via functional patch — handled specially below
  }, []);

  const value: NexusContextValue = {
    data, add, update, remove, bulkRemove, bulkUpdate, updateSettings,
    resetDemo, clearDemo, resetAll, replaceAll, logActivity,
  };

  return <NexusContext.Provider value={value}>{children}</NexusContext.Provider>;
}

export function useNexus() {
  const ctx = useContext(NexusContext);
  if (!ctx) throw new Error("useNexus must be used within NexusProvider");
  return ctx;
}

export function addProjectActivity(
  update: (entity: EntityKey, id: string, patch: any) => void,
  project: { id: string; activity: any[] },
  message: string
) {
  update("projects", project.id, {
    activity: [{ id: uid(), message, timestamp: nowISO() }, ...project.activity].slice(0, 30),
  });
}

export function logHistory(
  add: (entity: EntityKey, item: any) => string,
  entry: Omit<import("@/types").HistoryEntry, "id" | "timestamp">
) {
  add("historyEntries", { ...entry, timestamp: nowISO() });
}
