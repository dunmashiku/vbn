import { createRootRoute, createRoute, createRouter, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { PRODUCT_NAME } from "./config";
import { loadIntake } from "./lib/storage";
import { AppLayout } from "./routes/AppLayout";
import { DocumentsPage } from "./routes/Documents";
import { HelpPage } from "./routes/Help";
import { RepConsolePage, RepSessionPage } from "./routes/Rep";
import { VeteranSessionPage } from "./routes/VeteranSession";
import { LandingPage } from "./routes/Landing";
import { OfficerSignInPage, parseMode, VeteranSignInPage } from "./routes/SignIn";
import { StartPage } from "./routes/Start";
import { TimelinePage } from "./routes/Timeline";

/** Move focus to <main> after client-side navigation so screen readers announce the new page. */
function RouteFocus() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.location.hash) return;
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}

const rootRoute = createRootRoute({
  component: () => (
    <>
      <RouteFocus />
      <Outlet />
    </>
  ),
  notFoundComponent: () => (
    <main id="main" className="container-page py-24">
      <h1 className="text-4xl text-navy-900">Page not found</h1>
      <p className="mt-4"><Link to="/" className="link">Go to the {PRODUCT_NAME} home page</Link></p>
    </main>
  ),
});

const landingRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: LandingPage });
const startRoute = createRoute({ getParentRoute: () => rootRoute, path: "/start", component: StartPage });

// Demo sign-in screens: nothing is stored and no account is created.
// Veterans sign in from the header; officers use their own link. /signin is kept as a short URL.
const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signin",
  beforeLoad: () => {
    throw redirect({ to: "/signin/veteran", search: { mode: "signin" } });
  },
});
const veteranSignInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signin/veteran",
  validateSearch: parseMode,
  component: function VeteranSignIn() {
    const { mode } = veteranSignInRoute.useSearch();
    return <VeteranSignInPage mode={mode} />;
  },
});
const officerSignInRoute = createRoute({ getParentRoute: () => rootRoute, path: "/signin/officer", component: OfficerSignInPage });

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: AppLayout,
  beforeLoad: () => {
    if (!loadIntake()) throw redirect({ to: "/start" });
  },
});
const timelineRoute = createRoute({ getParentRoute: () => appRoute, path: "/timeline", component: TimelinePage });
const documentsRoute = createRoute({ getParentRoute: () => appRoute, path: "/documents", component: DocumentsPage });
const helpRoute = createRoute({ getParentRoute: () => appRoute, path: "/help", component: HelpPage });

// Live session for the veteran: full-width, outside the app layout (no chat panel).
const veteranSessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/session/$code",
  component: VeteranSessionPage,
  beforeLoad: () => {
    if (!loadIntake()) throw redirect({ to: "/start" });
  },
});

// Service officer side (demo sign-in at /signin/officer is optional; production requires accredited staff accounts).
const repRoute = createRoute({ getParentRoute: () => rootRoute, path: "/rep", component: RepConsolePage });
const repSessionRoute = createRoute({ getParentRoute: () => rootRoute, path: "/rep/session/$code", component: RepSessionPage });

const routeTree = rootRoute.addChildren([
  landingRoute,
  startRoute,
  signInRoute,
  veteranSignInRoute,
  officerSignInRoute,
  appRoute.addChildren([timelineRoute, documentsRoute, helpRoute]),
  veteranSessionRoute,
  repRoute,
  repSessionRoute,
]);

export const router = createRouter({ routeTree, scrollRestoration: true, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
