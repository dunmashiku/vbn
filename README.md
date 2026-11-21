# Benefits Navigator (demo prototype)

A free, personal timeline of military transition benefit deadlines, a document checklist, and an AI guide that knows the person's situation. Built by Selabrook LLC.

> Prototype for demonstration. General information only. Not affiliated with the U.S. Department of Veterans Affairs.

## Setup

Requirements: Node 22 or newer and pnpm 10.

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

Without an API key everything works except the chat, which shows a clear "no API key" message.

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
6. In **Ask the Navigator**, click **"Which documents am I still missing?"**. The answer is streamed and specific to this person.
7. Optional: click **Explain this document** on the sample DD-214 to show how AI could summarize a document in production (only fake sample text is ever sent).
8. Finish with **Clear my data** to show everything is erased from the browser.

## What's where

```
apps/web          React + Vite + TanStack Router/Query + Tailwind (landing, intake, timeline, documents, chat UI)
services/chat     Hono server: POST /api/chat -> Claude via the Anthropic SDK (streamed NDJSON)
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

## Before anything beyond a demo

- Every rule in `packages/shared/milestones.ts` and `packages/shared/documents.ts` is marked `// VERIFY against va.gov before production`.
- Stats in `apps/web/src/content/stats.ts` are marked `// VERIFY before publishing`.
- Replace the placeholder `CONTACT_EMAIL` in `apps/web/src/config.ts`.
