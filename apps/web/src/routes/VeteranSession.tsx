import { Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { PrototypeBanner, SkipLink, useDocumentTitle, Wordmark } from "../components/Common";
import { PlanView, SecurityNote, SessionControls, SessionStatus, VideoTile } from "../components/Session";
import { PRODUCT_NAME } from "../config";
import { loadShares, orgName } from "../lib/help";
import { useLiveSession } from "../lib/liveSession";
import { useStoredState } from "../lib/storage";
import { toChatContext, useNavigatorData } from "../lib/useNavigator";

export function VeteranSessionPage() {
  const { code } = useParams({ from: "/session/$code" });
  useDocumentTitle(`Live session ${code} · ${PRODUCT_NAME}`);
  useStoredState();
  const data = useNavigatorData();
  const share = loadShares().find((s) => s.code === code && !s.demo);
  const [planVisible, setPlanVisible] = useState(true);
  const plan = data && share && planVisible ? toChatContext(data) : null;
  const s = useLiveSession("veteran", code, plan);

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
      <main id="main" tabIndex={-1} className="container-page py-8 outline-none">
        {!share ? (
          <div className="card p-6">
            <h1 className="text-3xl text-navy-900">This session isn't available</h1>
            <p className="mt-2">The share may have been stopped or cleared. <Link to="/help" className="link">Share your plan again</Link>.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Live help session · {code}</p>
                <h1 className="mt-1 text-3xl text-navy-900 sm:text-4xl">{orgName(share.orgId)}</h1>
              </div>
              <SessionStatus status={s.status} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <section aria-label="Video" className="space-y-4">
                <VideoTile
                  stream={s.remoteStream}
                  label="Service officer"
                  placeholder={s.status === "ended" ? "You left the session." : "Your service officer will appear here when they join."}
                />
                <div className="grid grid-cols-[minmax(0,14rem)_1fr] items-start gap-4">
                  <VideoTile stream={s.outgoingVideo} label={s.sharingScreen ? "You (sharing screen)" : "You"} muted mirrored={!s.sharingScreen} placeholder={s.mediaError ? "No camera" : "Camera off"} />
                  <div className="space-y-2">
                    {s.mediaError && <p className="text-sm text-warn">{s.mediaError}</p>}
                    <p className="text-sm text-muted">Your microphone starts muted. On one laptop with two tabs, keep one mic muted to avoid echo.</p>
                  </div>
                </div>
                <SessionControls s={s} />
                <SecurityNote>
                  Video and audio are encrypted end to end between the two of you, and nothing is recorded. When sharing your screen,
                  share only the {PRODUCT_NAME} tab and close anything with personal records first.
                </SecurityNote>
                {s.status === "ended" && (
                  <p className="text-base"><Link to="/help" className="link">Back to Get help</Link> · <Link to="/timeline" className="link">My timeline</Link></p>
                )}
              </section>

              <section aria-labelledby="visible-heading" className="card self-start p-5">
                <h2 id="visible-heading" className="text-2xl text-navy-900">What your representative sees</h2>
                <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
                  <input type="checkbox" className="h-6 w-6 accent-navy-800" checked={planVisible} onChange={(e) => setPlanVisible(e.target.checked)} />
                  Show my plan during this session
                </label>
                <p className="mb-4 text-sm text-muted">Updates live as you check things off. Turn it off any time.</p>
                {plan ? <PlanView plan={plan} compact /> : <p className="rounded-lg bg-paper p-4 text-muted">Your plan is hidden from the representative.</p>}
              </section>
            </div>
          </>
        )}
      </main>
    </>
  );
}
