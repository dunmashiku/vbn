import { IntakeSchema, type DocumentStatuses, type Intake, type MilestoneId } from "@vbn/shared";
import { useSyncExternalStore } from "react";

/**
 * Browser-only persistence. Nothing here is ever sent to a server.
 * Keys are versioned so the shape can change without breaking old data.
 */
const KEYS = {
  intake: "bn.intake.v1",
  milestones: "bn.milestones.v1",
  documents: "bn.documents.v1",
  /** Plans the veteran shared with a representative (demo stand-in for a server-side share). */
  shares: "bn.shares.v1",
} as const;

const CHANGE_EVENT = "bn-storage";

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the app keeps working for this session.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function loadIntake(): Intake | null {
  const parsed = IntakeSchema.safeParse(read(KEYS.intake));
  return parsed.success ? parsed.data : null;
}
export const saveIntake = (intake: Intake) => write(KEYS.intake, intake);

export type MilestoneProgress = Partial<Record<MilestoneId, boolean>>;
export const loadMilestones = (): MilestoneProgress => read<MilestoneProgress>(KEYS.milestones) ?? {};
export const saveMilestones = (v: MilestoneProgress) => write(KEYS.milestones, v);

export const loadDocStatuses = (): DocumentStatuses => read<DocumentStatuses>(KEYS.documents) ?? {};
export const saveDocStatuses = (v: DocumentStatuses) => write(KEYS.documents, v);

export const loadSharesRaw = (): unknown[] => read<unknown[]>(KEYS.shares) ?? [];
export const saveSharesRaw = (v: unknown[]) => write(KEYS.shares, v);

export function clearLocalData() {
  for (const k of Object.values(KEYS)) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Re-renders when any Navigator key changes (this tab or another). Returns a stable snapshot string. */
function useStorageVersion(): string {
  return useSyncExternalStore(subscribe, () =>
    Object.values(KEYS)
      .map((k) => {
        try {
          return localStorage.getItem(k) ?? "";
        } catch {
          return "";
        }
      })
      .join("\u0000"),
  );
}

export function useStoredState() {
  // The version string changes whenever storage changes; parsing is cheap.
  useStorageVersion();
  return {
    intake: loadIntake(),
    milestones: loadMilestones(),
    docStatuses: loadDocStatuses(),
    sharesRaw: loadSharesRaw(),
  };
}
