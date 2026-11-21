import { Link, useParams } from "@tanstack/react-router";
import { labelFor, type ChatContext } from "@vbn/shared";
import { useState, type ReactNode } from "react";
import { PrototypeBanner, SkipLink, useDocumentTitle, Wordmark } from "../components/Common";
import { IconArrowRight, IconUsers } from "../components/Icons";
import { PlanView, SecurityNote, SessionControls, SessionStatus, VideoTile } from "../components/Session";
import { PRODUCT_NAME } from "../config";
import { buildAgenda, demoShares, formatSlot, isExpired, loadShares, orgName, type Share } from "../lib/help";
import { useLiveSession } from "../lib/liveSession";
import { useStoredState } from "../lib/storage";
import { formatDate } from "../lib/useNavigator";

function RepShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <PrototypeBanner />
      <header className="on-dark border-b border-navy-800 bg-navy-900 text-paper">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
          <Link to="/rep" aria-label="Service officer console home" className="rounded-md"><Wordmark dark /></Link>
          <p className="flex items-center gap-2 text-base text-paper/90">
            <IconUsers size={20} className="text-gold" /> Service officer console · Sample County Veterans Service Office (demo)
          </p>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="container-page py-8 outline-none">{children}</main>
    </>
  );
}

function useQueue(): Share[] {
  useStoredState(); // live updates when the veteran tab shares or stops sharing
  return [...loadShares().filter((s) => !s.demo && !isExpired(s)), ...demoShares()];
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

export function RepConsolePage() {
  useDocumentTitle(`Service officer console · ${PRODUCT_NAME}`);
  const queue = useQueue();
  const [selected, setSelected] = useState<string | null>(null);
  const current = queue.find((s) => s.code === selected) ?? queue[0] ?? null;

  return (
    <RepShell>
      <h1 className="text-4xl text-navy-900">Shared plans</h1>
      <p className="prose-measure mt-2 text-lg text-muted">
        Veterans who chose your office and shared a read-only summary. Review before you meet; join a live session when they're ready.
      </p>
      <div className="mt-4">
        <SecurityNote>
          Demo console. In production: signed-in, accredited staff only; a plan is visible only while the veteran's share is active;
          every view is logged. No names, files or identifiers are shared through the Navigator.
        </SecurityNote>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <nav aria-label="Shared plans">
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
                      {s.slot ? formatSlot(s.slot) : "Wants to talk now"}
                      {overdue > 0 && <span className="font-semibold text-bad"> · {overdue} overdue</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {current && (
          <section aria-labelledby="case-heading" className="min-w-0 space-y-6">
            <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <h2 id="case-heading" className="text-3xl text-navy-900">Case {current.code}</h2>
                <p className="text-base text-muted">
                  Shared with {orgName(current.orgId)} · {current.slot ? `Meeting ${formatSlot(current.slot)}` : "Live session requested"} · Access ends {formatDate(current.expiresAt)}
                </p>
              </div>
              <Link to="/rep/session/$code" params={{ code: current.code }} className="btn btn-primary">
                Join live session <IconArrowRight size={20} />
              </Link>
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
  const queue = useQueue();
  const share = queue.find((s) => s.code === code);
  const s = useLiveSession("rep", code, null);
  // Prefer the live plan from the session; fall back to the shared snapshot.
  const plan = s.remotePlan === undefined ? (share?.plan ?? null) : s.remotePlan;

  return (
    <RepShell>
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
          {s.status === "ended" && <p><Link to="/rep" className="link">Back to shared plans</Link></p>}
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
