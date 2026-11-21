import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { labelFor, type ChatContext } from "@vbn/shared";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { PrototypeBanner, SkipLink, useDocumentTitle, Wordmark } from "../components/Common";
import { IconArrowRight, IconUsers } from "../components/Icons";
import { PlanView, SecurityNote, SessionControls, SessionStatus, VideoTile } from "../components/Session";
import { PRODUCT_NAME } from "../config";
import { buildAgenda, DEMO_ORGS, demoShares, formatSlot, isExpired, loadShares, MEETING_LABEL, meetingOf, normalizeCode, orgName, type Share } from "../lib/help";
import { useLiveSession } from "../lib/liveSession";
import { useStoredState } from "../lib/storage";
import { formatDate } from "../lib/useNavigator";

export const DEFAULT_REP_ORG = DEMO_ORGS[0]!.id;
export const parseRepSearch = (q: Record<string, unknown>): { org?: string } =>
  typeof q.org === "string" && DEMO_ORGS.some((o) => o.id === q.org) ? { org: q.org } : {};

function RepShell({ orgId, children }: { orgId: string; children: ReactNode }) {
  const navigate = useNavigate();
  const selectId = useId();
  return (
    <>
      <SkipLink />
      <PrototypeBanner />
      <header className="on-dark border-b border-navy-800 bg-navy-900 text-paper">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
          <Link to="/rep" search={{ org: orgId }} aria-label="Service officer console home" className="rounded-md"><Wordmark dark /></Link>
          <div className="flex flex-wrap items-center gap-2 text-base text-paper/90">
            <IconUsers size={20} className="text-gold" />
            <span>Service officer console ·</span>
            <label htmlFor={selectId} className="sr-only">Your organization (demo)</label>
            <select
              id={selectId}
              value={orgId}
              onChange={(e) => void navigate({ to: "/rep", search: { org: e.target.value } })}
              className="min-h-11 rounded-md border border-paper/40 bg-navy-800 px-2 text-paper"
            >
              {DEMO_ORGS.map((o) => <option key={o.id} value={o.id}>{o.name} (demo)</option>)}
            </select>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="container-page py-8 outline-none">{children}</main>
    </>
  );
}

/** Every active share this browser knows about. In production this is a server lookup scoped to the officer's organization. */
function useAllShares(): Share[] {
  useStoredState(); // live updates when the veteran tab shares or stops sharing
  return [...loadShares().filter((s) => !s.demo && !isExpired(s)), ...demoShares()];
}

const whenText = (s: Share) => `${MEETING_LABEL[meetingOf(s)]} · ${s.slot ? formatSlot(s.slot) : "Now"}`;

/** The veteran tells the officer their code; the officer opens it. Only works for plans shared with this office. */
function OpenByCode({ orgId, all, onOpen }: { orgId: string; all: Share[]; onOpen: (code: string) => void }) {
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setMessage("Enter the code the veteran gives you, like BN-QBKH.");
      return inputRef.current?.focus();
    }
    const code = normalizeCode(value);
    const share = all.find((s) => s.code === code);
    if (!share) {
      setMessage(`No active shared plan has the code ${code}. Check it with the veteran. (Demo: their Navigator must be open in this same browser.)`);
      return inputRef.current?.focus();
    }
    if (share.orgId !== orgId) {
      setMessage(`${code} was shared with ${orgName(share.orgId)}, not your office. The veteran chooses who can see their plan.`);
      return inputRef.current?.focus();
    }
    setMessage(null);
    setValue("");
    onOpen(code);
  };
  return (
    <form noValidate onSubmit={submit} className="card p-4">
      <label htmlFor={inputId} className="field-label">Open a case by code</label>
      <div className="flex gap-2">
        <input
          id={inputId}
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="BN-QBKH"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="input font-mono uppercase"
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${inputId}-msg` : undefined}
        />
        <button type="submit" className="btn btn-primary shrink-0">Open</button>
      </div>
      {message && <p id={`${inputId}-msg`} role="alert" className="mt-2 text-base font-semibold text-bad">{message}</p>}
    </form>
  );
}

const summary = (p: ChatContext) =>
  `${labelFor.branch(p.intake.branch)} · ${labelFor.separationType(p.intake.separationType)} ${formatDate(p.intake.separationDate)} · ${labelFor.state(p.intake.state)}`;

function Agenda({ plan }: { plan: ChatContext }) {
  const items = buildAgenda(plan);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const tone = { bad: "border-l-bad", warn: "border-l-gold", info: "border-l-navy-600" } as const;
  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.id} className={`rounded-lg border border-l-4 border-line bg-white px-3 py-2 ${tone[a.tone]}`}>
          <label className="flex cursor-pointer gap-3 text-base">
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-ok" checked={Boolean(done[a.id])} onChange={(e) => setDone((d) => ({ ...d, [a.id]: e.target.checked }))} />
            <span className={done[a.id] ? "text-muted line-through" : ""}>{a.text}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

export function RepConsolePage({ orgId = DEFAULT_REP_ORG }: { orgId?: string }) {
  useDocumentTitle(`Service officer console · ${PRODUCT_NAME}`);
  const all = useAllShares();
  const queue = all.filter((s) => s.orgId === orgId);
  const [selected, setSelected] = useState<string | null>(null);
  const current = queue.find((s) => s.code === selected) ?? queue[0] ?? null;
  const caseHeadingRef = useRef<HTMLHeadingElement>(null);
  const [opened, setOpened] = useState(0);
  useEffect(() => {
    if (opened) caseHeadingRef.current?.focus();
  }, [opened]);

  return (
    <RepShell orgId={orgId}>
      <h1 className="text-4xl text-navy-900">Shared plans</h1>
      <p className="prose-measure mt-2 text-lg text-muted">
        Veterans who chose your office and shared a read-only summary. Review before you meet, or open a case with the code the veteran gives you.
      </p>
      <div className="mt-4">
        <SecurityNote>
          Demo console. In production: signed-in, accredited staff only; a plan is visible only while the veteran's share is active;
          every view is logged. No names, files or identifiers are shared through the Navigator.
        </SecurityNote>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="space-y-4">
        <OpenByCode orgId={orgId} all={all} onOpen={(code) => { setSelected(code); setOpened((n) => n + 1); }} />
        <nav aria-label="Shared plans">
          {queue.length === 0 && <p className="rounded-lg bg-paper-2 p-4 text-base text-muted">No plans shared with {orgName(orgId)} yet.</p>}
          <ul className="space-y-2">
            {queue.map((s) => {
              const active = current?.code === s.code;
              const overdue = s.plan.timeline.filter((t) => t.status === "overdue").length;
              return (
                <li key={s.code}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => setSelected(s.code)}
                    className={`w-full rounded-xl border-2 bg-white p-4 text-left ${active ? "border-navy-800 bg-navy-100" : "border-line hover:border-navy-600"}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-navy-900">{s.code}</span>
                      {s.demo ? <span className="chip chip-not-started">Fictional</span> : <span className="chip chip-due-soon">New</span>}
                    </span>
                    <span className="mt-1 block text-base">{summary(s.plan)}</span>
                    <span className="mt-1 block text-sm text-muted">
                      {whenText(s)}
                      {overdue > 0 && <span className="font-semibold text-bad"> · {overdue} overdue</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        </div>

        {current && (
          <section aria-labelledby="case-heading" className="min-w-0 space-y-6">
            <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <h2 id="case-heading" ref={caseHeadingRef} tabIndex={-1} className="text-3xl text-navy-900 outline-none">Case {current.code}</h2>
                <p className="text-base text-muted">
                  {whenText(current)} · Access ends {formatDate(current.expiresAt)}
                </p>
              </div>
              {meetingOf(current) === "video" ? (
                <Link to="/rep/session/$code" params={{ code: current.code }} className="btn btn-primary">
                  Join video session <IconArrowRight size={20} />
                </Link>
              ) : (
                <p className="max-w-xs text-base text-muted">
                  {meetingOf(current) === "in-person"
                    ? "Meeting in person: review this plan together. No video needed."
                    : "Phone call: keep this plan open while you talk."}
                </p>
              )}
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <div>
                <h3 className="text-2xl text-navy-900">Suggested first-meeting agenda</h3>
                <p className="mb-3 text-sm text-muted">Generated from the shared plan. A starting point, not advice.</p>
                <Agenda plan={current.plan} />
              </div>
              <div>
                <h3 className="mb-3 text-2xl text-navy-900">Shared plan</h3>
                <PlanView plan={current.plan} />
              </div>
            </div>
          </section>
        )}
      </div>
    </RepShell>
  );
}

export function RepSessionPage() {
  const { code } = useParams({ from: "/rep/session/$code" });
  useDocumentTitle(`Live session ${code} · Service officer console`);
  const share = useAllShares().find((s) => s.code === code);
  const s = useLiveSession("rep", code, null);
  // Prefer the live plan from the session; fall back to the shared snapshot.
  const plan = s.remotePlan === undefined ? (share?.plan ?? null) : s.remotePlan;

  return (
    <RepShell orgId={share?.orgId ?? DEFAULT_REP_ORG}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Live session · {code}</p>
          <h1 className="mt-1 text-3xl text-navy-900 sm:text-4xl">{share ? summary(share.plan) : "Veteran"}</h1>
        </div>
        <SessionStatus status={s.status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section aria-label="Video" className="space-y-4">
          <VideoTile stream={s.remoteStream} label="Veteran" placeholder={s.status === "ended" ? "You left the session." : "Waiting for the veteran to join from their Navigator."} />
          <div className="grid grid-cols-[minmax(0,14rem)_1fr] items-start gap-4">
            <VideoTile stream={s.outgoingVideo} label={s.sharingScreen ? "You (sharing screen)" : "You"} muted mirrored={!s.sharingScreen} placeholder={s.mediaError ? "No camera" : "Camera off"} />
            {s.mediaError && <p className="text-sm text-warn">{s.mediaError}</p>}
          </div>
          <SessionControls s={s} />
          <SecurityNote>Encrypted peer to peer, not recorded. Never ask the veteran to show Social Security numbers, bank details or medical records on screen; collect those through your office's secure process.</SecurityNote>
          {s.status === "ended" && <p><Link to="/rep" search={{ org: share?.orgId }} className="link">Back to shared plans</Link></p>}
          {plan && (
            <div>
              <h2 className="text-2xl text-navy-900">Agenda</h2>
              <div className="mt-3"><Agenda plan={plan} /></div>
            </div>
          )}
        </section>
        <section aria-labelledby="plan-heading" className="card self-start p-5">
          <h2 id="plan-heading" className="text-2xl text-navy-900">Veteran's plan</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            {s.remotePlan ? "Live: updates as the veteran makes changes." : s.remotePlan === null ? "Hidden by the veteran during this session." : share ? "Snapshot from when they shared. Updates live once they join." : "Not shared."}
          </p>
          {plan ? <PlanView plan={plan} compact /> : <p className="rounded-lg bg-paper p-4 text-muted">The veteran has hidden their plan.</p>}
        </section>
      </div>
    </RepShell>
  );
}
