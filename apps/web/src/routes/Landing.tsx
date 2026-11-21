import { Link } from "@tanstack/react-router";
import { useEffect, useId, useState, type ReactNode } from "react";
import { CLIENT_NAME, CONTACT_MAILTO, LINKS, PRODUCT_NAME, COMPANY_NAME } from "../config";
import { STATS } from "../content/stats";
import { PrototypeBanner, Reveal, SectionHeading, SiteFooter, SkipLink, useDocumentTitle, Wordmark } from "../components/Common";
import {
  IconAlert, IconArrowRight, IconCalendar, IconChat, IconChevronDown, IconClipboard, IconDevice,
  IconEyeOff, IconMenu, IconTrash, IconUsers, IconX,
} from "../components/Icons";
import { TimelineMock } from "../components/TimelineMock";
import { loadIntake } from "../lib/storage";
import type { MilestoneId } from "@vbn/shared";

const NAV = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#whats-covered", label: "What's covered" },
  { href: "#privacy", label: "Privacy" },
  { href: "#free-help", label: "Get free help" },
];

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[padding,box-shadow,background-color] duration-200 ${
        scrolled ? "border-line bg-paper/95 shadow-sm backdrop-blur" : "border-transparent bg-paper"
      }`}
    >
      <div className={`container-page flex items-center justify-between gap-4 ${scrolled ? "py-2" : "py-4"}`}>
        <Link to="/" className="rounded-md" aria-label={`${PRODUCT_NAME} home`}>
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="whitespace-nowrap rounded-md px-2 py-2 font-medium text-navy-900 hover:bg-paper-2">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/signin/officer" className="hidden whitespace-nowrap rounded-md px-1 py-2 text-base font-medium text-navy-800 underline xl:inline">
            For service officers
          </Link>
          <Link to="/signin/veteran" search={{ mode: "signin" }} className={`btn btn-outline ${scrolled ? "btn-sm" : ""} hidden whitespace-nowrap md:inline-flex`}>
            Sign in
          </Link>
          <Link to="/start" className={`btn btn-primary ${scrolled ? "btn-sm" : ""} hidden whitespace-nowrap sm:inline-flex`}>
            Build my timeline
          </Link>
          <button
            type="button"
            className="btn btn-sm btn-outline xl:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <IconX size={20} /> : <IconMenu size={20} />}
            Menu
          </button>
        </div>
      </div>
      {open && (
        <nav id={menuId} aria-label="Main" className="border-t border-line bg-paper xl:hidden">
          <ul className="container-page grid gap-1 py-3">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 font-medium text-navy-900 hover:bg-paper-2">
                  {n.label}
                </a>
              </li>
            ))}
            <li className="grid gap-2 pt-2 md:hidden">
              <Link to="/start" className="btn btn-primary w-full sm:hidden">Build my timeline</Link>
              <Link to="/signin/veteran" search={{ mode: "signin" }} className="btn btn-outline w-full">Sign in</Link>
            </li>
            <li>
              <Link to="/signin/officer" className="block rounded-md px-3 py-3 font-medium text-navy-900 hover:bg-paper-2">For service officers</Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="on-dark relative overflow-hidden bg-navy-900 text-paper">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #f7f4ee 1px, transparent 0)", backgroundSize: "28px 28px" }} />
      <div className="container-page relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
        <div className="fade-in">
          <p className="eyebrow">Free for service members and veterans</p>
          <h1 id="hero-heading" className="mt-4 text-[2.5rem] leading-[1.08] sm:text-5xl lg:text-6xl">
            Your military transition, in the right order.
          </h1>
          <p className="prose-measure mt-6 text-xl leading-relaxed text-paper/90">
            Answer a few questions and get a free, personal timeline of benefit deadlines, the documents you'll need,
            and a guide you can ask anything.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/start" className="btn btn-gold">
              Build my timeline <IconArrowRight size={20} />
            </Link>
            <a href="#how-it-works" className="btn btn-outline">See how it works</a>
          </div>
          <p className="mt-4 text-base text-paper/80">Takes about a minute. No account needed.</p>
        </div>
        <div className="fade-in [animation-delay:150ms]">
          <TimelineMock />
        </div>
      </div>
    </section>
  );
}

function WhyItMatters() {
  return (
    <section aria-labelledby="why-heading" className="py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading
          id="why-heading"
          eyebrow="Why it matters"
          title="A head start makes a big difference."
          intro={<p>Many of the most valuable benefits depend on acting months before the last day in uniform. We help people see what's coming, so they can start early and with confidence.</p>}
        />
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {STATS.map((s, i) => (
            <Reveal as="li" key={s.id} delay={i * 90} className="card flex flex-col p-6">
              <p className="font-serif text-5xl font-semibold text-navy-900">{s.figure}</p>
              <p className="mt-3 flex-1 text-lg">{s.text}</p>
              <p className="mt-5 border-t border-line pt-3 text-sm text-muted">
                Source: <a className="link" href={s.source.url}>{s.source.name}<span className="sr-only">, {s.source.title}</span></a>
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: <IconClipboard size={28} />, title: "Tell us about your transition", text: "Seven quick questions. It takes about a minute." },
    { icon: <IconCalendar size={28} />, title: "Get your personal timeline", text: "What to do and by when, from your first transition class to life insurance after you leave." },
    { icon: <IconChat size={28} />, title: "Gather documents and ask questions", text: "A checklist of the documents you'll need, and a guide that knows your situation." },
  ];
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="border-y border-line bg-paper-2 py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading id="how-heading" eyebrow="How it works" title="Three steps to a plan you can act on." />
        <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 90} className="relative">
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-navy-900 font-serif text-xl font-semibold text-paper" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="text-navy-700">{s.icon}</span>
              </div>
              <h3 className="mt-5 text-2xl text-navy-900">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-2 text-muted">{s.text}</p>
            </Reveal>
          ))}
        </ol>
        <div className="mt-12">
          <Link to="/start" className="btn btn-primary">Build my timeline <IconArrowRight size={20} /></Link>
        </div>
      </div>
    </section>
  );
}

const COVERED: { id: MilestoneId; title: string; text: string }[] = [
  { id: "bdd", title: "VA disability (Benefits Delivery at Discharge)", text: "File 180 to 90 days before you leave so a decision can come soon after separation." },
  { id: "health", title: "Health coverage", text: "Compare TRICARE options for retirees and how to enroll in VA health care." },
  { id: "sbp", title: "Survivor Benefit Plan", text: "Understand the election retirees must make before their retirement date." },
  { id: "vgli", title: "Life insurance (VGLI)", text: "Keep coverage after SGLI ends by applying soon after separation." },
  { id: "education", title: "Education and GI Bill transfer", text: "Plan your education benefits and any transfer to family while you're still serving." },
  { id: "dd214-review", title: "DD-214 review", text: "Check the document every benefit depends on before errors become hard to fix." },
  { id: "state-benefits", title: "State veteran benefits", text: "Find tax relief, tuition help and other benefits offered where you'll live." },
];

function WhatsCovered() {
  const hasIntake = typeof window !== "undefined" && loadIntake() !== null;
  return (
    <section id="whats-covered" aria-labelledby="covered-heading" className="py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading
          id="covered-heading"
          eyebrow="What's covered"
          title="The milestones that matter most."
          intro={<p>Your timeline only shows what applies to you, based on your answers.</p>}
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COVERED.map((c, i) => (
            <Reveal as="li" key={c.id} delay={(i % 3) * 80} className="card group relative flex flex-col p-6 transition-shadow hover:shadow-lg">
              <span aria-hidden="true" className="mb-4 block h-1 w-10 rounded-full bg-gold" />
              <h3 className="text-xl text-navy-900">{c.title}</h3>
              <p className="mt-2 flex-1 text-muted">{c.text}</p>
              {hasIntake ? (
                <Link to="/timeline" hash={`m-${c.id}`} className="link mt-4 inline-flex items-center gap-1 after:absolute after:inset-0 after:content-['']">
                  See it on your timeline<span className="sr-only">: {c.title}</span> <IconArrowRight size={18} />
                </Link>
              ) : (
                <Link to="/start" className="link mt-4 inline-flex items-center gap-1 after:absolute after:inset-0 after:content-['']">
                  Build your timeline<span className="sr-only"> to see {c.title}</span> <IconArrowRight size={18} />
                </Link>
              )}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FreeHelp() {
  return (
    <section id="free-help" aria-labelledby="help-heading" className="on-dark bg-navy-900 py-20 text-paper sm:py-24">
      <div className="container-page grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <SectionHeading
            id="help-heading"
            dark
            eyebrow="Free, accredited help"
            title="Filing a VA claim is free. We'll never charge you, and we never file claims for you."
          />
          <div className="prose-measure mt-6 space-y-4 text-lg text-paper/90">
            <p>
              {PRODUCT_NAME} helps you understand what to do and when. When you're ready to file, it connects you to free
              VA-accredited representatives and veterans service organizations (VSOs). They're trained, accountable to the VA,
              and can file on your behalf at no cost.
            </p>
          </div>
          <a href={LINKS.accreditedRepSearch} className="btn btn-gold mt-8">
            Find a free accredited representative <IconArrowRight size={20} />
          </a>
        </div>
        <Reveal className="self-start rounded-xl border border-gold/60 bg-navy-800 p-6">
          <div className="flex items-center gap-3 text-gold-300">
            <IconAlert size={26} />
            <h3 className="font-sans text-xl font-bold text-paper">Watch out for “claim sharks”</h3>
          </div>
          <p className="mt-3 text-paper/90">
            Some companies charge veterans hefty fees, sometimes a share of future benefits, to help with an initial claim. They
            aren't accredited by the VA, and you never need to pay to file.
          </p>
          <p className="mt-3 text-base text-paper/80">
            Source: <a className="link" href={LINKS.claimSharks}>Kansas Legislative Research Department, 2026</a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Privacy() {
  const points = [
    { icon: <IconDevice size={26} />, title: "Stays on your device", text: "Your answers and documents are saved only in this browser." },
    { icon: <IconEyeOff size={26} />, title: "No account, no tracking", text: "No sign-up, no cookies and no analytics in this preview." },
    { icon: <IconTrash size={26} />, title: "Delete it anytime", text: "One button clears everything the Navigator saved." },
  ];
  return (
    <section id="privacy" aria-labelledby="privacy-heading" className="py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading
          id="privacy-heading"
          eyebrow="Your privacy"
          title="Your information stays on your device in this preview."
          intro={<p>No account, no tracking, delete it anytime.</p>}
        />
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {points.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 90} className="flex gap-4 rounded-xl border border-line bg-white p-6">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-navy-100 text-navy-800">{p.icon}</span>
              <div>
                <h3 className="font-sans text-lg font-bold text-navy-900">{p.title}</h3>
                <p className="mt-1 text-muted">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ForOrganizations() {
  return (
    <section aria-labelledby="orgs-heading" className="border-y border-line bg-paper-2 py-20 sm:py-24">
      <div className="container-page grid items-center gap-10 lg:grid-cols-[auto_1fr_auto]">
        <span className="hidden h-20 w-20 place-items-center rounded-2xl bg-navy-900 text-gold lg:grid" aria-hidden="true">
          <IconUsers size={40} />
        </span>
        <SectionHeading
          id="orgs-heading"
          eyebrow="For organizations"
          title="Help more veterans in less time."
          intro={
            <p>
              Veteran service officers, nonprofits, churches and installation transition offices: when each person arrives with a
              personal timeline and an organized document checklist, one advocate can guide many more people, and spend the
              time on what needs a human.
            </p>
          }
        />
        <div className="flex flex-col gap-3 justify-self-start">
          <a href={CONTACT_MAILTO} className="btn btn-primary">Talk with us</a>
          <Link to="/signin/officer" className="btn btn-outline">Service officer sign in</Link>
        </div>
      </div>
    </section>
  );
}

const FAQS: { q: string; a: ReactNode }[] = [
  { q: "Is it free?", a: <p>Yes. {PRODUCT_NAME} is free for service members, veterans and their families.</p> },
  {
    q: "Is this the VA?",
    a: <p>No. {PRODUCT_NAME} is not part of, or affiliated with, the U.S. Department of Veterans Affairs or the Department of Defense. It points you to official sources like VA.gov and TRICARE.mil for decisions and applications.</p>,
  },
  {
    q: "Does it file claims for me?",
    a: <p>No. It helps you understand what to do, when, and which documents to gather. You file on VA.gov yourself, or a <a className="link" href={LINKS.accreditedRepSearch}>free VA-accredited representative</a> can file with you.</p>,
  },
  {
    q: "What happens to my information?",
    a: <p>In this preview, your answers and any documents you add are stored only in your browser. Nothing is uploaded to us, and “Clear my data” erases it. When you ask the Navigator a question, your question and a summary of your answers and checklist are sent to generate a reply; documents are never sent, and messages aren't stored or logged.</p>,
  },
  { q: "Who built it?", a: <p>{PRODUCT_NAME} is being developed for {CLIENT_NAME}, a veteran-led company, by {COMPANY_NAME}, a small team building practical tools for veterans and the organizations that serve them.</p> },
];

function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const baseId = useId();
  return (
    <section aria-labelledby="faq-heading" className="py-20 sm:py-24">
      <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeading id="faq-heading" eyebrow="Questions" title="Frequently asked questions" />
        <div className="divide-y divide-line border-y border-line">
          {FAQS.map((f, i) => {
            const open = openIdx === i;
            const btnId = `${baseId}-q${i}`;
            const panelId = `${baseId}-a${i}`;
            return (
              <div key={f.q}>
                <h3 className="font-sans text-lg font-semibold">
                  <button
                    id={btnId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIdx(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left text-navy-900"
                  >
                    {f.q}
                    <IconChevronDown size={22} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                </h3>
                <div id={panelId} role="region" aria-labelledby={btnId} hidden={!open} className="prose-measure pb-5 text-muted">
                  {f.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section aria-labelledby="cta-heading" className="on-dark bg-navy-900 text-paper">
      <div className="container-page flex flex-col items-start justify-between gap-6 py-16 sm:flex-row sm:items-center">
        <div>
          <h2 id="cta-heading" className="text-3xl sm:text-4xl">Start your timeline</h2>
          <p className="mt-2 text-lg text-paper/85">About a minute. Free. No account needed.</p>
        </div>
        <Link to="/start" className="btn btn-gold">Start your timeline <IconArrowRight size={20} /></Link>
      </div>
    </section>
  );
}

export function LandingPage() {
  useDocumentTitle(`${PRODUCT_NAME}: your military transition, in the right order`);
  return (
    <>
      <SkipLink />
      <PrototypeBanner />
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <WhyItMatters />
        <HowItWorks />
        <WhatsCovered />
        <FreeHelp />
        <Privacy />
        <ForOrganizations />
        <Faq />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}
