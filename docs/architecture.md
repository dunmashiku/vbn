# Architecture: demo today, AWS in production

## The demo (local)

```
Browser (React SPA, localhost:5173)
  ├─ localStorage: intake answers, milestone progress, document statuses
  ├─ IndexedDB:    attached files (never leave the browser)
  └─ POST /api/chat (Vite proxy) ──> Hono on Node (localhost:8787) ──> Anthropic API (Claude)
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

### Retrieval over official VA content
- A scheduled ingestion job (EventBridge Scheduler → Lambda or Step Functions) fetches allow-listed official pages (VA.gov, TRICARE.mil, Military OneSource, DoD TAP), chunks them, and stores embeddings in **Aurora PostgreSQL Serverless v2 with pgvector**, with source URL and retrieval date on every chunk.
- The chat Lambda retrieves the top passages and passes them to the model with their URLs, so answers cite current official sources. Stale or removed pages are flagged for content review.
- Milestone and document rules move from TypeScript files to reviewed rows in Aurora with an audit history, but keep the same shape as `milestones.ts` and `documents.ts`.

### Auth
- **Cognito** (or **WorkOS** if organizations need SSO for their advocates) issues JWTs that API Gateway validates.
- Roles: veteran (owns their data), advocate (sees only people who explicitly shared with their organization), admin. Sharing is an explicit, revocable grant.

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
