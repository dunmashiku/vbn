# Benefits Navigator (demo prototype)

A free, personal timeline of military transition benefit deadlines, a document checklist, and an AI guide that knows the person's situation. Built by Selabrook LLC.

> Prototype for demonstration. General information only. Not affiliated with the U.S. Department of Veterans Affairs.

## Setup

Requirements: Node 22 or newer and pnpm 10.

### Quick start with make

```bash
make setup
```

Add your keys: `ANTHROPIC_API_KEY` in `services/chat/.env`, and your VA Lighthouse **sandbox** key as `VA_API_KEY` in `services/va-mcp/.env` (see [services/va-mcp/README.md](services/va-mcp/README.md)). Then:

```bash
make dev
```

Run `make` to list every target (`check-key`, `health`, `typecheck`, `test`, `eval-rag`, `build`, `preview`, `stop`, `clean`, `reset`).

### Without make

```bash
pnpm install
```

```bash
cp services/chat/.env.example services/chat/.env
```

Open `services/chat/.env` and set `ANTHROPIC_API_KEY`. The key stays on the chat server and is never sent to the browser.

```bash
pnpm dev
```

Open http://localhost:5173. `pnpm dev` starts both the web app (Vite, port 5173) and the chat service (Hono, port 8787). Vite proxies `/api` to the chat service.

Other commands:

```bash
pnpm typecheck
```

```bash
pnpm build
```

Without an Anthropic key everything works except the chat, which shows a clear "no API key" message. Without a VA key, the chat still answers but can't look up VA locations; it points people to the VA.gov locator instead.

## Demo script (about 5 minutes)

1. **Landing page.** Start at http://localhost:5173. Point out the headline, the example timeline card, the three sourced stats, "What's covered", the free accredited help section and the claim shark warning, the privacy promise, and the Veterans Crisis Line in the footer.
2. Click **Build my timeline**.
3. **Intake.** Enter the sample person (or click "Fill in the demo example"):
   - Branch: Army
   - Retiring, about 8 months from today
   - Married, one dependent (answer "Yes" to dependent children)
   - Service-connected condition: Not sure (a possible condition)
   - Moving to Maryland
4. Click **Build my timeline**. Walk through the timeline: TAP shows as overdue (retirees should start 24 months out), BDD claim window, Survivor Benefit Plan, health coverage, VGLI and Maryland benefits. Each step has a plain-language explanation, a "Learn more" link to the official source, and the documents it needs. Check one item off to show progress saving.
5. Go to **My documents**. Point out the "Demo only" warning, then click **Load sample documents**. Four fake documents (each marked SAMPLE) are attached and the progress bar moves. Preview the sample DD-214. Note that service treatment records are still not started, and the SSN and bank items are "have ready" reminders that are never collected.
6. In **Ask the Navigator**, click **"Which documents am I still missing?"**. The answer is streamed and specific to this person. Then ask **"Where's the nearest VA benefits office to Annapolis?"**: the Navigator looks up VA locations through the VA sandbox (needs the VA key), lists them with address and phone, and reminds you to call ahead. Then ask **"When should I file for disability?"**: the answer cites VA.gov, and the official pages it used are listed under **Sources** below it. Answers come from the official-source notes in `content/va/`, not the model's memory.
7. Optional: click **Explain this document** on the sample DD-214 to show how AI could summarize a document in production (only fake sample text is ever sent).
8. Finish with **Clear my data** to show everything is erased from the browser.

### Representative help flow (about 3 minutes, use Chrome)

1. As the veteran, open **Get help**. Choose **Sample County Veterans Service Office** (all organizations are fictional), review what is and isn't shared, agree, pick **Start a live session now**, and click **Share my plan**.
2. Open http://localhost:5173/rep in a **second tab** of the same browser window. This is the service officer console: the new case appears at the top (no name, just a code), with a suggested first-meeting agenda built from the plan.
3. In the console, click **Join live session**. In the veteran tab, click **Join live session** on the shared plan. Allow camera access in both tabs.
4. The two tabs connect with real video. Both mics start muted to avoid echo on one laptop. Show **Share a tab or screen**, then uncheck **Show my plan during this session** in the veteran tab and watch the officer's view change to "Hidden".
5. Click **End session**. Back on Get help, **Stop sharing** removes the case from the officer's queue.

Two tabs only connect in the same browser profile (they talk over a `BroadcastChannel`). The Claude desktop app's browser pane blocks camera access, so demo this in Chrome.

### Sign-in screens (demo only)

**Sign in** on the landing page opens `/signin`. Veterans see production-style options (VA.gov sign-in with Login.gov or ID.me, or an email link) and can always continue without an account. Service officers go through work email, an accreditation check and on to the console; **Fill in the demo officer** fills the form. Nothing is checked or stored, and no account is created.

## What's where

```
apps/web          React + Vite + TanStack Router/Query + Tailwind (landing, intake, timeline, documents, chat UI)
services/chat     Hono server: POST /api/chat -> Claude via the Anthropic SDK (streamed NDJSON)
services/va-mcp   MCP server for VA Lighthouse sandbox APIs (facilities, document intake); the chat starts it
content/va        Official-source notes the chat answers from (RAG), one topic per file
packages/shared   Zod schemas and types, plus the reviewable rule files:
                    milestones.ts  timeline milestone rules
                    documents.ts   document checklist rules
docs/architecture.md   How this maps to production on AWS
```

Product name, contact address and key links live in `apps/web/src/config.ts`. Landing page stats live in `apps/web/src/content/stats.ts`.

## Privacy in this demo

- No database, accounts, analytics or cookies.
- Intake answers and progress are in `localStorage`; attached files are in IndexedDB. "Clear my data" erases both.
- Attached files never leave the browser. Uploads accept PDF, JPG and PNG up to 10 MB, checked by file signature.
- The chat request includes the question, recent conversation, and a summary of the intake answers, timeline and checklist statuses (no names or identifiers are collected). It never includes file contents, except the text of the built-in fake samples for "Explain this document".
- The chat server validates requests with Zod, caps message length and history, rate limits by client, and does not log message contents.

## Tests and retrieval check

```bash
pnpm test
```

```bash
pnpm eval:rag
```

`pnpm test` runs the Vitest suites (timeline rules, chat validation and rate limit, content notes and retrieval). `pnpm eval:rag` asks 10 sample questions and reports whether retrieval finds the right official page for each.

## Before anything beyond a demo

- Every note in `content/va/` is marked `verify: true`. The Survivor Benefit Plan note couldn't be checked against its official page (the Defense sites block automated reads) and needs a manual review.

- Every rule in `packages/shared/milestones.ts` and `packages/shared/documents.ts` is marked `// VERIFY against va.gov before production`.
- Stats in `apps/web/src/content/stats.ts` are marked `// VERIFY before publishing`.
- Replace the placeholder `CONTACT_EMAIL` in `apps/web/src/config.ts`.
