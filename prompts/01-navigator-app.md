You are helping me build a demo prototype of a **Veteran Retirement Benefits Navigator** for Selabrook LLC. It runs locally on my laptop for a meeting tomorrow. Optimize for a clean, working demo built in about two hours, with code structured so it can later move to AWS (API Gateway + Lambda) without a rewrite.

### Stack

- pnpm workspace monorepo with two packages: `apps/web` and `services/chat`.
- `apps/web`: React + TypeScript + Vite, TanStack Router, TanStack Query, Tailwind CSS. Accessible components (keyboard navigation, labels, good contrast).
- `services/chat`: a small Node + TypeScript server using Hono. It exposes `POST /api/chat` and calls Claude through the official Anthropic SDK. The API key is read from `services/chat/.env` (`ANTHROPIC_API_KEY`) and is **never** sent to the browser.
- Shared types and Zod schemas in `packages/shared`.
- Vite dev server proxies `/api` to the chat service. One command (`pnpm dev`) starts both.

### Landing page (route `/`, built first)

The landing page is the first thing Edwin and future partners see, so make it polished and credible, not a template. Working product name: **Benefits Navigator** (keep it in one constant so it can change). Built by Selabrook LLC.

**Design direction**

- Calm, trustworthy and modern, like a well-run public service, not a flag-waving ad. Deep navy and warm off-white as the base, one confident accent color (muted gold or brick red), generous white space.
- Typography: a distinctive serif for headlines (Source Serif 4 or Fraunces) and a clean sans for body text (Inter or Public Sans), self-hosted with `@fontsource` packages. Body text at least 18px, line length about 65 characters.
- No stock photos of people, and **no VA logo, Department of Defense seals or branch emblems** (we are not affiliated and those marks are protected). Visuals are built in code: an SVG or HTML mock of a personal timeline card showing three sample milestones with dates and status chips.
- Subtle motion only (fade or slide in on scroll), disabled when `prefers-reduced-motion` is set.
- Fully responsive, from 360px phones to wide desktops. Accessibility target: WCAG 2.1 AA, Lighthouse accessibility score of 95 or higher, a skip link, visible focus states, semantic landmarks and one `h1`.

**Sections, in order**

1. **Header**: wordmark, links to How it works, What's covered, Privacy and Get free help, and a primary button "Build my timeline" (goes to `/start`). Sticky and compact on scroll.
2. **Hero**: headline "Your military transition, in the right order." Subhead: "Answer a few questions and get a free, personal timeline of benefit deadlines, the documents you'll need, and a guide you can ask anything." Primary button "Build my timeline", secondary "See how it works". Beside it, the timeline mock card. A small line under the buttons: "Takes about a minute. No account needed."
3. **Why it matters**: three stat cards, each with a small source link, from a typed `stats.ts` file marked `// VERIFY before publishing`:
    - "More than 200,000 service members leave the military each year" (DAV: https://www.dav.org/learn-more/news/2024/back-to-civilian-life-the-resources-transitioning-veterans-are-owed/).
    - "Nearly 1 in 4 service members required to attend the 2-day transition class didn't attend" (GAO: https://gao.gov/products/gao-24-107083).
    - "About 70% didn't start transition planning a year before separating" (GAO: https://gao.gov/products/gao-24-107083).
4. **How it works**: three numbered steps with simple line icons: "Tell us about your transition" (about a minute), "Get your personal timeline" (what to do, by when), "Gather documents and ask questions" (a checklist and a guide that knows your situation).
5. **What's covered**: a grid of cards: VA disability (Benefits Delivery at Discharge), health coverage (TRICARE and VA health care), Survivor Benefit Plan, life insurance (VGLI), education and GI Bill transfer, DD-214 review, and state veteran benefits. Each card has one sentence and links into the matching timeline item after intake.
6. **Free, accredited help**: "Filing a VA claim is free. We'll never charge you, and we never file claims for you." Explain that the Navigator connects people to free VA-accredited representatives and veterans service organizations, with a link to the VA's accredited representative search. Add a short warning about paying unaccredited "claim sharks" (source: https://klrd.gov/2026/03/02/briefing-book-2026-veterans-affairs-claim-sharks/).
7. **Your privacy**: "Your information stays on your device in this preview. No account, no tracking, delete it anytime." Three short points with icons.
8. **For organizations**: "Help more veterans in less time." A short pitch to veteran service officers, nonprofits, churches and transition offices that one advocate could guide many more people with the Navigator. A "Talk with us" button using a `mailto:` placeholder from config.
9. **FAQ** (accessible accordion): Is it free? Is this the VA? (No, and say so plainly.) Does it file claims for me? (No.) What happens to my information? Who built it?
10. **Closing call to action**: "Start your timeline" button on a navy band.
11. **Footer**: the **Veterans Crisis Line** shown prominently (dial 988 then press 1, text 838255, or chat at VeteransCrisisLine.net); the disclaimer "Not affiliated with the U.S. Department of Veterans Affairs. General information only."; a Sources list for the stats; "© 2026 Selabrook LLC".

Also set a page title and meta description, Open Graph tags, a simple SVG favicon, and keep the landing page fast (no large images, fonts subset and preloaded).

### Screens

1. **Intake** (route `/start`; single page, under one minute to complete): branch of service, separation type (retirement or separation), expected separation date, marital status, dependents (yes/no), whether they have a service-connected condition (yes/no/not sure), and state of residence after service.
2. **My Timeline**: a vertical timeline of milestones generated from the intake, each showing the target date or window, status (upcoming, due soon, overdue), a two-sentence plain-language explanation, and a "Learn more on VA.gov" link. Each milestone also lists the documents it needs and whether they are ready. Users can check items off; progress is saved only in the browser (localStorage) with a "Clear my data" button.
3. **My Documents**: a checklist of the documents this person will need, generated from the intake and grouped by milestone. Each item shows why it is needed, where to get it (official link) and a status (not started, requested, ready). Users attach a PDF or image to an item by drag-and-drop or file picker, preview it, replace it or remove it. A progress bar shows how many required documents are ready. Include a "Load sample documents" button that adds clearly labeled fake documents (for example, a sample DD-214 marked SAMPLE) for the demo.
4. **Ask the Navigator** (chat panel on the right side of the timeline, collapsible on mobile): a conversational assistant that already knows the user's intake answers, timeline and document checklist status, streams its replies, and shows suggested starter questions such as "When should I file for disability?", "What happens to my health coverage?" and "Which documents am I still missing?"

### Timeline milestones

Put milestone rules in a single typed config file (`packages/shared/milestones.ts`) so they can be reviewed and updated without touching UI code. Each milestone has an id, title, rule for its date window relative to the separation date, which intake answers make it apply, an explanation and an official source URL. Start with these, and add a visible comment `// VERIFY against va.gov before production` on each rule:

- Begin the Transition Assistance Program (about 24 months before retirement, 12 months before separation).
- File a VA disability claim through Benefits Delivery at Discharge (180 to 90 days before separation), shown only if they have or may have a service-connected condition.
- Survivor Benefit Plan election (before the retirement date), retirees only.
- Health coverage decision: TRICARE options for retirees and VA health care enrollment.
- Veterans' Group Life Insurance (VGLI): apply soon after separation.
- Review the DD-214 for accuracy (at separation).
- Education benefits and GI Bill transfer (before separation if transferring to dependents).
- State veteran benefits (after separation, based on state).

### Documents

Put document rules in a typed config file (`packages/shared/documents.ts`), like the milestones. Each document has an id, name, the milestones that need it, which intake answers make it apply, why it is needed, where to get it (official URL), and a handling type: `upload` (the user can attach a file) or `have-ready` (the app only reminds them; nothing is uploaded or typed in). Add `// VERIFY against va.gov before production` on each. Start with these:

- DD-214 (Certificate of Release or Discharge from Active Duty): needed for most benefits; available at separation. `upload`.
- Service treatment records and any private medical records: support a disability claim; shown only if they have or may have a service-connected condition. `upload`.
- Retirement or separation orders: used for health coverage and retired pay. `upload`.
- Marriage certificate: shown if married; used for dependent benefits and the Survivor Benefit Plan. `upload`.
- Birth or adoption certificates for dependents: shown if they have dependents. `upload`.
- Divorce decree from any prior marriage: shown if applicable. `upload`.
- Social Security numbers for the veteran and dependents: `have-ready` only. Never uploaded, typed or stored.
- Bank routing and account numbers for direct deposit: `have-ready` only. Never uploaded, typed or stored.

The app only organizes documents. It never submits anything to the VA. Each item explains that the veteran uploads it themselves on VA.gov or gives it to their free accredited representative.

Documents and the AI: the chat assistant receives the checklist and statuses, never file contents. Add an "Explain this document" button **only on the sample documents**: it sends the fake sample's text to the chat service to show how the AI could summarize a document in production. Real uploads never leave the browser in this demo.

### Grounded answers (RAG)

The chat must answer from official sources, not from the model's memory.

- Create `content/va/` with 10 to 15 short markdown files, one per topic: Benefits Delivery at Discharge, Survivor Benefit Plan, TRICARE options for retirees, VA health care enrollment, VGLI, DD-214, GI Bill transfer, state benefits, accredited representatives and the Veterans Crisis Line. Write each by reading the official page. Each file has front matter with a title, the source URL, the date retrieved and `verify: true`.
- At startup, the chat service splits these files into passages of a few paragraphs and builds an in-memory search index with MiniSearch (approved dependency). No embeddings API is needed for the demo.
- For each question, retrieve the top 3 to 5 passages and include them in the prompt with their source URLs. The model answers from them, cites sources as links, and says it isn't sure when the passages don't cover the question.
- In the chat UI, show the sources under each answer.
- Add a small evaluation script with 10 sample questions and the source page each should retrieve, to check retrieval quality.
- Keep retrieval behind a single `retrieve(query)` interface, so production can swap in Amazon Bedrock Knowledge Bases or Aurora PostgreSQL with pgvector and Bedrock embeddings without changing the chat code. Describe this in `docs/architecture.md`.

### Chat assistant rules (system prompt)

Write a system prompt for the chat service that tells the model to:

- Act as a friendly guide for transitioning service members and veterans, in plain language.
- Use the user's intake answers and timeline as context, which the frontend sends with each request.
- Give **general educational information only**, not legal, medical or financial advice.
- Never offer to file, prepare or submit a VA claim. For claims help, point users to free VA-accredited representatives and veterans service organizations, and link to the VA's accredited representative search.
- Prefer official sources (VA.gov, TRICARE.mil, Military OneSource) and include links when relevant.
- Say "I'm not sure" and point to an official source rather than guessing. Help users understand which documents they need and where to get them. Never ask users to type Social Security numbers, bank details or medical details into the chat; if they do, tell them not to share it.
- If someone mentions a crisis or thoughts of self-harm, immediately share the Veterans Crisis Line (dial 988 then press 1, or text 838255).

### Security and privacy for the demo

- No database, no accounts, no analytics, no cookies. Intake answers and uploaded documents live only in browser storage (documents in IndexedDB), are never sent to the chat server, and are erased by "Clear my data". Uploads accept only PDF, JPG and PNG, up to 10 MB each, checked by file signature rather than just extension. The documents screen shows: "Demo only: use the sample documents. Don't upload real personal records."
- The chat server does not log message contents. Validate request bodies with Zod and cap message length and history size.
- Basic rate limit on `/api/chat`.
- Add a visible banner: "Prototype for demonstration. General information only. Not affiliated with the U.S. Department of Veterans Affairs."
- Include a `.gitignore` that excludes `.env`.

### Deliverables

- Working app at `http://localhost:5173` via `pnpm dev`.
- A `README.md` with setup steps and a short demo script (start on the landing page and click "Build my timeline"; sample intake: Army, retiring in 8 months, married, one dependent, possible service-connected condition, moving to Maryland), then loading the sample documents and asking the Navigator which documents are still missing.
- A `docs/architecture.md` describing how this maps to production on AWS: React on S3 + CloudFront with WAF, API Gateway + Lambda for chat, Amazon Bedrock for the model, Aurora PostgreSQL Serverless with pgvector for retrieval over official VA content, Cognito or WorkOS for auth, Terraform for all infrastructure, and CloudTrail for auditing. Include a section on production document uploads: the browser uploads directly to a private, KMS-encrypted S3 bucket using short-lived pre-signed URLs issued by an authenticated Lambda; GuardDuty Malware Protection for S3 scans each file before it is usable; optional text extraction with Amazon Textract and summaries through Bedrock; per-user access checks; retention and deletion rules; and every access logged. Note that real medical records require a HIPAA Business Associate Agreement with AWS and HIPAA-eligible services only.
- A `CLAUDE.md` capturing these conventions for future work.

Work in small steps: scaffold, landing page, intake, timeline, documents, chat service, RAG, chat UI, polish. Run type checks and fix errors after each step. Ask me before adding any dependency not listed above (the `@fontsource` font packages are approved).
