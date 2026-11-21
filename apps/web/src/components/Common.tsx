import { useEffect, useRef, useState, type ReactNode } from "react";
import { COMPANY_NAME, COPYRIGHT_YEAR, CREDIT_LINE, DEMO_NOTICE, LINKS, PRODUCT_NAME } from "../config";
import { STAT_SOURCES } from "../content/stats";
import { IconPhone, Mark } from "./Icons";

export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only-focusable fixed left-3 top-3 z-[100] rounded-md bg-navy-900 px-4 py-3 font-semibold text-paper on-dark"
    >
      Skip to main content
    </a>
  );
}

export function PrototypeBanner() {
  return (
    <div className="bg-navy-950 text-paper on-dark" role="note" aria-label="Prototype notice">
      <p className="container-page py-2 text-center text-sm leading-snug">{DEMO_NOTICE}</p>
    </div>
  );
}

export function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark size={34} />
      <span className={`font-serif text-xl leading-tight sm:whitespace-nowrap font-semibold tracking-tight ${dark ? "text-paper" : "text-navy-900"}`}>
        {PRODUCT_NAME}
      </span>
    </span>
  );
}

export function CrisisLine({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-labelledby="crisis-heading"
      className={`rounded-xl border-2 border-gold bg-navy-900 text-paper on-dark ${compact ? "p-4" : "p-5 sm:p-6"}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-full bg-gold p-2 text-navy-950">
          <IconPhone size={22} />
        </span>
        <div>
          <h2 id="crisis-heading" className="font-sans text-lg font-bold">
            Veterans Crisis Line: free, confidential, 24/7
          </h2>
          <p className="mt-1 text-paper/90">
            <a className="link font-semibold" href="tel:988">Dial 988 then press 1</a>
            <span aria-hidden="true"> · </span>
            <a className="link font-semibold" href="sms:838255">text 838255</a>
            <span aria-hidden="true"> · </span>
            or <a className="link font-semibold" href={LINKS.crisisLineChat}>chat at VeteransCrisisLine.net</a>
          </p>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter({ showSources = true }: { showSources?: boolean }) {
  return (
    <footer className="border-t border-line bg-paper-2" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Site footer</h2>
      <div className="container-page grid gap-10 py-12">
        <CrisisLine />
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
          <div className="prose-measure">
            <Wordmark />
            <p className="mt-4 text-muted">
              Not affiliated with the U.S. Department of Veterans Affairs. General information only.
            </p>
            <p className="mt-2 text-muted">
              {PRODUCT_NAME} never files claims and never charges veterans. For claims help, use a{" "}
              <a className="link" href={LINKS.accreditedRepSearch}>free VA-accredited representative</a>.
            </p>
          </div>
          {showSources && (
            <div>
              <h3 className="font-sans text-base font-bold">Sources</h3>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-base text-muted">
                {STAT_SOURCES.map((src) => (
                  <li key={src.url}>
                    {src.name}, <a className="link" href={src.url}>{src.title}</a>
                  </li>
                ))}
                <li>
                  Kansas Legislative Research Department,{" "}
                  <a className="link" href={LINKS.claimSharks}>Briefing Book 2026: Veterans Affairs claim sharks</a>
                </li>
              </ol>
            </div>
          )}
        </div>
        <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-6 text-base text-muted">
          <span>{CREDIT_LINE}</span>
          <span>© {COPYRIGHT_YEAR} {COMPANY_NAME}</span>
        </p>
      </div>
    </footer>
  );
}

/** Fades content in when it scrolls into view. No-op under prefers-reduced-motion (handled in CSS). */
export function Reveal({ children, className = "", delay = 0, as: Tag = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "li" }) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as never}
      className={`reveal ${className}`}
      data-visible={visible}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

export function SectionHeading({ id, eyebrow, title, intro, dark = false }: { id: string; eyebrow?: string; title: string; intro?: ReactNode; dark?: boolean }) {
  return (
    <div className="prose-measure">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id} className={`mt-2 text-3xl sm:text-4xl ${dark ? "text-paper" : "text-navy-900"}`}>
        {title}
      </h2>
      {intro && <div className={`mt-4 text-lg ${dark ? "text-paper/85" : "text-muted"}`}>{intro}</div>}
    </div>
  );
}
