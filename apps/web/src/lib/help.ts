import {
  addDays, applicableDocuments, buildTimeline, ChatContextSchema, todayISO,
  type ChatContext, type DocumentStatus, type Intake,
} from "@vbn/shared";
import { z } from "zod";
import { loadSharesRaw, saveSharesRaw } from "./storage";
import { formatDate } from "./useNavigator";

/**
 * Representative handoff, demo edition.
 *
 * A "share" is a read-only, time-limited snapshot of the plan summary (the same
 * summary the chat receives): intake answers, milestone dates and statuses, and
 * document names and statuses. Never files, names or identifiers.
 * In this demo shares live in localStorage so a second tab can play the
 * service officer. In production they live server-side (see docs/architecture.md).
 */

export interface Organization {
  id: string;
  name: string;
  kind: string;
  details: string;
}

/** Fictional organizations for the demo. Production pulls from the VA's accredited representative search. */
export const DEMO_ORGS: Organization[] = [
  { id: "sample-county", name: "Sample County Veterans Service Office", kind: "County veterans service office", details: "In person, video or phone · Free · Accredited service officers" },
  { id: "harbor-point", name: "Harbor Point Veterans Association", kind: "Veterans service organization", details: "In person, video or phone · Free · Accredited service officers" },
  { id: "lakeside", name: "Lakeside Veterans Help Center", kind: "Veterans service organization", details: "In person, video or phone · Free · Evening hours" },
];

export const orgName = (id: string) => DEMO_ORGS.find((o) => o.id === id)?.name ?? "Demo organization";

export const SHARE_DAYS = 14;

/** How the veteran wants to meet. In person needs no video: they look at the plan together on the veteran's screen. */
export const MEETING_TYPES = ["in-person", "video", "phone"] as const;
export type MeetingType = (typeof MEETING_TYPES)[number];
export const MEETING_LABEL: Record<MeetingType, string> = {
  "in-person": "In person",
  video: "Video",
  phone: "Phone",
};

export const ShareSchema = z.object({
  code: z.string(),
  orgId: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  /** ISO date-time of the booked meeting, or null for "start now". */
  slot: z.string().nullable(),
  plan: ChatContextSchema,
  /** Missing on shares made before meeting types existed; those were video. */
  meeting: z.enum(MEETING_TYPES).optional(),
  demo: z.boolean().optional(),
});
export type Share = z.infer<typeof ShareSchema>;

export function loadShares(): Share[] {
  return loadSharesRaw().flatMap((s) => {
    const r = ShareSchema.safeParse(s);
    return r.success ? [r.data] : [];
  });
}

export const meetingOf = (s: Share): MeetingType => s.meeting ?? "video";

/** Accepts what people actually type: "bn-qbkh", "BN QBKH" or just "QBKH". */
export function normalizeCode(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = raw.startsWith("BN") && raw.length > 4 ? raw.slice(2) : raw;
  return `BN-${body}`;
}

export function addShare(share: Share) {
  saveSharesRaw([share, ...loadShares().filter((s) => s.code !== share.code)]);
}

export function revokeShare(code: string) {
  saveSharesRaw(loadShares().filter((s) => s.code !== code));
}

export function isExpired(s: Share, today = todayISO()) {
  return s.expiresAt < today;
}

/** Short, unambiguous session code, e.g. BN-7KQ4. */
export function newCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `BN-${[...bytes].map((b) => alphabet[b % alphabet.length]).join("")}`;
}

/** The next few weekday slots at 10:00 and 14:00 local time. */
export function upcomingSlots(count = 6, now = new Date()): Date[] {
  const slots: Date[] = [];
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  while (slots.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    for (const h of [10, 14]) {
      const s = new Date(d);
      s.setHours(h);
      slots.push(s);
    }
  }
  return slots.slice(0, count);
}

export const formatSlot = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

// ---- Suggested first-meeting agenda for the service officer ----

export interface AgendaItem {
  id: string;
  text: string;
  tone: "bad" | "warn" | "info";
}

export function buildAgenda(plan: ChatContext): AgendaItem[] {
  const items: AgendaItem[] = [];
  items.push({
    id: "appoint",
    tone: "info",
    text: "If the veteran chooses your organization, walk through appointing you (VA Form 21-22) so you can see their claim file. The veteran signs it; the Navigator never files it.",
  });
  for (const t of plan.timeline.filter((t) => t.status === "overdue")) {
    items.push({ id: `o-${t.id}`, tone: "bad", text: `Overdue: ${t.title} (target was ${formatDate(t.due)}). Agree on the next step.` });
  }
  for (const t of plan.timeline.filter((t) => t.status === "due-soon")) {
    items.push({ id: `s-${t.id}`, tone: "warn", text: `Due soon: ${t.title}, by ${formatDate(t.due)}.` });
  }
  const bdd = plan.timeline.find((t) => t.id === "bdd" && t.status !== "done");
  if (bdd) {
    items.push({
      id: "bdd-plan",
      tone: "info",
      text: `BDD window ${formatDate(bdd.opens)} to ${formatDate(bdd.due)}: plan the claim, the evidence and exam availability (45 days after filing).`,
    });
  }
  const missing = plan.documents.filter((d) => d.handling === "upload" && d.status !== "ready");
  if (missing.length) {
    items.push({ id: "missing", tone: "warn", text: `Missing documents: ${missing.map((d) => d.name).join("; ")}. Show where to request each.` });
  }
  if (plan.documents.some((d) => d.handling === "have-ready")) {
    items.push({ id: "have-ready", tone: "info", text: "Remind them to bring Social Security numbers and direct deposit details to the filing. These are never collected in the Navigator." });
  }
  return items;
}

// ---- Fictional cases so the service officer queue isn't empty ----

function demoPlan(intake: Intake, statuses: Partial<Record<string, DocumentStatus>>, done: string[]): ChatContext {
  const today = todayISO();
  const completed = Object.fromEntries(done.map((d) => [d, true]));
  return {
    intake,
    today,
    timeline: buildTimeline(intake, completed, today).map((t) => ({ id: t.rule.id, title: t.rule.title, opens: t.opens, due: t.due, status: t.status })),
    documents: applicableDocuments(intake).map((d) => ({ id: d.id, name: d.name, handling: d.handling, status: statuses[d.id] ?? "not-started" })),
  };
}

export function demoShares(): Share[] {
  const today = todayISO();
  const slots = upcomingSlots(4);
  const at = (i: number) => (slots[i] ?? new Date()).toISOString();
  return [
    {
      code: "BN-DEMO1",
      orgId: "sample-county",
      createdAt: addDays(today, -2),
      expiresAt: addDays(today, SHARE_DAYS - 2),
      slot: at(0),
      meeting: "in-person",
      demo: true,
      plan: demoPlan(
        { branch: "navy", separationType: "separation", separationDate: addDays(today, 150), maritalStatus: "single", priorDivorce: false, hasDependents: false, serviceConnected: "yes", state: "VA" },
        { dd214: "requested", "medical-records": "ready" },
        ["tap"],
      ),
    },
    {
      code: "BN-DEMO2",
      orgId: "sample-county",
      createdAt: addDays(today, -1),
      expiresAt: addDays(today, SHARE_DAYS - 1),
      slot: at(3),
      meeting: "video",
      demo: true,
      plan: demoPlan(
        { branch: "air-force", separationType: "retirement", separationDate: addDays(today, 400), maritalStatus: "married", priorDivorce: true, hasDependents: true, serviceConnected: "no", state: "TX" },
        { orders: "ready", "marriage-certificate": "ready" },
        [],
      ),
    },
    {
      code: "BN-DEMO3",
      orgId: "harbor-point",
      createdAt: addDays(today, -3),
      expiresAt: addDays(today, SHARE_DAYS - 3),
      slot: at(1),
      meeting: "phone",
      demo: true,
      plan: demoPlan(
        { branch: "marine-corps", separationType: "separation", separationDate: addDays(today, 60), maritalStatus: "married", priorDivorce: false, hasDependents: true, serviceConnected: "not-sure", state: "NC" },
        { dd214: "ready" },
        ["tap", "education"],
      ),
    },
  ];
}
