import { createRootRoute, createRoute, createRouter, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { PRODUCT_NAME } from "./config";
import { loadIntake } from "./lib/storage";
import { AppLayout } from "./routes/AppLayout";
import { DocumentsPage } from "./routes/Documents";
import { LandingPage } from "./routes/Landing";
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

const routeTree = rootRoute.addChildren([
  landingRoute,
  startRoute,
  appRoute.addChildren([timelineRoute, documentsRoute]),
]);

export const router = createRouter({ routeTree, scrollRestoration: true, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
