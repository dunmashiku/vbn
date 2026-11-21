import { Link } from "@tanstack/react-router";
import { labelFor, type MilestoneStatus } from "@vbn/shared";
import { useEffect, useState } from "react";
import { useDocumentTitle } from "../components/Common";
import { IconCheck, IconChevronDown, IconExternal, IconFile } from "../components/Icons";
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

export function TimelinePage() {
  useDocumentTitle(`My timeline · ${PRODUCT_NAME}`);
  const data = useNavigatorData();
  // Which cards are open. Starts with what needs attention (overdue or due soon), or the next step if nothing does.
  const [expanded, setExpanded] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!data || expanded) return;
    const urgent = data.timeline.filter((t) => t.status === "overdue" || t.status === "due-soon").map((t) => t.rule.id);
    const next = data.timeline.find((t) => t.status !== "done")?.rule.id;
    const initial = new Set<string>(urgent.length ? urgent : next ? [next] : []);
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("m-")) initial.add(hash.slice(2));
    setExpanded(initial);
  }, [data, expanded]);

  // Scroll to a milestone linked from the landing page (e.g. /timeline#m-bdd), once its card is open.
  useEffect(() => {
    if (!expanded) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    // Wait a frame so the opened card is laid out (and scroll restoration has run) before scrolling.
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(hash);
      if (!el) return;
      el.querySelector<HTMLElement>("h3 button")?.focus({ preventScroll: true });
      el.scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [expanded !== null]);

  if (!data) return null;
  const open = expanded ?? new Set<string>();
  const setCard = (id: string, isOpen: boolean) =>
    setExpanded((prev) => {
      const next = new Set(prev ?? []);
      if (isOpen) next.add(id);
      else next.delete(id);
      return next;
    });
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
        {/* Value first, account later: a quiet offer, never in the way of the steps. Demo screens only. */}
        <p className="mt-3 text-base text-muted">
          Saved in this browser.{" "}
          <Link to="/signin/veteran" search={{ mode: "signup" }} className="link">Save to a free account</Link> to use it on any device.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="sr-only">Steps</h2>
        <p className="text-base text-muted" aria-live="polite">
          {open.size} of {data.timeline.length} steps open
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn btn-sm btn-outline" disabled={open.size === data.timeline.length} onClick={() => setExpanded(new Set(data.timeline.map((t) => t.rule.id)))}>
            Expand all
          </button>
          <button type="button" className="btn btn-sm btn-outline" disabled={open.size === 0} onClick={() => setExpanded(new Set())}>
            Collapse all
          </button>
        </div>
      </div>

      <ol className="relative mt-4">
        <span aria-hidden="true" className="absolute bottom-4 left-[11px] top-4 w-0.5 bg-line sm:left-[13px]" />
        {timeline.map((t) => {
          const title = t.rule.id === "state-benefits" ? `${t.rule.title}: ${labelFor.state(intake.state)}` : t.rule.title;
          const checkboxId = `done-${t.rule.id}`;
          const isOpen = open.has(t.rule.id);
          const bodyId = `body-${t.rule.id}`;
          return (
            <li key={t.rule.id} id={`m-${t.rule.id}`} className="relative scroll-mt-28 pb-5 pl-10 sm:pl-12">
              <span aria-hidden="true" className={`absolute left-0 top-5 grid h-6 w-6 place-items-center rounded-full border-[3px] ring-4 ring-paper sm:h-7 sm:w-7 ${DOT[t.status]}`}>
                {t.status === "done" && <IconCheck size={14} strokeWidth={3} className="text-white" />}
              </span>
              <article className={`card p-4 sm:p-5 ${t.status === "done" ? "opacity-80" : ""}`} aria-labelledby={`h-${t.rule.id}`}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="font-semibold text-navy-800">{formatWindow(t.opens, t.due)}</p>
                  <span className={`chip chip-${t.status}`}>
                    <span className="sr-only">Status: </span>{STATUS_LABEL[t.status]}
                  </span>
                </div>
                <h3 id={`h-${t.rule.id}`} className="mt-1.5 text-xl text-navy-900">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={bodyId}
                    onClick={() => setCard(t.rule.id, !isOpen)}
                    className="-mx-2 flex w-[calc(100%+1rem)] items-start justify-between gap-3 rounded-md px-2 py-0.5 text-left hover:bg-paper/70"
                  >
                    <span>{title}</span>
                    <span aria-hidden="true" className="mt-0.5 flex shrink-0 items-center gap-1 font-sans text-base font-semibold text-navy-800">
                      <span className="hidden sm:inline">{isOpen ? "Hide" : "Show"}</span>
                      <IconChevronDown size={22} className={`transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                </h3>
                <p className="mt-0.5 text-base text-muted">{t.windowLabel}</p>

                <div id={bodyId} hidden={!isOpen}>
                <p className="prose-measure mt-2">{t.rule.explanation}</p>

                {t.documents.length > 0 && (
                  <div className="mt-3 rounded-lg bg-paper px-4 py-3">
                    <h4 className="font-sans text-base font-bold">Documents for this step</h4>
                    <ul className="mt-1.5 space-y-1 text-base">
                      {t.documents.map((d) => {
                        const st = data.docStatus(d.id);
                        return (
                          <li key={d.id} className="flex items-start justify-between gap-3">
                            <span className="flex min-w-0 items-start gap-2">
                              <IconFile size={18} className="mt-1 shrink-0 text-muted" />
                              <Link to="/documents" hash={`d-${d.id}`} className="link">{d.shortName}</Link>
                            </span>
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

                <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
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
