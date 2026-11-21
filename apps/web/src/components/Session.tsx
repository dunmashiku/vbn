import { labelFor, type ChatContext } from "@vbn/shared";
import { useEffect, useRef, type ReactNode } from "react";
import type { LiveSession } from "../lib/liveSession";
import { formatDateLong, formatWindow } from "../lib/useNavigator";
import { STATUS_LABEL } from "../routes/Timeline";
import { IconShield } from "./Icons";

export function VideoTile({ stream, label, muted = false, mirrored = false, placeholder }: { stream: MediaStream | null; label: string; muted?: boolean; mirrored?: boolean; placeholder: ReactNode }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  const hasVideo = Boolean(stream?.getVideoTracks().length);
  return (
    <figure className="relative aspect-video overflow-hidden rounded-xl bg-navy-950">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full object-cover ${mirrored ? "-scale-x-100" : ""} ${hasVideo ? "" : "hidden"}`}
        aria-label={label}
      />
      {!hasVideo && <div className="grid h-full place-items-center p-4 text-center text-paper/80">{placeholder}</div>}
      <figcaption className="absolute bottom-2 left-2 rounded-md bg-navy-950/80 px-2 py-1 text-sm font-semibold text-paper">{label}</figcaption>
    </figure>
  );
}

const STATUS_TEXT: Record<LiveSession["status"], string> = {
  starting: "Starting camera…",
  waiting: "Waiting for the other person to join…",
  connecting: "Connecting…",
  connected: "Connected",
  ended: "Session ended",
};

export function SessionStatus({ status }: { status: LiveSession["status"] }) {
  const tone = status === "connected" ? "chip-done" : status === "ended" ? "chip-not-started" : "chip-due-soon";
  return (
    <p role="status" aria-live="polite" className={`chip ${tone}`}>
      {status === "connected" && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-ok" />}
      {STATUS_TEXT[status]}
    </p>
  );
}

export function SessionControls({ s, children }: { s: LiveSession; children?: ReactNode }) {
  const disabled = s.status === "ended";
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Call controls">
      <button type="button" className="btn btn-sm btn-outline" aria-pressed={s.micOn} disabled={disabled || !s.localStream} onClick={s.toggleMic}>
        {s.micOn ? "Mute mic" : "Unmute mic"}
      </button>
      <button type="button" className="btn btn-sm btn-outline" aria-pressed={s.camOn} disabled={disabled || !s.localStream} onClick={s.toggleCam}>
        {s.camOn ? "Turn camera off" : "Turn camera on"}
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline"
        aria-pressed={s.sharingScreen}
        disabled={disabled}
        onClick={() => (s.sharingScreen ? s.stopScreenShare() : void s.startScreenShare())}
      >
        {s.sharingScreen ? "Stop sharing screen" : "Share a tab or screen"}
      </button>
      {children}
      <button type="button" className="btn btn-sm ml-auto bg-bad text-white hover:bg-[#7f2416]" disabled={disabled} onClick={s.end}>
        End session
      </button>
    </div>
  );
}

export function SecurityNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2 rounded-lg bg-info-bg px-3 py-2 text-sm text-info">
      <IconShield size={18} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Read-only plan summary, as a representative would see it. */
export function PlanView({ plan, compact = false }: { plan: ChatContext; compact?: boolean }) {
  const i = plan.intake;
  const missing = plan.documents.filter((d) => d.status !== "ready");
  return (
    <div className="space-y-5 text-base">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div><dt className="text-muted">Branch</dt><dd className="font-semibold">{labelFor.branch(i.branch)}</dd></div>
        <div><dt className="text-muted">{labelFor.separationType(i.separationType)}</dt><dd className="font-semibold">{formatDateLong(i.separationDate)}</dd></div>
        <div><dt className="text-muted">Family</dt><dd className="font-semibold">{labelFor.maritalStatus(i.maritalStatus)}{i.priorDivorce ? " (prior divorce)" : ""}{i.hasDependents ? ", dependents" : ""}</dd></div>
        <div><dt className="text-muted">Service-connected</dt><dd className="font-semibold">{labelFor.serviceConnected(i.serviceConnected)}</dd></div>
        <div><dt className="text-muted">State after service</dt><dd className="font-semibold">{labelFor.state(i.state)}</dd></div>
      </dl>
      <div>
        <h3 className="font-sans text-base font-bold">Timeline</h3>
        <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-white">
          {plan.timeline.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="min-w-0">
                <span className="block font-medium leading-snug">{t.title}</span>
                {!compact && <span className="text-sm text-muted">{formatWindow(t.opens, t.due)}</span>}
              </span>
              <span className={`chip chip-${t.status}`}>{STATUS_LABEL[t.status]}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-sans text-base font-bold">Documents ({plan.documents.length - missing.length} of {plan.documents.length} ready)</h3>
        <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-white">
          {plan.documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="min-w-0 leading-snug">{d.name}</span>
              {d.handling === "have-ready" ? (
                <span className={`chip ${d.status === "ready" ? "chip-ready" : "chip-not-started"}`}>{d.status === "ready" ? "Ready" : "Have ready"}</span>
              ) : (
                <span className={`chip chip-${d.status}`}>{d.status === "ready" ? "Ready" : d.status === "requested" ? "Requested" : "Not started"}</span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-muted">Names and statuses only. Files, Social Security numbers and bank details are never shared.</p>
      </div>
    </div>
  );
}
