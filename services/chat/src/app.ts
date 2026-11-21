import Anthropic from "@anthropic-ai/sdk";
import { ChatRequestSchema, type ChatStreamEvent } from "@vbn/shared";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { stream } from "hono/streaming";
import { rateLimit } from "./rateLimit";
import type { ToolProvider } from "./mcp/vaTools";
import type { Retriever } from "./rag/retriever";
import { SYSTEM_PROMPT, contextBlock, sourcesBlock } from "./systemPrompt";

/**
 * The Hono app is runtime-agnostic: server.ts runs it on Node for local dev,
 * and a future lambda.ts can wrap the same app with `hono/aws-lambda`.
 */
export function createApp(opts: { anthropic: Anthropic | null; model: string; retriever: Retriever; tools?: ToolProvider | null; clientKey?: (c: { req: { header: (n: string) => string | undefined } }) => string }) {
  const app = new Hono();

  // Request log without bodies: method, path, status and duration only.
  app.use("*", async (c, next) => {
    const start = Date.now();
    await next();
    console.log(`${c.req.method} ${c.req.path} ${c.res.status} ${Date.now() - start}ms`);
  });

  app.get("/api/health", (c) => c.json({ ok: true, configured: Boolean(opts.anthropic), passages: opts.retriever.size }));

  app.post(
    "/api/chat",
    rateLimit({
      windowMs: 60_000,
      max: 12,
      key: (c) => opts.clientKey?.(c) ?? c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "local",
    }),
    bodyLimit({ maxSize: 64 * 1024, onError: (c) => c.json({ error: "Request is too large." }, 413) }),
    async (c) => {
      let raw: unknown;
      try {
        raw = await c.req.json();
      } catch {
        return c.json({ error: "Request body must be JSON." }, 400);
      }
      const parsed = ChatRequestSchema.safeParse(raw);
      if (!parsed.success) {
        // Report which fields failed, never their values.
        const fields = [...new Set(parsed.error.issues.map((i) => i.path.join(".") || "(body)"))];
        return c.json({ error: "Invalid request.", fields }, 400);
      }
      if (!opts.anthropic) {
        return c.json({ error: "The chat service has no API key. Add ANTHROPIC_API_KEY to services/chat/.env and restart." }, 503);
      }

      const { messages, context, sampleDocument } = parsed.data;
      const apiMessages: Anthropic.Beta.BetaMessageParam[] = messages.map((m, idx) => {
        const isLast = idx === messages.length - 1;
        if (isLast && sampleDocument) {
          return {
            role: "user",
            content: `<sample_document title="${sampleDocument.title.replace(/"/g, "'")}">\n${sampleDocument.text}\n</sample_document>\n\n${m.content}`,
          };
        }
        return { role: m.role, content: m.content };
      });

      // Retrieve official passages for this question (see rag/retriever.ts).
      const passages = await opts.retriever.retrieve(retrievalQuery(messages, context.intake.separationType));
      const sources = [...new Map(passages.map((p) => [p.source, { title: p.title, url: p.source }])).values()];

      c.header("Content-Type", "application/x-ndjson; charset=utf-8");
      c.header("Cache-Control", "no-store");

      return stream(c, async (out) => {
        const send = (e: ChatStreamEvent) => out.write(JSON.stringify(e) + "\n");
        const tools = opts.tools?.tools.length ? opts.tools : null;
        let current: { abort: () => void } | null = null;
        out.onAbort(() => current?.abort());
        await send({ type: "sources", sources });

        try {
          // Manual tool loop: stream each turn; when the model asks for a tool,
          // run it through the MCP server and continue. Capped to keep replies fast.
          let convo: Anthropic.Beta.BetaMessageParam[] = apiMessages;
          let jsonRetries = 0;
          let usedFacilities = false;
          for (let turn = 0; turn < 4; turn++) {
            const ms = opts.anthropic!.beta.messages.stream({
              model: opts.model,
              max_tokens: 4096,
              // Chat answers are short and latency-sensitive.
              output_config: { effort: "low" },
              // Server-side fallback if the model declines for policy reasons.
              betas: ["server-side-fallback-2026-07-01"],
              fallbacks: "default",
              system: [
                { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
                { type: "text", text: contextBlock(context) },
                { type: "text", text: sourcesBlock(passages) },
              ],
              ...(tools ? { tools: tools.tools } : {}),
              messages: convo,
            });
            current = ms;
            for await (const event of ms) {
              if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                await send({ type: "text", text: event.delta.text });
              }
            }
            let final: Anthropic.Beta.BetaMessage;
            try {
              final = await ms.finalMessage();
              jsonRetries = 0;
            } catch (err) {
              // With eager input streaming, unparseable tool input rejects here: re-issue the turn once or twice.
              if (err instanceof Anthropic.APIError || jsonRetries++ >= 2) throw err;
              continue;
            }

            if (final.stop_reason === "refusal") {
              await send({
                type: "text",
                text: "\n\nI can't help with that one. For questions about your benefits, VA.gov and a free accredited representative are good places to start.",
              });
              break;
            }
            const toolUses = final.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
            if (final.stop_reason !== "tool_use" || !toolUses.length || !tools) break;

            const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
            for (const t of toolUses) {
              await send({ type: "tool", name: t.name, label: TOOL_LABELS[t.name] ?? "Looking that up" });
              const started = Date.now();
              const r = await tools.call(t.name, t.input);
              // Tool name, duration and status only.
              console.log(`tool ${t.name} ${r.isError ? "error" : "ok"} ${Date.now() - started}ms`);
              if (t.name === "find_va_facilities" && !r.isError) usedFacilities = true;
              results.push({ type: "tool_result", tool_use_id: t.id, content: r.text, is_error: r.isError });
            }
            convo = [...convo, { role: "assistant", content: final.content }, { role: "user", content: results }];
            if (usedFacilities) {
              await send({ type: "sources", sources: [...sources, { title: "VA facility locator", url: "https://www.va.gov/find-locations/" }] });
            }
          }
          await send({ type: "done" });
        } catch (err) {
          if (out.aborted) return;
          let message = "Something went wrong reaching the assistant. Please try again.";
          if (err instanceof Anthropic.AuthenticationError) message = "The chat service's API key was rejected. Check services/chat/.env.";
          else if (err instanceof Anthropic.RateLimitError) message = "The assistant is busy right now. Please try again in a minute.";
          else if (err instanceof Anthropic.APIConnectionError) message = "The chat service couldn't reach the assistant. Check the internet connection.";
          // Log the error class and status only, never message contents.
          const status = err instanceof Anthropic.APIError ? err.status : undefined;
          console.error(`chat error: ${(err as Error).constructor?.name ?? "Error"}${status ? ` status=${status}` : ""}`);
          await send({ type: "error", message });
        }
      });
    },
  );

  return app;
}

const TOOL_LABELS: Record<string, string> = {
  find_va_facilities: "Looking up VA locations",
};

/**
 * The search query: the latest question, plus the previous one when the latest
 * is a short follow-up ("how long do I have?"), plus a hint for retiring vs separating.
 */
export function retrievalQuery(messages: { role: string; content: string }[], separationType: "retirement" | "separation"): string {
  const userTurns = messages.filter((m) => m.role === "user").map((m) => m.content);
  const last = userTurns[userTurns.length - 1] ?? "";
  const prev = last.split(/\s+/).length < 7 ? (userTurns[userTurns.length - 2] ?? "") : "";
  const hint = separationType === "retirement" ? "retiring" : "separating";
  return [prev, last, hint].filter(Boolean).join(" ");
}
