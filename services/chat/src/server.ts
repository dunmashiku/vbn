import Anthropic from "@anthropic-ai/sdk";
import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { createRetriever } from "./rag/retriever";

// Load services/chat/.env if present (Node's built-in loader; no dotenv needed).
try {
  process.loadEnvFile(new URL("../.env", import.meta.url).pathname);
} catch {
  // No .env file: rely on the real environment.
}

// CHAT_PORT, not PORT: some dev launchers set PORT for the web server.
const port = Number(process.env.CHAT_PORT ?? 8787);
const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
const model = process.env.CHAT_MODEL ?? "claude-opus-5-5";

if (!apiKey) {
  console.warn("ANTHROPIC_API_KEY is not set. /api/chat will return 503 until you add it to services/chat/.env.");
}

const retriever = await createRetriever();
console.log(`Indexed ${retriever.size} passages from official-source notes in content/va.`);

const app = createApp({
  anthropic: apiKey ? new Anthropic({ apiKey }) : null,
  model,
  retriever,
});

serve({ fetch: app.fetch, port, hostname: "127.0.0.1" }, (info) => {
  console.log(`Chat service listening on http://127.0.0.1:${info.port} (model ${model})`);
});
