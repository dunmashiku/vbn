import { IconCheck } from "./Icons";

const SAMPLE = [
  { title: "Start the Transition Assistance Program", when: "Jun 2025", chip: "Done", cls: "chip-done", dot: "bg-ok" },
  { title: "File VA disability claim (BDD)", when: "Dec 2026 – Mar 2027", chip: "Due soon", cls: "chip-due-soon", dot: "bg-gold" },
  { title: "Choose Survivor Benefit Plan coverage", when: "By Jun 30, 2027", chip: "Upcoming", cls: "chip-upcoming", dot: "bg-navy-600" },
];

/** Illustrative timeline card, built in HTML so it stays crisp and light. */
export function TimelineMock() {
  return (
    <figure className="relative mx-auto w-full max-w-md">
      <div aria-hidden="true" className="absolute -inset-3 rotate-2 rounded-3xl bg-navy-700/40" />
      <div className="card relative overflow-hidden p-5 text-ink shadow-2xl shadow-navy-950/40 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-muted">Example timeline</p>
            <p className="font-serif text-xl font-semibold text-navy-900">Army · Retiring June 2027</p>
          </div>
          <span className="chip chip-not-started">Sample</span>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted">
            <span>Progress</span>
            <span>1 of 3 done</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-paper-2">
            <div className="h-2 w-1/3 rounded-full bg-navy-800" />
          </div>
        </div>
        <ol className="relative mt-6 space-y-5">
          <span aria-hidden="true" className="absolute bottom-3 left-[9px] top-3 w-0.5 bg-line" />
          {SAMPLE.map((m) => (
            <li key={m.title} className="relative flex gap-4">
              <span aria-hidden="true" className={`relative z-10 mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full ring-4 ring-white ${m.dot}`}>
                {m.chip === "Done" && <IconCheck size={12} className="text-white" strokeWidth={3} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug text-navy-900">{m.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-base text-muted">{m.when}</span>
                  <span className={`chip ${m.cls}`}>{m.chip}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <figcaption className="sr-only">
        An example personal timeline with three milestones and their status.
      </figcaption>
    </figure>
  );
}
