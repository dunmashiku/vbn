#!/usr/bin/env -S npx tsx
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { VaClient } from "./client";
import { ConfigError, loadDotEnv, readConfig } from "./config";
import { timed } from "./log";
import {
  findFacilitiesInput, findVaFacilities, fixtureInput, getUploadStatus, statusInput,
  uploadInput, uploadTestDocument, validateDocument, type ToolResult,
} from "./tools";

/** Builds the MCP server with all four tools. Exported for tests. */
export function createServer(client: VaClient): McpServer {
  const server = new McpServer({ name: "vbn-va-sandbox", version: "0.1.0" });
  const toMcp = (r: ToolResult) => ({ content: [{ type: "text" as const, text: r.text }], isError: r.isError ?? false });
  const wrap = <A>(name: string, fn: (a: A) => Promise<ToolResult>) => async (a: A) => toMcp(await timed(name, () => fn(a), (r) => Boolean(r.isError)));

  server.registerTool(
    "find_va_facilities",
    {
      title: "Find VA facilities",
      description:
        "Search VA facilities (health, benefits offices, Vet Centers) by state, city or ZIP code, or near a latitude/longitude. Returns name, address, phone, hours and services from the VA Facilities API sandbox. Read-only.",
      inputSchema: findFacilitiesInput,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    wrap("find_va_facilities", (a) => findVaFacilities(client, a)),
  );

  server.registerTool(
    "validate_document",
    {
      title: "Validate a sample PDF",
      description: "Check that a sample PDF from the fixtures folder meets VA file requirements, using the Benefits Intake API sandbox validation endpoint. Doesn't submit anything. Read-only.",
      inputSchema: fixtureInput,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    wrap("validate_document", (a: { fixture: string }) => validateDocument(client, a)),
  );

  server.registerTool(
    "upload_test_document",
    {
      title: "Upload a test document (sandbox only)",
      description:
        "Sandbox only. Uploads a fixture PDF to the VA Benefits Intake sandbox for a fake test veteran and returns the submission ID. Requires confirm: true. Refuses files outside the fixtures folder.",
      inputSchema: uploadInput,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    wrap("upload_test_document", (a: { fixture: string; confirm: boolean }) => uploadTestDocument(client, a)),
  );

  server.registerTool(
    "get_upload_status",
    {
      title: "Get upload status",
      description: "Get the status of a Benefits Intake sandbox submission by its submission ID. Read-only.",
      inputSchema: statusInput,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    wrap("get_upload_status", (a: { submissionId: string }) => getUploadStatus(client, a)),
  );

  return server;
}

async function main() {
  loadDotEnv();
  let config;
  try {
    config = readConfig();
  } catch (e) {
    if (e instanceof ConfigError) {
      process.stderr.write(`[va-mcp] ${e.message}\n`);
      process.exit(1);
    }
    throw e;
  }
  if (!config.facilitiesKey && !config.intakeKey) {
    process.stderr.write("[va-mcp] VA_API_KEY isn't set. Tools will explain how to add it. See services/va-mcp/README.md.\n");
  }
  const server = createServer(new VaClient(config));
  await server.connect(new StdioServerTransport());
  process.stderr.write(`[va-mcp] ready on stdio (VA sandbox: ${config.baseUrl})\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
