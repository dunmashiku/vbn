# Architecture: demo today, AWS in production

## The demo (local)

```
Browser (React SPA, localhost:5173)
  ├─ localStorage: intake answers, milestone progress, document statuses
  ├─ IndexedDB:    attached files (never leave the browser)
  └─ POST /api/chat (Vite proxy) ──> Hono on Node (localhost:8787) ──> Anthropic API (Claude)
                                        ├─ retrieve(): MiniSearch index over content/va/*.md
                                        └─ MCP client ──stdio──> services/va-mcp ──> VA Lighthouse sandbox
                                                                 (Facilities, Benefits Intake)
```

- `packages/shared` holds the Zod schemas, types and the rule files (`milestones.ts`, `documents.ts`). Both the web app and the chat service import it, so request validation is identical on both sides.
- `services/chat/src/app.ts` builds a runtime-agnostic Hono app. `server.ts` runs it on Node. Moving to Lambda adds a small `lambda.ts` that wraps the same app; no route code changes.
- Chat responses stream as newline-delimited JSON (`{type:"text"}`, `{type:"error"}`, `{type:"done"}`).

## Production on AWS

All infrastructure is defined in **Terraform**: one module per tier, environments as workspaces or separate state, and no console-created resources.

```
Users
  │
  ▼
CloudFront ── AWS WAF (managed rule groups, rate-based rules, geo/bot controls)
  │    ├─ /*      → S3 (private, Origin Access Control): built React app
  │    └─ /api/*  → API Gateway (HTTP API, JWT authorizer)
  │                    ├─ Lambda: chat (response streaming)   → Amazon Bedrock (Claude) + Guardrails
  │                    │                                       → Aurora PostgreSQL Serverless v2 + pgvector (retrieval)
  │                    ├─ Lambda: profile/timeline/checklist  → Aurora PostgreSQL
  │                    └─ Lambda: documents (pre-signed URLs) → S3 documents bucket (KMS)
  │
Cognito or WorkOS (sign-in, MFA, organization accounts for VSOs)
CloudTrail (+ S3 data events), CloudWatch Logs/metrics, AWS Config
```

### Web
- React build in a private S3 bucket behind CloudFront with Origin Access Control. Long cache for hashed assets, short for `index.html`.
- AWS WAF on the distribution: AWS managed common, known-bad-inputs and IP reputation rule groups, plus rate-based rules on `/api/chat`. (CloudFront-scoped WAF and its logs live in `us-east-1`; everything Regional stays in the project's Region.)
- Strict security headers via a CloudFront response headers policy (CSP, HSTS, `frame-ancestors 'none'`).

### Chat
- API Gateway HTTP API → Lambda (Node, the same Hono app via `hono/aws-lambda` with response streaming).
- Model calls move from the Anthropic API to **Amazon Bedrock** using the Anthropic Bedrock client, so data stays in the AWS account and Region. Bedrock Guardrails add a second layer for PII (SSNs, account numbers) and denied topics.
- The in-memory rate limiter is replaced by API Gateway throttling, per-user quotas, and WAF rate-based rules.
- The system prompt, validation limits and "no message contents in logs" rule carry over unchanged.

### Retrieval over official VA content (RAG)

**Demo (built).** `content/va/` holds 13 short notes written from official pages (VA.gov, TRICARE.mil, the Defense Department, the Veterans Crisis Line). Each has front matter with its title, source URL, retrieval date and `verify: true`. At startup the chat service splits them into about 50 passages (one per section, long sections split by paragraph) and builds an in-memory MiniSearch keyword index. For each question it retrieves up to 4 passages (at most 2 per page), sends them to the model in an `<official_sources>` block with their URLs, and streams the source list to the browser before the answer. The system prompt requires answers to come from those passages, cite them as links, and say "I'm not sure" when they don't cover the question. `pnpm eval:rag` checks retrieval against 10 sample questions.

**One interface.** The chat depends only on `Retriever.retrieve(query, { k })` in `services/chat/src/rag/retriever.ts`, which returns passages with `title`, `heading`, `text`, `source`, `retrieved` and `score`. `createApp` receives the retriever, so production swaps the implementation without touching chat code:
- **Amazon Bedrock Knowledge Bases**: official pages in S3 (or the web crawler data source), managed chunking and embeddings, queried with the `Retrieve` API; map each result's location and metadata to `source` and `retrieved`.
- **Aurora PostgreSQL Serverless v2 with pgvector**: our own ingestion stores chunks with Bedrock embeddings (for example Amazon Titan Text Embeddings) plus source URL and retrieval date; `retrieve()` embeds the question and runs a vector search, optionally combined with keyword search for exact form numbers.

**Production pipeline.**
- A scheduled ingestion job (EventBridge Scheduler → Lambda or Step Functions) fetches allow-listed official pages (VA.gov, TRICARE.mil, Military OneSource, DoD TAP), chunks them, and stores embeddings, with source URL and retrieval date on every chunk.
- Changed or removed pages are flagged for human content review before the new text is served. Notes marked `verify: true` stay out of production until reviewed.
- `pnpm eval:rag` grows into a regression suite that runs in CI on every content or retrieval change.
- Milestone and document rules move from TypeScript files to reviewed rows in Aurora with an audit history, but keep the same shape as `milestones.ts` and `documents.ts`.

### VA Lighthouse APIs through MCP

**Demo (built).** `services/va-mcp` is an MCP server (official TypeScript SDK) with four tools over the VA Lighthouse **sandbox**: `find_va_facilities` (Facilities API), and `validate_document`, `upload_test_document` and `get_upload_status` (Benefits Intake API). The chat service starts it as a child process over stdio and exposes only `find_va_facilities` to Claude, so a person can ask "Where's the nearest VA benefits office to Annapolis?" The document tools are for developer testing in the MCP Inspector. The server refuses to start unless its base URL is `https://sandbox-api.va.gov`, keeps to the VA's 60 requests per minute, validates every input and response with Zod, and logs only tool name, status and duration.

**Production path.**
- **Same MCP server, hosted.** Package `services/va-mcp` with a streamable HTTP transport and deploy it to **Amazon Bedrock AgentCore Runtime**. Register it as an MCP server target on **Amazon Bedrock AgentCore Gateway**, which gives agents one governed endpoint for all tools, with inbound auth (Cognito or WorkOS JWTs) and outbound auth through **AgentCore Identity**.
- **The agent.** The Navigator agent (today's chat logic, the system prompt and the `retrieve()` interface) runs on **AgentCore Runtime** with **Claude on Amazon Bedrock**, and reaches VA tools only through the Gateway. The chat code keeps using its `ToolProvider` interface; only the connection changes from stdio to the Gateway URL.
- **VA keys.** VA API keys live in **AWS Secrets Manager** (or as AgentCore Identity API-key credentials backed by it), are read only by the Gateway target or the MCP server, and are never sent to browsers, logs or the model.
- **Production VA access.** The sandbox is open, but production Lighthouse access requires the VA's review and approval of the application, including its security and privacy practices. Until then, everything stays on the sandbox host.
- **Veterans authorizing access.** For APIs that act on a veteran's own records (for example claims status or benefits documents), the veteran signs in through the **VA's OpenID Connect (OAuth 2.0) sign-in** and consents. AgentCore Identity handles the authorization code flow and stores the per-user tokens, and the Gateway passes them to the target on that veteran's behalf. The Navigator never sees VA passwords.
- **Same guardrails.** The chat allowlist (read-only lookups only), Zod validation, rate limiting and "names and statuses only" logging carry over. Any tool that writes to the VA needs an explicit confirmation step from the veteran, plus audit logging in CloudTrail and the application audit log.

### Auth
- **Cognito** (or **WorkOS** if organizations need SSO for their advocates) issues JWTs that API Gateway validates.
- Roles: veteran (owns their data), advocate (sees only people who explicitly shared with their organization), admin. Sharing is an explicit, revocable grant.
- **Veterans** sign in either with an email link (Cognito passwordless) or with their **VA.gov sign-in (Login.gov or ID.me)** through the VA's OpenID Connect service, which needs VA approval. Login.gov only works with government agencies, so a private app reaches it through the VA's sign-in rather than directly. Using the Navigator without an account stays possible.
- **Service officers** sign in with a work email link plus a second step (or their organization's SSO through WorkOS), and their VA accreditation number is checked against the VA's accredited representative list. An organization admin approves each officer.
- The demo shows these as screens only (`/signin`, `/signin/veteran`, `/signin/officer`): nothing is checked or stored, and no account is created.

### Production document uploads
1. The browser asks an authenticated Lambda for an upload slot. The Lambda checks the user and checklist item, then returns a **short-lived pre-signed S3 PUT URL** (a few minutes) scoped to one object key, content type and maximum size.
2. The browser uploads **directly** to a **private, KMS-encrypted S3 bucket** (customer-managed key, Block Public Access on, TLS-only bucket policy, versioning, object ownership enforced). File bytes never pass through Lambda or the API.
3. **GuardDuty Malware Protection for S3** scans each new object. Until the scan result tag says clean, the object is not usable: download URLs are refused and processing doesn't start. Infected files are quarantined and the user is told.
4. Optional processing after a clean scan: **Amazon Textract** extracts text, and **Bedrock** produces a plain-language summary or field check (for example, "the separation date on your DD-214 doesn't match your intake"). Extracted text is stored encrypted and linked to the same access rules.
5. **Per-user access checks** on every read: downloads use short-lived pre-signed GET URLs issued only after the Lambda confirms the requester owns the file or holds an active share.
6. **Retention and deletion**: S3 lifecycle rules expire files after a defined period of inactivity; "delete my data" removes objects (all versions), extracted text, summaries and database rows, and is logged.
7. **Every access is logged**: CloudTrail data events for the bucket, application audit records (who, what, when, why) in Aurora, and CloudWatch alarms on unusual access.

The product still never submits anything to the VA. Veterans upload to VA.gov themselves or share with their accredited representative.

### Medical records and HIPAA
Real medical records (service treatment records, private records) are health information. Before handling them in production, sign a **HIPAA Business Associate Agreement (BAA)** with AWS (through AWS Artifact) and use **HIPAA-eligible services only** for anything that stores, processes or transmits them. Confirm each service on the AWS HIPAA eligible services list at build time (S3, KMS, Lambda, API Gateway, Aurora, Textract, Bedrock, GuardDuty, CloudTrail and CloudWatch should each be checked), and keep model prompts and logs free of record contents unless the BAA covers that path.

### Representative help: shared plans and live sessions

**Why build it.** Accredited representatives already file through the VA's own systems once a veteran appoints them (VA Form 21-22 for an organization, 21-22a for an individual). They don't need another filing tool. What slows the first meeting down is reconstructing the person's situation and chasing documents. The Navigator's job is to hand them a prepared case and an easy way to talk, then step aside.

**Facts that shape the design**
- There is no "HIPAA approved" or "HIPAA certified" product. HHS doesn't certify anything. HIPAA applies to covered entities (providers, health plans, clearinghouses) and to business associates that handle protected health information for them under a Business Associate Agreement (BAA).
- Veterans service organizations and accredited representatives generally aren't covered entities, so HIPAA may not legally apply to these sessions. We should still build to HIPAA-level safeguards, because medical details come up and partners such as health systems may be covered entities.
- Video vendors that will sign a BAA include Zoom (healthcare plans), Doxy.me and Amazon Chime SDK, which is HIPAA eligible under the AWS BAA and fits this stack. Confirm each vendor's current terms before choosing.

**Demo (built).**
- *Share:* the veteran picks an organization and agrees to share a read-only summary: intake answers, milestone dates and statuses, and document names and statuses. Files, Social Security numbers, bank details and chat history are never shared. Shares end after 14 days or when the veteran clicks Stop sharing. Sharing doesn't appoint anyone or file anything.
- *Service officer console (`/rep`):* a queue identified by case code, not name, plus a suggested first-meeting agenda generated from the plan (overdue items, the BDD window, missing documents, appointing the organization).
- *Live session:* browser WebRTC between two tabs, with signaling over `BroadcastChannel`, so no server is involved. Media is always encrypted (DTLS-SRTP). The veteran's plan travels over a WebRTC data channel and updates live; the veteran can hide it at any time. Screen sharing nudges people toward sharing a single tab. Nothing is recorded.

**Production**
- Shares become server-side records in Aurora (veteran id, organization id, scope, expiry, revoked-at) checked on every read, with every view written to the audit log. The officer console requires a staff account tied to an accredited organization, through Cognito or WorkOS SSO.
- Live video moves to **Amazon Chime SDK** under the AWS BAA. A Lambda creates the meeting and issues join tokens only to the veteran and to staff of the shared organization. Recording stays off by default; if an organization enables it, recordings go to the KMS-encrypted bucket with the same retention and access rules as documents.
- Optional: a waiting room, scheduling through the organization's calendar, and SMS or email reminders through Amazon SES or AWS End User Messaging.
- The veteran always decides whether to formally appoint a representative. That happens on VA forms, outside the Navigator.

### Auditing and operations
- **CloudTrail** organization trail with log file validation, S3 data events on the documents bucket, and logs in a locked-down bucket.
- CloudWatch dashboards and alarms for error rates, latency, Bedrock throttling and spend.
- Backups: Aurora automated backups with point-in-time recovery; S3 versioning on the documents bucket.
