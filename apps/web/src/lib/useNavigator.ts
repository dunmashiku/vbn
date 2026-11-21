import { useQuery } from "@tanstack/react-query";
import {
  answeredCount, applicableDocuments, buildTimeline, prepQuestionCount, todayISO,
  type ChatContext, type DocumentId, type DocumentRule, type DocumentStatus, type Intake, type TimelineItem,
} from "@vbn/shared";
import { useMemo } from "react";
import { listFiles, type StoredFile } from "./docStore";
import { useStoredState } from "./storage";

export const FILES_QUERY_KEY = ["files"] as const;

export function useFiles() {
  return useQuery({ queryKey: FILES_QUERY_KEY, queryFn: listFiles, staleTime: Infinity });
}

export interface NavigatorData {
  intake: Intake;
  today: string;
  timeline: TimelineItem[];
  documents: DocumentRule[];
  files: Partial<Record<DocumentId, StoredFile>>;
  docStatus: (id: DocumentId) => DocumentStatus;
  readyCount: number;
  prepAnswered: number;
}

/** Everything derived from the stored intake. Returns null when there is no intake yet. */
export function useNavigatorData(): NavigatorData | null {
  const { intake, milestones, docStatuses, prepAnswers } = useStoredState();
  const prepAnswered = answeredCount(prepAnswers["21-526ez"] ?? {});
  const filesQuery = useFiles();
  const intakeKey = JSON.stringify(intake);
  const milestonesKey = JSON.stringify(milestones);
  const statusesKey = JSON.stringify(docStatuses);

  return useMemo(() => {
    if (!intake) return null;
    const today = todayISO();
    const files: Partial<Record<DocumentId, StoredFile>> = {};
    for (const f of filesQuery.data ?? []) files[f.docId] = f;
    const docStatus = (id: DocumentId): DocumentStatus => (files[id] ? "ready" : (docStatuses[id] ?? "not-started"));
    const documents = applicableDocuments(intake);
    return {
      intake,
      today,
      timeline: buildTimeline(intake, milestones, today),
      documents,
      files,
      docStatus,
      readyCount: documents.filter((d) => docStatus(d.id) === "ready").length,
      prepAnswered,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intakeKey, milestonesKey, statusesKey, prepAnswered, filesQuery.data]);
}

/** The summary sent with each chat request. Never includes file contents or file names. */
export function toChatContext(d: NavigatorData): ChatContext {
  return {
    intake: d.intake,
    today: d.today,
    timeline: d.timeline.map((t) => ({ id: t.rule.id, title: t.rule.title, opens: t.opens, due: t.due, status: t.status })),
    documents: d.documents.map((doc) => ({ id: doc.id, name: doc.name, handling: doc.handling, status: d.docStatus(doc.id) })),
    formPrep: d.prepAnswered ? { answered: d.prepAnswered, total: prepQuestionCount() } : undefined,
  };
}

const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const fmtLong = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export const formatDate = (iso: string) => fmt.format(new Date(`${iso}T00:00:00Z`));
export const formatDateLong = (iso: string) => fmtLong.format(new Date(`${iso}T00:00:00Z`));

/** "Start Nov 25, 2025 · Due Nov 24, 2026": labeled so a one-year window doesn't read as a typo. */
export function formatWindow(opens: string, due: string): string {
  if (opens === due) return `Due ${formatDate(due)}`;
  return `Start ${formatDate(opens)} · Due ${formatDate(due)}`;
}

export function learnMoreLabel(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (host.endsWith("va.gov")) return "Learn more on VA.gov";
  if (host.endsWith("tricare.mil")) return "Learn more on TRICARE.mil";
  if (host.endsWith("defense.gov")) return "Learn more on Defense.gov";
  if (host.endsWith("dodtap.mil")) return "Learn more on DoDTAP.mil";
  return `Learn more on ${host}`;
}
