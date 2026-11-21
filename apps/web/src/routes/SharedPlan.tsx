import { Link, useParams } from "@tanstack/react-router";
import { PrototypeBanner, SkipLink, useDocumentTitle, Wordmark } from "../components/Common";
import { PlanView, SecurityNote } from "../components/Session";
import { PRODUCT_NAME } from "../config";
import { formatSlot, loadShares, meetingOf, orgName, type MeetingType } from "../lib/help";
import { useStoredState } from "../lib/storage";
import { toChatContext, useNavigatorData } from "../lib/useNavigator";

/**
 * The veteran's view of what they shared, for any meeting type: shown across the desk
 * in person, kept open during a phone call, or reviewed before a video session.
 * No connection to the officer's device; the officer opens the same plan with the code.
 */
const INTRO: Record<MeetingType, { eyebrow: string; text: string }> = {
  "in-person": {
    eyebrow: "In-person meeting",
    text: "Turn your screen toward your service officer, or tell them your code so they can open the same plan on their computer.",
  },
  phone: {
    eyebrow: "Phone call",
    text: "Tell your service officer this code. They'll open the same plan, so you can both follow along while you talk.",
  },
  video: {
    eyebrow: "Video meeting",
    text: "This is what your service officer sees. Tell them your code, and join the video session from Get help when it's time.",
  },
};
export function SharedPlanPage() {
  const { code } = useParams({ from: "/plan/$code" });
  useDocumentTitle(`My shared plan · ${PRODUCT_NAME}`);
  useStoredState();
  const data = useNavigatorData();
  const share = loadShares().find((s) => s.code === code && !s.demo);
  const intro = share ? INTRO[meetingOf(share)] : null;

  return (
    <>
      <SkipLink />
      <PrototypeBanner />
      <header className="border-b border-line bg-paper">
        <div className="container-page flex items-center justify-between gap-4 py-3">
          <Link to="/" aria-label={`${PRODUCT_NAME} home`} className="rounded-md"><Wordmark /></Link>
          <Link to="/help" className="link text-base">Back to Get help</Link>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="container-page max-w-4xl py-8 outline-none">
        {!share || !data ? (
          <div className="card p-6">
            <h1 className="text-3xl text-navy-900">This plan isn't shared</h1>
            <p className="mt-2">The share may have been stopped or cleared. <Link to="/help" className="link">Share your plan again</Link>.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">{intro!.eyebrow}{share.slot ? ` · ${formatSlot(share.slot)}` : ""}</p>
                <h1 className="mt-1 text-4xl text-navy-900 sm:text-5xl">My plan to review together</h1>
                <p className="mt-2 text-lg text-muted">With {orgName(share.orgId)}</p>
              </div>
              <div className="rounded-xl border-2 border-navy-800 bg-white px-5 py-3 text-center">
                <p className="text-sm font-semibold text-muted">Code for your service officer</p>
                <p className="font-mono text-3xl font-bold tracking-wider text-navy-900">{share.code}</p>
              </div>
            </div>
            <p className="prose-measure mt-4 text-lg">{intro!.text}</p>
            <div className="card mt-6 p-5 sm:p-6">
              <PlanView plan={toChatContext(data)} />
            </div>
            <div className="mt-6">
              <SecurityNote>
                This screen shows only your plan summary. Give Social Security numbers, bank details and medical records to your service
                officer through their office's own secure process, not on this screen.
              </SecurityNote>
            </div>
          </>
        )}
      </main>
    </>
  );
}
