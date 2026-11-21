import { Link, useNavigate } from "@tanstack/react-router";
import {
  addDays, BRANCHES, IntakeSchema, MARITAL_STATUSES, SEPARATION_TYPES, SERVICE_CONNECTED, STATES, todayISO, type Intake,
} from "@vbn/shared";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PrototypeBanner, SkipLink, useDocumentTitle, Wordmark } from "../components/Common";
import { IconArrowRight } from "../components/Icons";
import { PRODUCT_NAME } from "../config";
import { loadIntake, saveIntake } from "../lib/storage";

type Draft = Partial<Record<keyof Intake, string>>;

const FIELD_LABELS: Record<string, string> = {
  branch: "Branch of service",
  separationType: "How you're leaving",
  separationDate: "Expected date",
  maritalStatus: "Marital status",
  hasDependents: "Dependents",
  serviceConnected: "Service-connected condition",
  state: "State after service",
};

function toDraft(i: Intake | null): Draft {
  if (!i) return {};
  return {
    branch: i.branch,
    separationType: i.separationType,
    separationDate: i.separationDate,
    maritalStatus: i.maritalStatus,
    priorDivorce: String(i.priorDivorce),
    hasDependents: i.hasDependents ? "yes" : "no",
    serviceConnected: i.serviceConnected,
    state: i.state,
  };
}

function demoDraft(): Draft {
  const d = new Date();
  d.setMonth(d.getMonth() + 8);
  return {
    branch: "army",
    separationType: "retirement",
    separationDate: d.toISOString().slice(0, 10),
    maritalStatus: "married",
    priorDivorce: "false",
    hasDependents: "yes",
    serviceConnected: "not-sure",
    state: "MD",
  };
}

function RadioGroup({
  name, legend, options, value, onChange, error, columns = 2,
}: {
  name: string; legend: string; options: readonly { value: string; label: string }[]; value?: string;
  onChange: (v: string) => void; error?: string; columns?: 2 | 3;
}) {
  const errId = `${name}-error`;
  return (
    <fieldset id={name} tabIndex={-1} aria-describedby={error ? errId : undefined} className="outline-none">
      <legend className="field-label text-lg">{legend}</legend>
      {error && <p id={errId} className="mb-2 font-semibold text-bad">{error}</p>}
      <div className={`grid gap-2 ${columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2 font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy-800 ${
                checked ? "border-navy-800 bg-navy-100 text-navy-900" : "border-line bg-white hover:border-navy-600"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="h-5 w-5 accent-navy-800"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Field({ children }: { children: ReactNode }) {
  return <div className="border-b border-line py-6 last:border-0">{children}</div>;
}

export function StartPage() {
  useDocumentTitle(`Build your timeline · ${PRODUCT_NAME}`);
  const navigate = useNavigate();
  const existing = loadIntake();
  const [draft, setDraft] = useState<Draft>(() => toDraft(existing));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const summaryRef = useRef<HTMLDivElement>(null);
  const [submitCount, setSubmitCount] = useState(0);
  // Move focus to the error summary after each failed submit.
  useEffect(() => {
    if (submitCount > 0) summaryRef.current?.focus();
  }, [submitCount]);
  const set = (k: keyof Intake) => (v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const minDate = addDays(todayISO(), -365 * 2);
  const maxDate = addDays(todayISO(), 365 * 4);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = {
      branch: draft.branch,
      separationType: draft.separationType,
      separationDate: draft.separationDate,
      maritalStatus: draft.maritalStatus,
      priorDivorce: draft.maritalStatus === "married" && draft.priorDivorce === "true",
      hasDependents: draft.hasDependents === undefined ? undefined : draft.hasDependents === "yes",
      serviceConnected: draft.serviceConnected,
      state: draft.state,
    };
    const result = IntakeSchema.safeParse(candidate);
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!errs[key]) {
          errs[key] = key === "separationDate" && draft.separationDate ? "Enter a valid date." : `Choose your ${FIELD_LABELS[key]?.toLowerCase() ?? "answer"}.`;
        }
      }
      setErrors(errs);
      setSubmitCount((n) => n + 1);
      return;
    }
    saveIntake(result.data);
    void navigate({ to: "/timeline" });
  };

  const errorKeys = Object.keys(FIELD_LABELS).filter((k) => errors[k]);

  return (
    <>
      <SkipLink />
      <PrototypeBanner />
      <header className="border-b border-line bg-paper">
        <div className="container-page flex items-center justify-between py-4">
          <Link to="/" aria-label={`${PRODUCT_NAME} home`} className="rounded-md"><Wordmark /></Link>
          <Link to="/" className="link text-base">Back to home</Link>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="container-page max-w-3xl py-10 outline-none sm:py-14">
        <p className="eyebrow">Step 1 of 1 · about a minute</p>
        <h1 className="mt-2 text-4xl text-navy-900 sm:text-5xl">Tell us about your transition</h1>
        <p className="prose-measure mt-4 text-lg text-muted">
          Seven quick questions. Your answers stay in this browser and shape which deadlines and documents you see. We never
          ask for your name, Social Security number or service records.
        </p>
        <button type="button" className="btn-quiet btn mt-2 !px-0 text-base" onClick={() => { setDraft(demoDraft()); setErrors({}); }}>
          Fill in the demo example
        </button>

        {errorKeys.length > 0 && (
          <div ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="error-summary-title" className="mt-6 rounded-xl border-2 border-bad bg-bad-bg p-5 outline-none">
            <h2 id="error-summary-title" className="font-sans text-lg font-bold text-bad">Please answer {errorKeys.length === 1 ? "one more question" : `${errorKeys.length} more questions`}</h2>
            <ul className="mt-2 list-disc pl-5">
              {errorKeys.map((k) => (
                <li key={k}>
                  <a className="link" href={`#${k}`} onClick={(e) => { e.preventDefault(); document.getElementById(k)?.focus(); }}>
                    {FIELD_LABELS[k]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form noValidate onSubmit={onSubmit} className="card mt-8 px-5 sm:px-8">
          <Field>
            <RadioGroup name="branch" legend="Branch of service" options={BRANCHES} value={draft.branch} onChange={set("branch")} error={errors.branch} columns={3} />
          </Field>
          <Field>
            <RadioGroup name="separationType" legend="Are you retiring or separating?" options={SEPARATION_TYPES} value={draft.separationType} onChange={set("separationType")} error={errors.separationType} />
          </Field>
          <Field>
            <label htmlFor="separationDate" className="field-label text-lg">
              Expected {draft.separationType === "separation" ? "separation" : draft.separationType === "retirement" ? "retirement" : "separation or retirement"} date
            </label>
            <p id="separationDate-hint" className="mb-2 text-base text-muted">Your best estimate is fine. You can change it later.</p>
            {errors.separationDate && <p id="separationDate-error" className="mb-2 font-semibold text-bad">{errors.separationDate}</p>}
            <input
              id="separationDate"
              type="date"
              min={minDate}
              max={maxDate}
              value={draft.separationDate ?? ""}
              onChange={(e) => set("separationDate")(e.target.value)}
              aria-describedby={`separationDate-hint${errors.separationDate ? " separationDate-error" : ""}`}
              aria-invalid={Boolean(errors.separationDate)}
              className="input max-w-xs"
            />
          </Field>
          <Field>
            <RadioGroup name="maritalStatus" legend="Marital status" options={MARITAL_STATUSES} value={draft.maritalStatus} onChange={set("maritalStatus")} error={errors.maritalStatus} />
            {draft.maritalStatus === "married" && (
              <label className="mt-3 flex items-center gap-3 text-base">
                <input type="checkbox" className="h-5 w-5 accent-navy-800" checked={draft.priorDivorce === "true"} onChange={(e) => set("priorDivorce")(String(e.target.checked))} />
                I was divorced from an earlier marriage
              </label>
            )}
          </Field>
          <Field>
            <RadioGroup name="hasDependents" legend="Do you have dependent children?" options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} value={draft.hasDependents} onChange={set("hasDependents")} error={errors.hasDependents} />
          </Field>
          <Field>
            <RadioGroup name="serviceConnected" legend="Do you have an injury or condition related to your service?" options={SERVICE_CONNECTED} value={draft.serviceConnected} onChange={set("serviceConnected")} error={errors.serviceConnected} columns={3} />
          </Field>
          <Field>
            <label htmlFor="state" className="field-label text-lg">Where will you live after service?</label>
            {errors.state && <p id="state-error" className="mb-2 font-semibold text-bad">{errors.state}</p>}
            <select
              id="state"
              value={draft.state ?? ""}
              onChange={(e) => set("state")(e.target.value)}
              aria-invalid={Boolean(errors.state)}
              aria-describedby={errors.state ? "state-error" : undefined}
              className="input max-w-sm"
            >
              <option value="">Choose a state or territory</option>
              {STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </Field>
          <div className="flex flex-col items-start gap-3 py-6 sm:flex-row sm:items-center">
            <button type="submit" className="btn btn-primary">
              {existing ? "Update my timeline" : "Build my timeline"} <IconArrowRight size={20} />
            </button>
            <p className="text-base text-muted">No account needed.</p>
          </div>
        </form>
      </main>
    </>
  );
}
