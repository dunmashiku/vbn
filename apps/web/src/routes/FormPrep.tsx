import { Link, useParams } from "@tanstack/react-router";
import { PREP_FORMS, answeredCount, prepFormById, prepQuestionCount, type PrepForm, type PrepQuestion, type PrepSection } from "@vbn/shared";
import { useEffect, useId, useRef, useState } from "react";
import { useChat } from "../components/Chat";
import { useDocumentTitle } from "../components/Common";
import { IconCheck, IconExternal, IconShield, IconSparkle } from "../components/Icons";
import { PRODUCT_NAME } from "../config";
import { looksSensitive } from "../lib/chatClient";
import { savePrepAnswer, useStoredState } from "../lib/storage";

const REP_SEARCH_URL = "https://www.va.gov/get-help-from-accredited-representative/find-rep/";

const keyOf = (s: PrepSection, q: PrepQuestion) => `${s.id}.${q.id}`;

function Question({ form, section, q, value, onActive }: { form: PrepForm; section: PrepSection; q: PrepQuestion; value: string; onActive: () => void }) {
  const id = useId();
  const helpId = useId();
  const { ask, pending } = useChat();
  const [draft, setDraft] = useState(value);
  const [warning, setWarning] = useState<string | null>(null);

  // Saves on every change, so nothing is lost if the tab closes mid-answer.
  const save = (v: string) => {
    if (looksSensitive(v)) {
      setWarning("That looks like a Social Security, bank or account number. We removed it: type it only on the official form, not here.");
      setDraft(value);
      return;
    }
    setWarning(null);
    setDraft(v);
    savePrepAnswer(form.id, keyOf(section, q), v.slice(0, 2000));
  };
  const describedBy = q.help ? helpId : undefined;

  return (
    <div className="border-t border-line pt-6 first:border-t-0 first:pt-0" onFocusCapture={onActive}>
      <label htmlFor={id} className="block font-semibold text-navy-900">
        {q.label} <span className="text-sm font-normal text-muted">({q.items})</span>
      </label>
      {q.help && <p id={helpId} className="mt-1 text-base text-muted">{q.help}</p>}
      <div className="mt-3 flex flex-col items-start gap-3">
      {q.kind === "choice" ? (
        <select id={id} aria-describedby={describedBy} className="input w-full sm:w-80" value={value} onChange={(e) => save(e.target.value)}>
          <option value="">Choose…</option>
          {q.options!.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : q.kind === "long" ? (
        <textarea id={id} aria-describedby={describedBy} rows={4} maxLength={2000} className="input w-full text-base" value={draft} onChange={(e) => save(e.target.value)} />
      ) : (
        <input id={id} aria-describedby={describedBy} maxLength={300} className="input w-full" value={draft} onChange={(e) => save(e.target.value)} />
      )}
      {warning && <p role="alert" className="rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">{warning}</p>}
      <button
        type="button"
        className="btn btn-sm btn-outline"
        disabled={pending}
        onClick={() =>
          ask(`On ${form.number}, ${q.items} asks: "${q.label}". What does this question mean, and what should I think about or gather before I answer it?`, {
            display: `What does ${q.items} mean?`,
          })
        }
      >
        <IconSparkle size={16} /> Ask the Navigator about this
      </button>
      </div>
    </div>
  );
}

/** The real page of the official form, with the current question's area highlighted. Answers are never drawn on it. */
function FormPagePreview({ form, q }: { form: PrepForm; q: PrepQuestion | undefined }) {
  const markRef = useRef<HTMLDivElement>(null);
  const where = q?.where;
  useEffect(() => {
    markRef.current?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [where?.page, where?.top]);
  if (!where) return <p className="text-base text-muted">Choose a question to see where it is on the form.</p>;
  const src = form.pageImages[where.page];
  return (
    <figure>
      <figcaption className="mb-2 text-sm">
        <span className="font-semibold">Page {where.page} · {q!.items}</span>
        <span className="text-muted"> of the official {form.number} ({form.revision}). Your answers aren't written on the form.</span>
      </figcaption>
      <div className="max-h-[calc(100vh-12rem)] overflow-auto rounded-lg border border-line bg-white">
        <div className="relative">
          <img src={src} alt={`Page ${where.page} of the official ${form.number}, with ${q!.items} highlighted.`} className="block w-full" />
          <div
            ref={markRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[3%] rounded border-[3px] border-gold bg-gold/20"
            style={{ top: `${where.top}%`, height: `${where.bottom - where.top}%` }}
          />
        </div>
      </div>
      <a href={form.pdfUrl} target="_blank" rel="noopener noreferrer" className="link mt-2 inline-flex items-center gap-1 text-sm">
        Open the official PDF <IconExternal size={14} /><span className="sr-only"> (opens in a new tab)</span>
      </a>
    </figure>
  );
}

export function FormPrepPage() {
  const { formId } = useParams({ from: "/app/forms/$formId" });
  const form = prepFormById(formId);
  useDocumentTitle(`Prepare your ${form?.number ?? "form"} · ${PRODUCT_NAME}`);
  const { prepAnswers } = useStoredState();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  if (!form) {
    return (
      <div className="card p-6">
        <h1 className="text-3xl text-navy-900">We don't have a guide for that form yet</h1>
        <p className="mt-2"><Link to="/forms" className="link">See the forms we can help you prepare</Link></p>
      </div>
    );
  }

  const answers = prepAnswers[form.id] ?? {};
  const answered = answeredCount(answers, form);
  const total = prepQuestionCount(form);
  const all = form.sections.flatMap((s) => s.questions.map((q) => ({ key: keyOf(s, q), q })));
  const active = all.find((x) => x.key === activeKey)?.q ?? all[0]?.q;

  return (
    <div className="space-y-6">
      <div className="print-hide">
        <p className="eyebrow">
          <Link to="/forms" className="link">All forms</Link> <span aria-hidden="true">›</span> {form.number} · {form.revision} version
        </p>
        <h1 className="mt-1 text-4xl text-navy-900">{form.heading ?? `Prepare your ${form.number}`}</h1>
        <p className="prose-measure mt-3 text-lg">
          Go through the questions on the official form in plain words, at your own pace. The official page shows where each answer goes. Your
          answers stay in this browser. When you're done, print your prep sheet and copy it into VA.gov, or go over it with a free accredited
          representative.
        </p>
        <div className="mt-4 flex gap-3 rounded-xl border border-line bg-white p-4">
          <IconShield size={22} className="mt-0.5 shrink-0 text-navy-700" />
          <p className="text-base">
            {PRODUCT_NAME} never fills in or submits your form, and the chat never sees your answers. Don't type your Social Security number,
            date of birth or bank details here: you'll enter those only on the official form.{" "}
            <a href={REP_SEARCH_URL} target="_blank" rel="noopener noreferrer" className="link">Find a free accredited representative<span className="sr-only"> (opens in a new tab)</span></a>.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-base font-semibold" aria-live="polite">{answered} of {total} questions answered</p>
          <p className="flex items-center gap-1.5 text-base text-ok">
            <IconCheck size={18} /> Saved automatically in this browser
          </p>
        </div>
        <p className="mt-1 text-sm text-muted">
          Come back any time on this device and browser to pick up where you left off. Private windows and "Clear my data" erase it.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="space-y-6 print-hide">
          {/* Smaller screens: the official page sits above the questions, folded. */}
          <details className="card p-4 lg:hidden">
            <summary className="cursor-pointer font-semibold text-navy-900">Show where this goes on the official form</summary>
            <div className="mt-3"><FormPagePreview form={form} q={active} /></div>
          </details>

          {form.sections.map((s, i) => (
            <section key={s.id} aria-labelledby={`prep-${s.id}`} className="card p-4 sm:p-5">
              <p className="eyebrow">Step {i + 1} · {s.formSection}</p>
              <h2 id={`prep-${s.id}`} className="mt-1 text-2xl text-navy-900">{s.title}</h2>
              <p className="mt-1 text-base">{s.intro}</p>
              {s.haveReady && (
                <div className="mt-3 rounded-lg bg-paper-2 px-4 py-3">
                  <p className="text-base font-semibold">Have these ready for the official form (don't type them here):</p>
                  <ul className="mt-1 list-disc pl-6 text-base">{s.haveReady.map((h) => <li key={h}>{h}</li>)}</ul>
                </div>
              )}
              <div className="mt-5 space-y-6">
                {s.questions.map((q) => (
                  <Question key={q.id} form={form} section={s} q={q} value={answers[keyOf(s, q)] ?? ""} onActive={() => setActiveKey(keyOf(s, q))} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside aria-label="Official form preview" className="hidden print-hide lg:block">
          <div className="sticky top-[4.5rem]"><FormPagePreview form={form} q={active} /></div>
        </aside>
      </div>

      <section aria-labelledby="prep-sheet" className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="prep-sheet" className="text-2xl text-navy-900">My prep sheet</h2>
          <button type="button" className="btn btn-primary print-hide" onClick={() => window.print()}>Print my prep sheet</button>
        </div>
        <p className="mt-1 text-base text-muted">
          For {form.number} ({form.revision}). My own notes to copy onto the official form or review with my representative. Not a VA form.
        </p>
        {answered === 0 ? (
          <p className="mt-3">Your answers will appear here.</p>
        ) : (
          <dl className="mt-3 space-y-3">
            {form.sections.flatMap((s) =>
              s.questions
                .filter((q) => answers[keyOf(s, q)]?.trim())
                .map((q) => (
                  <div key={keyOf(s, q)}>
                    <dt className="font-semibold">{q.items}: {q.label}</dt>
                    <dd className="whitespace-pre-line">{answers[keyOf(s, q)]}</dd>
                  </div>
                )),
            )}
          </dl>
        )}
        <div className="mt-4 flex flex-wrap gap-3 print-hide">
          <a href={form.aboutUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            About this form on VA.gov <IconExternal size={16} /><span className="sr-only"> (opens in a new tab)</span>
          </a>
          <Link to="/help" className="btn btn-outline">Get help from a representative</Link>
        </div>
      </section>
    </div>
  );
}

/** The list of forms with a prep guide, with progress on each. */
export function FormsListPage() {
  useDocumentTitle(`Prepare your forms · ${PRODUCT_NAME}`);
  const { prepAnswers } = useStoredState();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-navy-900">Prepare your forms</h1>
        <p className="prose-measure mt-3 text-lg">
          Go through a VA form's questions in plain words, see where each answer goes on the official form, and print a prep sheet to copy
          into VA.gov or review with a free accredited representative. Your answers save in this browser as you type. {PRODUCT_NAME} never fills
          in or submits a form.
        </p>
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        {PREP_FORMS.map((f) => {
          const done = answeredCount(prepAnswers[f.id] ?? {}, f);
          const total = prepQuestionCount(f);
          return (
            <li key={f.id} className="card flex flex-col p-5">
              <p className="eyebrow">{f.number} · {f.revision}</p>
              <h2 className="mt-1 text-2xl text-navy-900">{f.title}</h2>
              {f.whenToUse && <p className="mt-2 text-base">{f.whenToUse}</p>}
              <p className="mt-3 text-base text-muted">{done ? `${done} of ${total} questions answered` : `${total} questions`}</p>
              <div className="mt-4">
                <Link to="/forms/$formId" params={{ formId: f.id }} className="btn btn-primary">
                  {done ? "Continue" : "Start"}<span className="sr-only"> {f.number}</span>
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
