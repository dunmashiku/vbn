# Benefits Navigator: conventions

Demo prototype for Selabrook LLC. Optimize for clarity and a working demo, and keep code portable to AWS (API Gateway + Lambda) without rewrites. See `docs/architecture.md`.

## Layout
- pnpm workspace: `apps/web` (React, Vite, TanStack Router + Query, Tailwind v4), `services/chat` (Hono + Anthropic SDK), `packages/shared` (Zod schemas, types, rules).
- `pnpm dev` runs both apps (web on 5173, chat on 8787, `/api` proxied). `pnpm typecheck` must pass after every change.
- `packages/shared` exports TypeScript source directly (no build step).

## Rules and content
- Timeline milestones live only in `packages/shared/milestones.ts`; documents only in `packages/shared/documents.ts`. UI code never hard-codes milestone or document facts. Each rule keeps its `// VERIFY against va.gov before production` comment.
- "Which answers make this apply" is declarative (`appliesWhen`), not functions, so rules can move to a database unchanged.
- Product name, contact address and links live in `apps/web/src/config.ts`. Stats live in `apps/web/src/content/stats.ts` (`// VERIFY before publishing`).
- Prefer official sources (VA.gov, TRICARE.mil, Military OneSource, DoD TAP). Never invent URLs, deadlines or figures.
- No VA logo, DoD seals, branch emblems or stock photos of people. Visuals are built in code.

## Privacy and safety (non-negotiable)
- No database, accounts, analytics or cookies in the demo. Intake and progress in `localStorage`, files in IndexedDB; "Clear my data" erases both.
- Uploaded files never leave the browser. Only built-in SAMPLE document text may be sent to chat ("Explain this document").
- SSNs and bank details are `have-ready` reminders only: never uploaded, typed or stored. The chat input blocks SSN- and account-number-shaped text.
- The chat server never logs message contents; validate every request with the shared Zod schemas and keep the length/history caps.
- The app never files, prepares or submits anything to the VA. Point to free VA-accredited representatives.
- The Veterans Crisis Line (988 then press 1, text 838255, VeteransCrisisLine.net) stays visible in the footer and in the system prompt.

## Chat service
- `services/chat/src/app.ts` is a runtime-agnostic Hono app; `server.ts` is the Node entry. Add a Lambda entry by wrapping the same app.
- Model: `claude-opus-5-5` (override with `CHAT_MODEL`), streamed, `effort: "low"`, server-side refusal fallback enabled. The system prompt is in `systemPrompt.ts`; per-request context is a separate system block so the stable prompt can be cached.
- The API key is read from `services/chat/.env` (`ANTHROPIC_API_KEY`) and is never sent to the browser. The chat port is `CHAT_PORT` (not `PORT`).

## UI and accessibility
- Target WCAG 2.1 AA. One `h1` per page, semantic landmarks, skip link, visible focus (`--focus` token; `.on-dark` switches it to gold), labels on every control, 44px+ touch targets.
- Body text 18px, line length about 65ch (`.prose-measure`). Serif headings (Source Serif 4), sans body (Public Sans), self-hosted latin subsets via `@fontsource`.
- Colors are theme tokens in `apps/web/src/styles.css`: navy + warm off-white, one gold accent. Gold is a fill or border on light backgrounds, never body text.
- Motion only via `.reveal` / `.fade-in`, which are disabled under `prefers-reduced-motion`.
- Icons are hand-written SVG in `components/Icons.tsx`. Markdown in chat uses the small safe renderer in `components/Markdown.tsx` (no `innerHTML`).

## Dependencies
Ask before adding any dependency. Approved: React, Vite, TanStack Router/Query, Tailwind, Hono, `@hono/node-server`, Anthropic SDK, Zod, `@fontsource/*`, tsx, and the TypeScript/Vite/Tailwind tooling already in the repo.
