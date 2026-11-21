# Benefits Navigator: conventions

Demo prototype for Selabrook LLC. Optimize for clarity and a working demo, and keep code portable to AWS (API Gateway + Lambda) without rewrites. See `docs/architecture.md`.

## Layout
- pnpm workspace: `apps/web` (React, Vite, TanStack Router + Query, Tailwind v4), `services/chat` (Hono + Anthropic SDK), `services/va-mcp` (MCP server for VA sandbox APIs), `packages/shared` (Zod schemas, types, rules).
- `pnpm dev` runs both apps (web on 5173, chat on 8787, `/api` proxied). `pnpm typecheck` and `pnpm test` (Vitest) must pass after every change.
- `packages/shared` exports TypeScript source directly (no build step).

## Rules and content
- Timeline milestones live only in `packages/shared/milestones.ts`; documents only in `packages/shared/documents.ts`. UI code never hard-codes milestone or document facts. Each rule keeps its `// VERIFY against va.gov before production` comment.
- "Which answers make this apply" is declarative (`appliesWhen`), not functions, so rules can move to a database unchanged.
- Product name, company and client names (`CREDIT_LINE`: "Prepared for Freeman IBC · Built by Selabrook LLC"), contact address and links live in `apps/web/src/config.ts`. Stats live in `apps/web/src/content/stats.ts` (`// VERIFY before publishing`).
- Tone: we want to partner with government agencies and service organizations. State the opportunity and how we help; never blame service members, veterans, agencies or programs, and don't imply we know why a gap exists.
- Prefer official sources (VA.gov, TRICARE.mil, Military OneSource, DoD TAP). Never invent URLs, deadlines or figures.
- No VA logo, DoD seals, branch emblems or stock photos of people. Visuals are built in code.

## Privacy and safety (non-negotiable)
- No database, accounts, analytics or cookies in the demo. Intake and progress in `localStorage`, files in IndexedDB; "Clear my data" erases both.
- Sign-in and sign-up (`routes/SignIn.tsx`) are demo screens only: they never store or send what's typed and never gate a page. Keep "Continue without an account".
- Uploaded files never leave the browser. Only built-in SAMPLE document text may be sent to chat ("Explain this document").
- SSNs and bank details are `have-ready` reminders only: never uploaded, typed or stored. The chat input blocks SSN- and account-number-shaped text.
- The chat server never logs message contents; validate every request with the shared Zod schemas and keep the length/history caps.
- The app never files, fills in or submits anything to the VA. Point to free VA-accredited representatives.
- Form prep guides (`/forms/$formId`, e.g. `/forms/21-526ez`; forms, questions and item positions in `packages/shared/formPrep.ts`, registered in `PREP_FORMS`; page images in `apps/web/public/forms/<id>/`, rendered from the official PDF with the VA seal covered). The preview highlights where a question goes on the real page and never draws answers on it. Answers save on every change. For the 21-526EZ guide: the veteran answers the form's questions in their own words; answers stay in `localStorage` (cleared by "Clear my data"), never go to chat or shares (chat gets only a count), and SSN/DOB/VA file number/bank stay have-ready reminders. It prints a prep sheet to copy into VA.gov or review with an accredited representative. The chat may explain a question but never writes answers or decides what to claim. Needs attorney/VSO review before production (38 U.S.C. 5901).
- The Veterans Crisis Line (988 then press 1, text 838255, VeteransCrisisLine.net) stays visible in the footer and in the system prompt.

## Representative help (`/help`, `/plan/$code`, `/session/$code`, `/rep`, `/rep/session/$code`)
- A share is a read-only snapshot of the same summary the chat gets (`toChatContext`): never files, names, SSNs or bank details. It expires after `SHARE_DAYS` and can be revoked. It never appoints a representative or files anything.
- Demo organizations and demo cases are fictional and labeled as such; never use real organization names or branding.
- Each share has a meeting type: in person (the veteran shows `/plan/$code`, no video), video (live session) or phone. The officer opens a case with the veteran's code, and the console shows only plans shared with the selected organization.
- Live sessions use `lib/liveSession.ts`: WebRTC with `BroadcastChannel` signaling, so both tabs must be in the same browser profile. The veteran makes the offer and owns the `plan` data channel. Mics start muted. Production swaps the transport for Amazon Chime SDK; keep the hook's interface stable.

## Grounded answers (RAG)
- Official-source notes live in `content/va/*.md`, one topic per file, with front matter `title`, `source` (official URL), `retrieved` (YYYY-MM-DD) and `verify: true`. Write them by reading the official page, in your own words; keep numbers, form numbers and URLs exact. If a page can't be read, say so in a `note:` field.
- The chat depends only on `Retriever.retrieve(query, { k })` (`services/chat/src/rag/retriever.ts`), injected into `createApp`. Swap the implementation for Bedrock Knowledge Bases or pgvector; don't call MiniSearch from chat code.
- Retrieved passages go in the `<official_sources>` system block; the browser gets a `sources` event before the text. Answers must cite those URLs and say "I'm not sure" when passages don't cover the question.
- After changing content or retrieval, run `pnpm eval:rag` (10 questions, must stay at or above 80%) and `pnpm test`.

## VA MCP server (`services/va-mcp`)
- Sandbox only: `VA_API_BASE_URL` must be `https://sandbox-api.va.gov` or the server refuses to start. Keys live in `services/va-mcp/.env` (`VA_API_KEY`, or per-API overrides) and are never logged, returned in tool results or sent to the browser.
- Before changing a tool, read the VA OpenAPI spec (`https://api.va.gov/internal/docs/facilities/v1/openapi.json`, `https://api.va.gov/internal/docs/benefits-intake/v1/openapi.json`) and keep the doc URL comment above each call. If the docs and a request disagree, follow the docs and say so.
- Validate every tool input and every VA response with Zod; return plain-language errors. Keep to 60 requests per minute and retry 429/5xx with backoff.
- Log to stderr only (stdout is the MCP protocol): tool name, status and duration. Never document contents or personal data.
- Upload tools read only PDFs inside `fixtures/`, use the fake test veteran, and require `confirm: true`. They never reach the chat: the chat allowlist (`CHAT_TOOL_ALLOWLIST` in `services/chat/src/mcp/vaTools.ts`) has `find_va_facilities` only.
- Every tool has mocked-HTTP tests; the live sandbox test runs only with `VA_LIVE_TEST=1` (and uploads only with `VA_LIVE_UPLOAD=1`).

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
Ask before adding any dependency. Approved: React, Vite, TanStack Router/Query, Tailwind, Hono, `@hono/node-server`, Anthropic SDK, `@modelcontextprotocol/sdk`, Zod, MiniSearch, Vitest, `@fontsource/*`, tsx, and the TypeScript/Vite/Tailwind tooling already in the repo.
