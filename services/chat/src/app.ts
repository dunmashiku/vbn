import Anthropic from "@anthropic-ai/sdk";
import { ChatRequestSchema, type ChatStreamEvent } from "@vbn/shared";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { stream } from "hono/streaming";
import { rateLimit } from "./rateLimit";
import { SYSTEM_PROMPT, contextBlock } from "./systemPrompt";

/**
 * The Hono app is runtime-agnostic: server.ts runs it on Node for local dev,
 * and a future lambda.ts can wrap the same app with `hono/aws-lambda`.
 */
export function createApp(opts: { anthropic: Anthropic | null; model: string; clientKey?: (c: { req: { header: (n: string) => string | undefined } }) => string }) {
  const app = new Hono();

  // Request log without bodies: method, path, status and duration only.
  app.use("*", async (c, next) => {
    const start = Date.now();
    await next();
    console.log(`${c.req.method} ${c.req.path} ${c.res.status} ${Date.now() - start}ms`);
  });

  app.get("/api/health", (c) => c.json({ ok: true, configured: Boolean(opts.anthropic) }));

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

      c.header("Content-Type", "application/x-ndjson; charset=utf-8");
      c.header("Cache-Control", "no-store");

      return stream(c, async (out) => {
        const send = (e: ChatStreamEvent) => out.write(JSON.stringify(e) + "\n");
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
          ],
          messages: apiMessages,
        });
        out.onAbort(() => ms.abort());

        try {
          for await (const event of ms) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              await send({ type: "text", text: event.delta.text });
            }
          }
          const final = await ms.finalMessage();
          if (final.stop_reason === "refusal") {
            await send({
              type: "text",
              text: "\n\nI can't help with that one. For questions about your benefits, VA.gov and a free accredited representative are good places to start.",
            });
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
