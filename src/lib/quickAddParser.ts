import { addDays, todayDateStr } from "@/utils/helpers";
import { Priority } from "@/types";

export interface ParsedCapture {
  title: string;
  dueDate?: string;
  priority?: Priority;
  category?: string;
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function parseQuickCapture(raw: string): ParsedCapture {
  let text = raw.trim();
  let dueDate: string | undefined;
  let priority: Priority | undefined;
  let category: string | undefined;

  // priority keywords
  const priorityMatch = text.match(/\b(critical|urgent|high priority|high|medium priority|medium|low priority|low)\b/i);
  if (priorityMatch) {
    const p = priorityMatch[1].toLowerCase();
    if (p.includes("critical") || p.includes("urgent")) priority = "critical";
    else if (p.includes("high")) priority = "high";
    else if (p.includes("medium")) priority = "medium";
    else if (p.includes("low")) priority = "low";
    text = text.replace(priorityMatch[0], "").trim();
  }

  // category via #tag or "for X"
  const hashMatch = text.match(/#(\w+)/);
  if (hashMatch) {
    category = hashMatch[1];
    text = text.replace(hashMatch[0], "").trim();
  }

  const today = todayDateStr();
  if (/\btoday\b/i.test(text)) {
    dueDate = today;
    text = text.replace(/\btoday\b/i, "").trim();
  } else if (/\btomorrow\b/i.test(text)) {
    dueDate = addDays(today, 1);
    text = text.replace(/\btomorrow\b/i, "").trim();
  } else if (/\bnext week\b/i.test(text)) {
    dueDate = addDays(today, 7);
    text = text.replace(/\bnext week\b/i, "").trim();
  } else {
    const wdMatch = text.match(new RegExp(`\\b(${WEEKDAYS.join("|")})\\b`, "i"));
    if (wdMatch) {
      const target = WEEKDAYS.indexOf(wdMatch[1].toLowerCase());
      const now = new Date();
      let diff = (target - now.getDay() + 7) % 7;
      if (diff === 0) diff = 7;
      dueDate = addDays(today, diff);
      text = text.replace(wdMatch[0], "").trim();
    } else {
      const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      if (isoMatch) {
        dueDate = isoMatch[1];
        text = text.replace(isoMatch[0], "").trim();
      }
    }
  }

  text = text.replace(/\s{2,}/g, " ").replace(/^(for|by)\s+/i, "").trim();

  return { title: text || raw.trim(), dueDate, priority, category };
}
