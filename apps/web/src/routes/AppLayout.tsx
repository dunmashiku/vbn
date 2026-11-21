import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { ChatPanel, ChatProvider, useChat } from "../components/Chat";
import { CrisisLine, PrototypeBanner, SkipLink, Wordmark } from "../components/Common";
import { IconTrash } from "../components/Icons";
import { PRODUCT_NAME } from "../config";
import { deleteAllFiles } from "../lib/docStore";
import { clearLocalData } from "../lib/storage";
import { FILES_QUERY_KEY } from "../lib/useNavigator";

function ClearDataButton() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { reset } = useChat();
  return (
    <button
      type="button"
      aria-label="Clear my data"
      className="btn btn-sm btn-outline"
      onClick={async () => {
        if (!window.confirm("Clear my data? This erases your answers, progress and any attached documents from this browser. It can't be undone.")) return;
        reset();
        clearLocalData();
        await deleteAllFiles();
        qc.removeQueries({ queryKey: FILES_QUERY_KEY });
        void navigate({ to: "/" });
      }}
    >
      <IconTrash size={18} />
      <span className="sm:hidden">Clear</span>
      <span className="hidden sm:inline">Clear my data</span>
    </button>
  );
}

const tabClass =
  "whitespace-nowrap rounded-md px-2.5 py-2 text-base font-semibold text-navy-900 sm:px-3 sm:text-lg hover:bg-paper-2 aria-[current=page]:bg-navy-900 aria-[current=page]:text-paper";

export function AppLayout() {
  return (
    <ChatProvider>
      <SkipLink />
      <PrototypeBanner />
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="container-page flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5">
          <Link to="/" aria-label={`${PRODUCT_NAME} home`} className="rounded-md"><Wordmark /></Link>
          <nav aria-label="Your plan" className="order-3 w-full sm:order-none sm:w-auto">
            <ul className="flex gap-1">
              <li><Link to="/timeline" className={tabClass}>My timeline</Link></li>
              <li><Link to="/documents" className={tabClass}>My documents</Link></li>
              <li><Link to="/help" className={tabClass}>Get help</Link></li>
            </ul>
          </nav>
          <ClearDataButton />
        </div>
      </header>
      <div className="container-page grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_27rem]">
        <main id="main" tabIndex={-1} className="min-w-0 outline-none pb-20 lg:pb-0">
          <Outlet />
        </main>
        <ChatPanel />
      </div>
      <footer className="border-t border-line bg-paper-2">
        <div className="container-page grid gap-4 py-8">
          <CrisisLine compact />
          <p className="text-base text-muted">
            Not affiliated with the U.S. Department of Veterans Affairs. General information only. {PRODUCT_NAME} never files or
            submits anything for you.
          </p>
        </div>
      </footer>
    </ChatProvider>
  );
}
