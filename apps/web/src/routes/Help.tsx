import { Link } from "@tanstack/react-router";
import { addDays } from "@vbn/shared";
import { useState } from "react";
import { useDocumentTitle } from "../components/Common";
import { IconArrowRight, IconCheck, IconExternal, IconShield, IconX } from "../components/Icons";
import { LINKS, PRODUCT_NAME } from "../config";
import { addShare, DEMO_ORGS, formatSlot, isExpired, loadShares, newCode, orgName, revokeShare, SHARE_DAYS, upcomingSlots } from "../lib/help";
import { useStoredState } from "../lib/storage";
import { formatDateLong, toChatContext, useNavigatorData } from "../lib/useNavigator";

const SHARED = [
  "Your intake answers (branch, dates, family, state)",
  "Your timeline: milestone dates and statuses",
  "Your document checklist: names and statuses",
];
const NOT_SHARED = [
  "Your attached documents and files",
  "Social Security numbers or bank details (never collected)",
  "Your chat conversation with the Navigator",
];

export function HelpPage() {
  useDocumentTitle(`Get help from a representative · ${PRODUCT_NAME}`);
  const data = useNavigatorData();
  useStoredState(); // re-render when shares change
  const [orgId, setOrgId] = useState<string>("");
  const [slot, setSlot] = useState<string>("now");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [slots] = useState(() => upcomingSlots().map((d) => d.toISOString()));

  if (!data) return null;
  const shares = loadShares().filter((s) => !s.demo);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !consent) {
      setError(!orgId ? "Choose an organization." : "Check the box to agree to share your plan summary.");
      return;
    }
    setError(null);
    const code = newCode();
    addShare({
      code,
      orgId,
      createdAt: data.today,
      expiresAt: addDays(data.today, SHARE_DAYS),
      slot: slot === "now" ? null : slot,
      plan: toChatContext(data),
    });
    setCreated(code);
    setConsent(false);
  };

  return (
    <div>
      <p className="eyebrow">Get free help</p>
      <h1 className="mt-2 text-4xl text-navy-900 sm:text-5xl">Meet a free, accredited representative</h1>
      <p className="prose-measure mt-3 text-lg text-muted">
        Share a read-only summary of your plan with a veterans service officer before you meet, so your first conversation starts
        where you are instead of from scratch. Help with VA claims is always free.
      </p>

      <div role="note" className="mt-6 rounded-xl border-2 border-gold bg-warn-bg p-4 text-warn">
        <p className="font-semibold">Demo: the organizations below are fictional.</p>
        <p className="mt-1 text-base">
          To play the service officer, open the{" "}
          <a href="/rep" target="_blank" rel="noopener" className="link font-semibold">service officer console in a new tab</a>. In
          production this list comes from the{" "}
          <a href={LINKS.accreditedRepSearch} target="_blank" rel="noopener noreferrer" className="link">VA's accredited representative search</a>.
        </p>
      </div>

      {shares.length > 0 && (
        <section aria-labelledby="shares-heading" className="mt-8">
          <h2 id="shares-heading" className="text-2xl text-navy-900">Your shared plans</h2>
          <ul className="mt-3 space-y-3">
            {shares.map((s) => (
              <li key={s.code} className={`card p-5 ${created === s.code ? "ring-2 ring-ok" : ""}`}>
                {created === s.code && (
                  <p role="status" className="mb-2 flex items-center gap-2 font-semibold text-ok"><IconCheck size={20} /> Shared. {orgName(s.orgId)} can now see your plan summary.</p>
                )}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-sans text-lg font-bold text-navy-900">{orgName(s.orgId)}</p>
                    <p className="text-base text-muted">
                      {s.slot ? `Meeting ${formatSlot(s.slot)}` : "Live session, no appointment"} · Code <span className="font-mono font-semibold text-ink">{s.code}</span>
                    </p>
                    <p className="text-sm text-muted">
                      {isExpired(s) ? "Expired" : `Access ends ${formatDateLong(s.expiresAt)}`}. Shared a snapshot from {formatDateLong(s.createdAt)}.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to="/session/$code" params={{ code: s.code }} className="btn btn-sm btn-primary">
                      Join live session <IconArrowRight size={18} />
                    </Link>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => { revokeShare(s.code); if (created === s.code) setCreated(null); }}>
                      Stop sharing
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form noValidate onSubmit={submit} className="mt-10 space-y-8" aria-labelledby="share-form-heading">
        <h2 id="share-form-heading" className="text-2xl text-navy-900">Share your plan with a representative</h2>

        <fieldset>
          <legend className="field-label text-lg">1. Choose an organization</legend>
          <div className="grid gap-3">
            {DEMO_ORGS.map((o) => (
              <label key={o.id} className={`flex cursor-pointer gap-3 rounded-xl border-2 bg-white p-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy-800 ${orgId === o.id ? "border-navy-800 bg-navy-100" : "border-line hover:border-navy-600"}`}>
                <input type="radio" name="org" value={o.id} checked={orgId === o.id} onChange={() => setOrgId(o.id)} className="mt-1 h-5 w-5 accent-navy-800" />
                <span>
                  <span className="block font-bold text-navy-900">{o.name} <span className="chip chip-not-started ml-1 align-middle">Demo</span></span>
                  <span className="block text-base text-muted">{o.kind} · {o.details}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="card p-5">
          <legend className="sr-only">2. Review what you'll share</legend>
          <p className="field-label text-lg" aria-hidden="true">2. Review what you'll share</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="font-sans text-base font-bold text-ok">Shared (read-only)</h3>
              <ul className="mt-2 space-y-1.5 text-base">
                {SHARED.map((t) => <li key={t} className="flex gap-2"><IconCheck size={18} className="mt-1 shrink-0 text-ok" />{t}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-bad">Never shared</h3>
              <ul className="mt-2 space-y-1.5 text-base">
                {NOT_SHARED.map((t) => <li key={t} className="flex gap-2"><IconX size={18} className="mt-1 shrink-0 text-bad" />{t}</li>)}
              </ul>
            </div>
          </div>
          <p className="mt-4 flex gap-2 text-base text-muted">
            <IconShield size={20} className="mt-0.5 shrink-0" />
            Access ends automatically after {SHARE_DAYS} days, and you can stop sharing at any time. Sharing doesn't appoint the
            organization or file anything; you decide that with them.
          </p>
          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
            <input type="checkbox" className="h-6 w-6 accent-navy-800" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            I agree to share this summary with the organization I chose
          </label>
        </fieldset>

        <fieldset>
          <legend className="field-label text-lg">3. When would you like to talk?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {[{ v: "now", l: "Start a live session now (demo)" }, ...slots.map((s) => ({ v: s, l: formatSlot(s) }))].map((o) => (
              <label key={o.v} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border-2 bg-white px-3 py-2 font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy-800 ${slot === o.v ? "border-navy-800 bg-navy-100" : "border-line hover:border-navy-600"}`}>
                <input type="radio" name="slot" value={o.v} checked={slot === o.v} onChange={() => setSlot(o.v)} className="h-5 w-5 accent-navy-800" />
                {o.l}
              </label>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">Video sessions happen right here in the Navigator. You can also choose phone or in person with the organization.</p>
        </fieldset>

        {error && <p role="alert" className="rounded-lg bg-bad-bg px-3 py-2 font-semibold text-bad">{error}</p>}
        <button type="submit" className="btn btn-primary">Share my plan <IconArrowRight size={20} /></button>
      </form>

      <p className="prose-measure mt-10 text-base text-muted">
        Only VA-accredited representatives may help with VA claims, and they can't charge you for an initial claim. Check anyone
        you work with on the{" "}
        <a href={LINKS.accreditedRepSearch} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
          VA's accredited representative search<IconExternal size={15} />
        </a>.
      </p>
    </div>
  );
}
