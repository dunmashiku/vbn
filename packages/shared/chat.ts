import { z } from "zod";
import { IntakeSchema } from "./intake";

export const CHAT_LIMITS = {
  maxMessageChars: 2000,
  maxMessages: 20,
  maxSampleDocChars: 6000,
} as const;

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(CHAT_LIMITS.maxMessageChars),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * What the browser sends as context with every chat request.
 * Deliberately a summary: intake answers, milestone names/dates/statuses and
 * document names/statuses. Never file contents, names or identifiers.
 */
export const ChatContextSchema = z.object({
  intake: IntakeSchema,
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeline: z
    .array(
      z.object({
        id: z.string().max(40),
        title: z.string().max(200),
        opens: z.string().max(10),
        due: z.string().max(10),
        status: z.enum(["upcoming", "due-soon", "overdue", "done"]),
      }),
    )
    .max(20),
  documents: z
    .array(
      z.object({
        id: z.string().max(40),
        name: z.string().max(200),
        handling: z.enum(["upload", "have-ready"]),
        status: z.enum(["not-started", "requested", "ready"]),
      }),
    )
    .max(20),
  /** Progress on the 21-526EZ prep guide: counts only, never the answers. */
  formPrep: z.object({ answered: z.number().int().min(0).max(100), total: z.number().int().min(0).max(100) }).optional(),
});
export type ChatContext = z.infer<typeof ChatContextSchema>;

export const ChatRequestSchema = z.object({
  messages: z
    .array(ChatMessageSchema)
    .min(1)
    .max(CHAT_LIMITS.maxMessages)
    .refine((m) => m[m.length - 1]?.role === "user", "The last message must be from the user"),
  context: ChatContextSchema,
  /** Only ever the text of a built-in SAMPLE document, for the "Explain this document" demo. */
  sampleDocument: z
    .object({
      title: z.string().max(120),
      text: z.string().max(CHAT_LIMITS.maxSampleDocChars),
    })
    .optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/** The response body is newline-delimited JSON, one event per line. */
export interface ChatSource {
  title: string;
  url: string;
}

export type ChatStreamEvent =
  /** Sent first: the official pages retrieved for this question. */
  | { type: "sources"; sources: ChatSource[] }
  | { type: "text"; text: string }
  /** The model is calling a tool, e.g. looking up VA locations. */
  | { type: "tool"; name: string; label: string }
  | { type: "error"; message: string }
  | { type: "done" };
