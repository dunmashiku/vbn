import type Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";

/**
 * Tools the chat model may call, provided by an MCP server.
 * The chat only sees this interface, so production can point it at the same
 * MCP server behind Amazon Bedrock AgentCore Gateway (docs/architecture.md).
 */
export interface ToolProvider {
  tools: Anthropic.Beta.BetaTool[];
  call(name: string, input: unknown): Promise<{ text: string; isError: boolean }>;
  close(): Promise<void>;
}

/** Only read-only lookups reach the chat. Upload tools are for developer testing in the MCP Inspector. */
export const CHAT_TOOL_ALLOWLIST = new Set(["find_va_facilities"]);

const VA_MCP_DIR = fileURLToPath(new URL("../../../va-mcp/", import.meta.url));

/**
 * Starts services/va-mcp as a child process over stdio and connects to it.
 * Returns null (chat keeps working without tools) if it can't start.
 */
export async function connectVaTools(): Promise<ToolProvider | null> {
  const transport = new StdioClientTransport({
    command: `${VA_MCP_DIR}node_modules/.bin/tsx`,
    args: ["src/server.ts"],
    cwd: VA_MCP_DIR,
    // The SDK passes only a safe default environment (PATH, HOME…), not this
    // process's secrets. The VA server reads its own services/va-mcp/.env.
    stderr: "inherit",
  });
  const client = new Client({ name: "benefits-navigator-chat", version: "0.1.0" });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    const allowed = tools.filter((t) => CHAT_TOOL_ALLOWLIST.has(t.name));
    return {
      tools: allowed.map((t) => ({
        name: t.name,
        description: t.description ?? t.name,
        input_schema: t.inputSchema as Anthropic.Beta.BetaTool.InputSchema,
        // Stream tool input as it's generated; the MCP server validates it before running.
        eager_input_streaming: true,
      })),
      async call(name, input) {
        if (!CHAT_TOOL_ALLOWLIST.has(name)) return { text: `The tool ${name} isn't available in chat.`, isError: true };
        try {
          const res = await client.callTool({ name, arguments: (input ?? {}) as Record<string, unknown> }, undefined, { timeout: 20_000 });
          const content = Array.isArray(res.content) ? res.content : [];
          const text = content.map((c) => (c && typeof c === "object" && "text" in c ? String(c.text) : "")).join("\n").trim();
          return { text: text || "No result.", isError: Boolean(res.isError) };
        } catch {
          return { text: "The VA lookup service didn't respond. Point the person to https://www.va.gov/find-locations/ instead.", isError: true };
        }
      },
      close: () => client.close(),
    };
  } catch {
    console.warn("VA MCP server didn't start; chat will run without VA facility lookups. Run `pnpm --filter @vbn/va-mcp start` to see why.");
    await transport.close().catch(() => undefined);
    return null;
  }
}
