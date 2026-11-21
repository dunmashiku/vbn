import { CHAT_LIMITS, type ChatContext, type ChatMessage, type ChatRequest, type ChatSource, type ChatStreamEvent } from "@vbn/shared";

/** Social Security or account-number-like digit runs. We block these before sending. */
const SENSITIVE = [
  /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/, // SSN shape
  /\b\d{8,17}\b/, // routing / account numbers
];

export function looksSensitive(text: string): boolean {
  return SENSITIVE.some((re) => re.test(text));
}

/** Keeps the most recent messages within the server's limit, starting on a user turn. */
export function trimHistory(messages: ChatMessage[]): ChatMessage[] {
  let out = messages.slice(-CHAT_LIMITS.maxMessages);
  while (out.length && out[0]!.role !== "user") out = out.slice(1);
  return out;
}

export async function streamChat(
  req: ChatRequest,
  onText: (chunk: string) => void,
  signal?: AbortSignal,
  onSources?: (sources: ChatSource[]) => void,
  onTool?: (label: string) => void,
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok || !res.body) {
    let message = "The Navigator is unavailable right now. Please try again.";
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      if (res.status === 502 || res.status === 504) message = "The chat service isn't running. Start it with pnpm dev.";
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      const event = JSON.parse(line) as ChatStreamEvent;
      if (event.type === "text") onText(event.text);
      else if (event.type === "sources") onSources?.(event.sources);
      else if (event.type === "tool") onTool?.(event.label);
      else if (event.type === "error") throw new Error(event.message);
    }
  }
}

export type { ChatContext };
