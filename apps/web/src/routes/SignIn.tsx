/**
 * Demo sign-up and sign-in screens for veterans and service officers.
 * Screens only: nothing is checked, stored or sent, and no account is created
 * (the demo has no accounts; see CLAUDE.md). Production options are described
 * in docs/architecture.md.
 */
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { PrototypeBanner, SiteFooter, SkipLink, useDocumentTitle, Wordmark } from "../components/Common";
import { IconAlert, IconArrowRight, IconCheck, IconShield, IconUsers } from "../components/Icons";
import { LINKS, PRODUCT_NAME } from "../config";
import { DEMO_ORGS } from "../lib/help";
import { loadIntake } from "../lib/storage";

export type SignInMode = "signin" | "signup";
export const parseMode = (s: Record<string, unknown>): { mode: SignInMode } => ({ mode: s.mode === "signup" ? "signup" : "signin" });

const DEMO_OFFICER = { email: "officer@samplecounty.example", accreditation: "DEMO-48213" };
const OFFICER_ORG = DEMO_ORGS[0]!;

function Shell({ children }: { children: ReactNode }) {
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
      <main id="main" tabIndex={-1} className="container-page max-w-2xl py-10 outline-none sm:py-14">{children}</main>
      <SiteFooter showSources={false} />
    </>
  );
}

function DemoNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 flex gap-3 rounded-lg border border-line bg-paper-2 p-4 text-base">
      <IconShield size={22} className="mt-0.5 shrink-0 text-navy-800" />
      <span>{children}</span>
    </p>
  );
}

/** Text field with an accessible inline error. */
function Field({ label, hint, error, inputRef, ...input }: {
  label: string; hint?: string; error?: string; inputRef?: React.Ref<HTMLInputElement>;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      {hint && <p id={`${id}-hint`} className="-mt-1 mb-2 text-base text-muted">{hint}</p>}
      <input id={id} ref={inputRef} className={`input ${error ? "!border-bad" : ""}`} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...input} />
      {error && (
        <p id={`${id}-err`} className="mt-2 flex items-center gap-2 font-semibold text-bad">
          <IconAlert size={18} /> {error}
        </p>
      )}
    </div>
  );
}

/* ---------- /signin: choose who you are ---------- */

export function SignInChooserPage() {
  useDocumentTitle(`Sign in · ${PRODUCT_NAME}`);
  return (
    <Shell>
      <p className="eyebrow">Demo</p>
      <h1 className="mt-2 text-4xl text-navy-900 sm:text-5xl">Sign in</h1>
      <p className="prose-measure mt-4 text-lg text-muted">Choose the option that fits you.</p>
      <ul className="mt-8 grid gap-4">
        <li>
          <Link to="/signin/veteran" search={{ mode: "signin" }} className="card flex items-center gap-4 p-5 hover:border-navy-600">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-navy-900 text-gold"><IconShield size={24} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-xl font-semibold text-navy-900">I'm a service member, veteran or family member</span>
              <span className="block text-base text-muted">Save your timeline and documents checklist across devices.</span>
            </span>
            <IconArrowRight size={22} className="shrink-0 text-navy-800" />
          </Link>
        </li>
        <li>
          <Link to="/signin/officer" className="card flex items-center gap-4 p-5 hover:border-navy-600">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-navy-900 text-gold"><IconUsers size={24} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-xl font-semibold text-navy-900">I help veterans at an organization</span>
              <span className="block text-base text-muted">For VA-accredited service officers. Opens the service officer console.</span>
            </span>
            <IconArrowRight size={22} className="shrink-0 text-navy-800" />
          </Link>
        </li>
      </ul>
      <DemoNote>Demo screens: no account is created and nothing you enter is saved. You can always use {PRODUCT_NAME} without an account.</DemoNote>
    </Shell>
  );
}

/* ---------- /signin/veteran ---------- */

type VeteranStep = { kind: "choose" } | { kind: "va" } | { kind: "email" } | { kind: "email-sent"; email: string };

export function VeteranSignInPage({ mode }: { mode: SignInMode }) {
  const signup = mode === "signup";
  useDocumentTitle(`${signup ? "Create an account" : "Sign in"} · ${PRODUCT_NAME}`);
  const navigate = useNavigate();
  const [step, setStep] = useState<VeteranStep>({ kind: "choose" });
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const emailRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setStep({ kind: "choose" });
  }, [mode]);
  useEffect(() => {
    if (step.kind !== "choose") headingRef.current?.focus();
  }, [step.kind]);

  // Signed-in people land on their timeline; new people build one first.
  const finish = () => navigate({ to: loadIntake() ? "/timeline" : "/start" });

  if (step.kind === "va") {
    return (
      <Shell>
        <p className="eyebrow">Demo · step 2 of 2</p>
        <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-4xl text-navy-900 outline-none">Signing in with VA.gov</h1>
        <div className="card mt-6 p-6">
          <p className="text-lg">
            In the real product, you'd go to VA's own sign-in page, sign in with <strong>Login.gov</strong> or <strong>ID.me</strong>,
            and approve sharing with {PRODUCT_NAME}. Then you'd come back here, signed in.
          </p>
          <p className="mt-3 text-base text-muted">We would never see your password. This needs VA approval before launch.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn btn-primary" onClick={finish}>Continue (demo) <IconArrowRight size={20} /></button>
            <button type="button" className="btn btn-outline" onClick={() => setStep({ kind: "choose" })}>Back</button>
          </div>
        </div>
        <DemoNote>Nothing was sent to VA, Login.gov or ID.me, and no account was created.</DemoNote>
      </Shell>
    );
  }

  if (step.kind === "email" || step.kind === "email-sent") {
    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError("Enter an email address, like name@example.com.");
        emailRef.current?.focus();
        return;
      }
      setError(undefined);
      setStep({ kind: "email-sent", email: email.trim() });
    };
    return (
      <Shell>
        <p className="eyebrow">Demo · step 2 of 2</p>
        <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-4xl text-navy-900 outline-none">
          {step.kind === "email-sent" ? "Check your email" : signup ? "Create an account with email" : "Sign in with email"}
        </h1>
        {step.kind === "email" ? (
          <form noValidate onSubmit={submit} className="card mt-6 grid gap-5 p-6">
            <Field label="Email address" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} inputRef={emailRef}
              hint="We'll send a one-time sign-in link. No password to remember." />
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" className="btn btn-primary">Send sign-in link</button>
              <button type="button" className="btn btn-outline" onClick={() => setStep({ kind: "choose" })}>Back</button>
            </div>
          </form>
        ) : (
          <div className="card mt-6 p-6" role="status">
            <p className="text-lg">In the real product, we'd email a sign-in link to <strong>{step.email}</strong>. The link works once and expires in 15 minutes.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" className="btn btn-primary" onClick={finish}>Open the link (demo) <IconArrowRight size={20} /></button>
              <button type="button" className="btn btn-outline" onClick={() => setStep({ kind: "email" })}>Use a different email</button>
            </div>
          </div>
        )}
        <DemoNote>No email is sent and your address isn't saved.</DemoNote>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="eyebrow">Demo</p>
      <h1 className="mt-2 text-4xl text-navy-900 sm:text-5xl">{signup ? "Create your free account" : "Sign in"}</h1>
      <p className="prose-measure mt-4 text-lg text-muted">
        {signup
          ? "An account lets you pick up your timeline and checklist on any device, and share your plan with a representative."
          : "Pick up where you left off on any device."}
      </p>

      <div className="mt-8 grid gap-3">
        <button type="button" className="btn btn-primary w-full !justify-between text-left" onClick={() => setStep({ kind: "va" })}>
          <span>
            <span className="block">Continue with your VA.gov sign-in</span>
            <span className="block text-base font-normal text-paper/85">Login.gov or ID.me</span>
          </span>
          <IconArrowRight size={20} />
        </button>
        <button type="button" className="btn btn-outline w-full !justify-between" onClick={() => { setError(undefined); setStep({ kind: "email" }); }}>
          Continue with email <IconArrowRight size={20} />
        </button>
        <p className="mt-2 text-center text-base text-muted">or</p>
        <Link to={loadIntake() ? "/timeline" : "/start"} className="btn btn-quiet w-full">Continue without an account</Link>
      </div>

      <p className="mt-6 text-base">
        {signup ? (
          <>Already have an account? <Link to="/signin/veteran" search={{ mode: "signin" }} className="link">Sign in</Link></>
        ) : (
          <>New here? <Link to="/signin/veteran" search={{ mode: "signup" }} className="link">Create a free account</Link></>
        )}
      </p>

      <DemoNote>
        Demo screens: no account is created. {PRODUCT_NAME} never asks for your Social Security number, bank details or service records,
        and it's not affiliated with the VA.
      </DemoNote>
    </Shell>
  );
}

/* ---------- /signin/officer ---------- */

type OfficerStep = "email" | "accreditation" | "checking" | "verified";

export function OfficerSignInPage() {
  useDocumentTitle(`Service officer sign in · ${PRODUCT_NAME}`);
  const navigate = useNavigate();
  const [step, setStep] = useState<OfficerStep>("email");
  const [email, setEmail] = useState("");
  const [accreditation, setAccreditation] = useState("");
  const [affirm, setAffirm] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; accreditation?: string; affirm?: string }>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const accRef = useRef<HTMLInputElement>(null);
  const affirmRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    headingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (step !== "checking") return;
    const t = setTimeout(() => setStep("verified"), 1200);
    return () => clearTimeout(t);
  }, [step]);

  const fillDemo = () => {
    setEmail(DEMO_OFFICER.email);
    setAccreditation(DEMO_OFFICER.accreditation);
    setAffirm(true);
    setErrors({});
  };

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors({ email: "Enter your work email address." });
      emailRef.current?.focus();
      return;
    }
    setErrors({});
    setStep("accreditation");
  };

  const submitAccreditation = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (accreditation.trim().length < 4) next.accreditation = "Enter your VA accreditation number.";
    if (!affirm) next.affirm = "Confirm that you're accredited and will follow the veteran's sharing choices.";
    setErrors(next);
    if (next.accreditation) return accRef.current?.focus();
    if (next.affirm) return affirmRef.current?.focus();
    setStep("checking");
  };

  const stepNumber = step === "email" ? 1 : step === "accreditation" ? 2 : 3;

  return (
    <Shell>
      <p className="eyebrow">Service officers · demo · step {stepNumber} of 3</p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-4xl text-navy-900 outline-none sm:text-5xl">
        {step === "email" ? "Service officer sign in" : step === "accreditation" ? "Confirm your accreditation" : step === "checking" ? "Checking your accreditation" : "You're verified"}
      </h1>

      {step === "email" && (
        <>
          <p className="prose-measure mt-4 text-lg text-muted">
            For VA-accredited service officers at organizations that use {PRODUCT_NAME}. Veterans choose which organization sees their plan.
          </p>
          <button type="button" className="btn btn-quiet mt-2 !px-0 text-base" onClick={fillDemo}>Fill in the demo officer</button>
          <form noValidate onSubmit={submitEmail} className="card mt-4 grid gap-5 p-6">
            <Field label="Work email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} inputRef={emailRef}
              hint="Use your organization's email. We'll send a sign-in link and ask for a second step." />
            <button type="submit" className="btn btn-primary justify-self-start">Continue <IconArrowRight size={20} /></button>
          </form>
          <p className="mt-6 text-base">
            Not a service officer? <Link to="/signin/veteran" search={{ mode: "signin" }} className="link">Sign in as a veteran</Link>
          </p>
        </>
      )}

      {step === "accreditation" && (
        <>
          <p className="prose-measure mt-4 text-lg text-muted">
            Only accredited staff can see shared plans. We check your number against the VA's list of accredited representatives.
          </p>
          <form noValidate onSubmit={submitAccreditation} className="card mt-6 grid gap-5 p-6">
            <div>
              <p className="field-label">Organization</p>
              <p className="text-lg">{OFFICER_ORG.name} <span className="text-muted">(fictional, for the demo)</span></p>
              <p className="text-base text-muted">Found from your email address: {email}</p>
            </div>
            <Field label="VA accreditation number" autoComplete="off" value={accreditation} onChange={(e) => setAccreditation(e.target.value)} error={errors.accreditation} inputRef={accRef}
              hint="Shown on your accreditation record. Demo: any value works." />
            <div>
              <label className="flex gap-3 text-base">
                <input ref={affirmRef} type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-navy-800" checked={affirm} onChange={(e) => setAffirm(e.target.checked)}
                  aria-invalid={errors.affirm ? true : undefined} aria-describedby={errors.affirm ? "affirm-err" : undefined} />
                <span>I'm a VA-accredited representative. I'll use shared plans only to help that veteran, and I'll respect when they stop sharing.</span>
              </label>
              {errors.affirm && <p id="affirm-err" className="mt-2 flex items-center gap-2 font-semibold text-bad"><IconAlert size={18} /> {errors.affirm}</p>}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" className="btn btn-primary">Verify and sign in</button>
              <button type="button" className="btn btn-outline" onClick={() => setStep("email")}>Back</button>
            </div>
          </form>
          <p className="mt-4 text-base text-muted">
            Anyone can look up accredited people on the <a className="link" href={LINKS.accreditedRepSearch}>VA's accredited representative search</a>.
          </p>
        </>
      )}

      {(step === "checking" || step === "verified") && (
        <div className="card mt-6 p-6" role="status" aria-live="polite">
          {step === "checking" ? (
            <p className="text-lg">Checking the VA's accredited representative list…</p>
          ) : (
            <>
              <p className="flex items-center gap-3 text-lg font-semibold text-ok">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ok-bg"><IconCheck size={18} strokeWidth={3} /></span>
                Accreditation confirmed (demo)
              </p>
              <dl className="mt-4 grid gap-2 text-base sm:grid-cols-[auto_1fr] sm:gap-x-6">
                <dt className="text-muted">Signed in as</dt><dd>{email}</dd>
                <dt className="text-muted">Organization</dt><dd>{OFFICER_ORG.name}</dd>
                <dt className="text-muted">Access</dt><dd>Plans veterans shared with your office, while their share is active</dd>
              </dl>
              <button type="button" className="btn btn-primary mt-6" onClick={() => navigate({ to: "/rep" })}>
                Open the service officer console <IconArrowRight size={20} />
              </button>
            </>
          )}
        </div>
      )}

      <DemoNote>
        Demo screens: nothing is checked or saved, and no account is created. In production, officer accounts need a sign-in link plus a second step,
        an accreditation check, and approval from the organization's admin. Every plan view is logged.
      </DemoNote>
    </Shell>
  );
}
