import { Link } from "@tanstack/react-router";
import { labelFor, type MilestoneStatus } from "@vbn/shared";
import { useEffect, useState } from "react";
import { useDocumentTitle } from "../components/Common";
import { IconCheck, IconExternal, IconFile } from "../components/Icons";
import { PRODUCT_NAME } from "../config";
import { loadMilestones, saveMilestones } from "../lib/storage";
import { formatDateLong, formatWindow, learnMoreLabel, useNavigatorData } from "../lib/useNavigator";

export const STATUS_LABEL: Record<MilestoneStatus, string> = {
  upcoming: "Upcoming",
  "due-soon": "Due soon",
  overdue: "Overdue",
  done: "Done",
};

const DOT: Record<MilestoneStatus, string> = {
  upcoming: "bg-white border-navy-600",
  "due-soon": "bg-gold border-gold",
  overdue: "bg-bad border-bad",
  done: "bg-ok border-ok",
};

/** Offers a free account after the timeline exists (value first). Demo only: the sign-up screens store nothing. */
function SaveTimelineCard() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <section aria-labelledby="save-heading" className="mt-6 rounded-xl border-2 border-gold bg-white p-5 sm:p-6">
      <h2 id="save-heading" className="font-sans text-xl font-bold text-navy-900">Save your timeline</h2>
      <p className="prose-measure mt-1 text-base">
        Create a free account to pick it up on any device and share it with a representative. It's optional: everything works without one.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link to="/signin/veteran" search={{ mode: "signup" }} className="btn btn-primary">Create a free account</Link>
        <button type="button" className="btn btn-quiet" onClick={() => setHidden(true)}>Not now</button>
      </div>
      <p className="prose-measure mt-4 border-t border-line pt-3 text-base text-muted">
        Later, with an account, you could also connect your VA.gov account (Login.gov or ID.me) to see your claim status here.
        Optional, and not part of this demo.
      </p>
    </section>
  );
}

export function TimelinePage() {
  useDocumentTitle(`My timeline · ${PRODUCT_NAME}`);
  const data = useNavigatorData();

  // Scroll to a milestone linked from the landing page (e.g. /timeline#m-bdd).
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ block: "start" });
      el.querySelector<HTMLElement>("h2")?.focus();
    }
  }, [data !== null]);

  if (!data) return null;
  const { intake, timeline } = data;
  const doneCount = timeline.filter((t) => t.status === "done").length;
  const overdue = timeline.filter((t) => t.status === "overdue").length;
  const dueSoon = timeline.filter((t) => t.status === "due-soon").length;

  const toggle = (id: string, done: boolean) => {
    saveMilestones({ ...loadMilestones(), [id]: done });
  };

  return (
    <div>
      <p className="eyebrow">My timeline</p>
      <h1 className="mt-2 text-4xl text-navy-900 sm:text-5xl">Your transition, step by step</h1>

      <section aria-label="Your situation" className="card mt-6 p-5 sm:p-6">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-base sm:grid-cols-4">
          <div><dt className="text-muted">Branch</dt><dd className="font-semibold">{labelFor.branch(intake.branch)}</dd></div>
          <div><dt className="text-muted">{labelFor.separationType(intake.separationType)} date</dt><dd className="font-semibold">{formatDateLong(intake.separationDate)}</dd></div>
          <div><dt className="text-muted">Family</dt><dd className="font-semibold">{labelFor.maritalStatus(intake.maritalStatus)}{intake.hasDependents ? ", with dependents" : ""}</dd></div>
          <div><dt className="text-muted">Moving to</dt><dd className="font-semibold">{labelFor.state(intake.state)}</dd></div>
        </dl>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
          <div className="min-w-[14rem] flex-1">
            <p className="text-base font-semibold" id="progress-label">
              {doneCount} of {timeline.length} steps done
              {overdue > 0 && <span className="text-bad"> · {overdue} overdue</span>}
              {dueSoon > 0 && <span className="text-warn"> · {dueSoon} due soon</span>}
            </p>
            <div role="progressbar" aria-labelledby="progress-label" aria-valuemin={0} aria-valuemax={timeline.length} aria-valuenow={doneCount} className="mt-2 h-2.5 rounded-full bg-paper-2">
              <div className="h-2.5 rounded-full bg-navy-800 transition-[width]" style={{ width: `${(doneCount / Math.max(1, timeline.length)) * 100}%` }} />
            </div>
          </div>
          <Link to="/start" className="link text-base">Edit my answers</Link>
        </div>
      </section>

      <SaveTimelineCard />

      <ol className="relative mt-10">
        <span aria-hidden="true" className="absolute bottom-4 left-[11px] top-4 w-0.5 bg-line sm:left-[13px]" />
        {timeline.map((t) => {
          const title = t.rule.id === "state-benefits" ? `${t.rule.title}: ${labelFor.state(intake.state)}` : t.rule.title;
          const checkboxId = `done-${t.rule.id}`;
          return (
            <li key={t.rule.id} id={`m-${t.rule.id}`} className="relative scroll-mt-28 pb-8 pl-10 sm:pl-12">
              <span aria-hidden="true" className={`absolute left-0 top-6 grid h-6 w-6 place-items-center rounded-full border-[3px] ring-4 ring-paper sm:h-7 sm:w-7 ${DOT[t.status]}`}>
                {t.status === "done" && <IconCheck size={14} strokeWidth={3} className="text-white" />}
              </span>
              <article className={`card p-5 sm:p-6 ${t.status === "done" ? "opacity-80" : ""}`} aria-labelledby={`h-${t.rule.id}`}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="font-semibold text-navy-800">{formatWindow(t.opens, t.due)}</p>
                  <span className={`chip chip-${t.status}`}>
                    <span className="sr-only">Status: </span>{STATUS_LABEL[t.status]}
                  </span>
                </div>
                <h2 id={`h-${t.rule.id}`} tabIndex={-1} className="mt-2 text-2xl text-navy-900 outline-none">{title}</h2>
                <p className="mt-1 text-base text-muted">{t.windowLabel}</p>
                <p className="prose-measure mt-3">{t.rule.explanation}</p>

                {t.documents.length > 0 && (
                  <div className="mt-4 rounded-lg bg-paper p-4">
                    <h3 className="font-sans text-base font-bold">Documents for this step</h3>
                    <ul className="mt-2 space-y-1.5 text-base">
                      {t.documents.map((d) => {
                        const st = data.docStatus(d.id);
                        return (
                          <li key={d.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <IconFile size={18} className="shrink-0 text-muted" />
                            <Link to="/documents" hash={`d-${d.id}`} className="link">{d.name}</Link>
                            {d.handling === "have-ready" ? (
                              <span className={`chip ${st === "ready" ? "chip-ready" : "chip-not-started"}`}>{st === "ready" ? "Ready" : "Have ready"}</span>
                            ) : (
                              <span className={`chip chip-${st}`}>{st === "ready" ? "Ready" : st === "requested" ? "Requested" : "Not started"}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                  <label htmlFor={checkboxId} className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
                    <input
                      id={checkboxId}
                      type="checkbox"
                      className="h-6 w-6 accent-ok"
                      checked={t.status === "done"}
                      onChange={(e) => toggle(t.rule.id, e.target.checked)}
                    />
                    Mark as done
                  </label>
                  <a href={t.rule.sources[0].url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5">
                    {learnMoreLabel(t.rule.sources[0].url)}<span className="sr-only">: {t.rule.shortTitle} (opens in a new tab)</span>
                    <IconExternal size={16} />
                  </a>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
      <p className="prose-measure text-base text-muted">
        Dates are estimates based on your answers and general rules. Always confirm deadlines with the official source or your
        free accredited representative.
      </p>
    </div>
  );
}
