Add a new package `services/va-mcp` to this pnpm monorepo: an MCP server in TypeScript using the official `@modelcontextprotocol/sdk`, wrapping VA Lighthouse **sandbox** APIs. Then let the chat service in `services/chat` use it as a tool provider. Read `CLAUDE.md` and `docs/architecture.md` first, and keep the existing RAG retrieval working: the MCP tools are added alongside it.

### Configuration

- Read `VA_API_KEY` and `VA_API_BASE_URL` from `services/va-mcp/.env`. Default the base URL to the VA sandbox host. Refuse to start if the base URL is not a sandbox URL, and log a clear error.
- Never send the VA key to the browser or include it in tool results or logs. Add `.env` to `.gitignore` and provide `.env.example`.

### Tools (start with these)

1. `find_va_facilities`: search VA facilities by state, city or ZIP and type (health, benefits, vet center), using the Facilities API. Return name, address, phone, hours and services. Read-only.
2. `validate_document`: check that a PDF meets VA file requirements using the Benefits Intake API validation endpoint. Accepts a sample PDF from `fixtures/` only. Read-only.
3. `upload_test_document`: sandbox only. Request an upload location, send a fixture PDF with JSON metadata for a **fake test veteran**, and return the submission ID. Must require an explicit `confirm: true` argument and refuse anything outside `fixtures/`.
4. `get_upload_status`: return the status of a submission ID from the Benefits Intake API.

Before writing each tool, read the current VA developer docs (developer.va.gov) for the exact endpoints, headers and payloads, and put the doc URL in a comment above each call. If anything in this prompt conflicts with the docs, follow the docs and tell me.

### Quality and safety

- Validate every tool input and every API response with Zod. Return clear, plain-language errors.
- Respect the VA rate limit (60 requests per minute) with a simple client-side limiter and retry with backoff on 429.
- Log tool name, duration and status only, never document contents or personal data.
- Include `fixtures/sample-dd214-SAMPLE.pdf`, generated in code and clearly marked SAMPLE and FAKE.
- Unit tests with mocked HTTP for every tool, plus one optional live sandbox test behind an environment flag.

### Wiring into the chat

- Run the MCP server over stdio for local development, started by `pnpm dev`.
- In `services/chat`, connect as an MCP client and expose `find_va_facilities` to Claude, so a user can ask "Where's the nearest VA benefits office to Annapolis?" Keep the upload tools out of the chat for now; they are for my own testing with the MCP Inspector.
- Update the chat system prompt: when listing facilities, cite VA.gov and remind users to call ahead.

### Deliverables

- `services/va-mcp` with the four tools, tests and a README showing how to get a sandbox key, run the server, and test it with the MCP Inspector (`npx @modelcontextprotocol/inspector`).
- An update to `docs/architecture.md` describing the production path: the same MCP server deployed behind **Amazon Bedrock AgentCore Gateway**, the agent running on **AgentCore Runtime** with Claude on Bedrock, VA keys in AWS Secrets Manager, production VA access only after VA review and approval, and veterans authorizing access through the VA's OpenID Connect sign-in.
- Update `CLAUDE.md` with these conventions.

Work in small steps: config and client, facilities tool, validation tool, upload and status tools, tests, chat wiring, docs. Run type checks and tests after each step. Ask before adding dependencies beyond the MCP SDK, Zod and a test library.
