import { matches } from "./conditions";
import { DOCUMENTS, type DocumentId, type DocumentRule } from "./documents";
import type { Intake } from "./intake";
import { MILESTONES, windowFor, type MilestoneId, type MilestoneRule } from "./milestones";

export type MilestoneStatus = "upcoming" | "due-soon" | "overdue" | "done";
export type DocumentStatus = "not-started" | "requested" | "ready";

export interface TimelineItem {
  rule: MilestoneRule;
  opens: string; // YYYY-MM-DD
  due: string; // YYYY-MM-DD
  windowLabel: string;
  status: MilestoneStatus;
  documents: DocumentRule[];
}

const DAY = 86_400_000;
/** Show "due soon" this many days ahead of the deadline even if the window isn't open yet. */
const DUE_SOON_DAYS = 45;

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayISO(now = new Date()): string {
  return toISODate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

export function addDays(iso: string, days: number): string {
  return toISODate(new Date(parseDate(iso).getTime() + days * DAY));
}

export function daysBetween(fromISO: string, toISOValue: string): number {
  return Math.round((parseDate(toISOValue).getTime() - parseDate(fromISO).getTime()) / DAY);
}

export function statusFor(opens: string, due: string, today: string, done: boolean): MilestoneStatus {
  if (done) return "done";
  if (today > due) return "overdue";
  if (today >= opens || daysBetween(today, due) <= DUE_SOON_DAYS) return "due-soon";
  return "upcoming";
}

export function applicableDocuments(intake: Intake): DocumentRule[] {
  return DOCUMENTS.filter((d) => matches(d.appliesWhen, intake));
}

export function buildTimeline(
  intake: Intake,
  completed: Partial<Record<MilestoneId, boolean>>,
  today = todayISO(),
): TimelineItem[] {
  const docs = applicableDocuments(intake);
  return MILESTONES.filter((m) => matches(m.appliesWhen, intake))
    .map((rule) => {
      const w = windowFor(rule, intake.separationType);
      const opens = addDays(intake.separationDate, w.opensDays);
      const due = addDays(intake.separationDate, w.dueDays);
      return {
        rule,
        opens,
        due,
        windowLabel: w.label,
        status: statusFor(opens, due, today, Boolean(completed[rule.id])),
        documents: docs.filter((d) => d.milestones.includes(rule.id)),
      };
    })
    // Ordered by when each step should start, so the list reads "in the right order".
    .sort((a, b) => (a.opens === b.opens ? a.due.localeCompare(b.due) : a.opens.localeCompare(b.opens)));
}

export type DocumentStatuses = Partial<Record<DocumentId, DocumentStatus>>;
