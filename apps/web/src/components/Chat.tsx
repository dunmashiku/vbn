import { useMutation } from "@tanstack/react-query";
import { CHAT_LIMITS, type ChatMessage, type ChatSource } from "@vbn/shared";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { looksSensitive, streamChat, trimHistory } from "../lib/chatClient";
import { toChatContext, useNavigatorData } from "../lib/useNavigator";
import { IconAlert, IconChat, IconExternal, IconSend, IconSparkle, IconX } from "./Icons";
import { Markdown } from "./Markdown";

const STARTERS = [
  "When should I file for disability?",
  "What happens to my health coverage?",
  "Which documents am I still missing?",
];

interface UiMessage extends ChatMessage {
  id: number;
  /** Shown instead of content in the transcript (e.g. "Explain: SAMPLE DD-214"). */
  display?: string;
  /** Official pages retrieved for this answer (assistant messages only). */
  sources?: ChatSource[];
}

interface ChatApi {
  messages: UiMessage[];
  pending: boolean;
  error: string | null;
  open: boolean;
  setOpen: (o: boolean) => void;
  ask: (text: string, opts?: { sampleDocument?: { title: string; text: string }; display?: string }) => void;
  reset: () => void;
}

const ChatCtx = createContext<ChatApi | null>(null);

export function useChat(): ChatApi {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}

let nextId = 1;

export function ChatProvider({ children }: { children: ReactNode }) {
  const data = useNavigatorData();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: async (vars: { history: UiMessage[]; sampleDocument?: { title: string; text: string }; replyId: number }) => {
      if (!data) throw new Error("Build your timeline first.");
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      await streamChat(
        {
          messages: trimHistory(vars.history.map(({ role, content }) => ({ role, content }))),
          context: toChatContext(data),
          sampleDocument: vars.sampleDocument,
        },
        (chunk) =>
          setMessages((prev) => prev.map((m) => (m.id === vars.replyId ? { ...m, content: m.content + chunk } : m))),
        ac.signal,
        (sources) => setMessages((prev) => prev.map((m) => (m.id === vars.replyId ? { ...m, sources } : m))),
      );
    },
    onError: (err, vars) => {
      if ((err as Error).name === "AbortError") return;
      setError((err as Error).message);
      setMessages((prev) => prev.filter((m) => !(m.id === vars.replyId && !m.content)));
    },
  });

  const ask = useCallback<ChatApi["ask"]>(
    (text, opts) => {
      const content = text.trim().slice(0, CHAT_LIMITS.maxMessageChars);
      if (!content || mutation.isPending) return;
      setError(null);
      const userMsg: UiMessage = { id: nextId++, role: "user", content, display: opts?.display };
      const reply: UiMessage = { id: nextId++, role: "assistant", content: "" };
      // Drop any empty assistant placeholder left by an earlier failure.
      const history = [...messages.filter((m) => m.content), userMsg];
      setMessages([...history, reply]);
      setOpen(true);
      mutation.mutate({ history, sampleDocument: opts?.sampleDocument, replyId: reply.id });
    },
    [messages, mutation],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const api = useMemo<ChatApi>(
    () => ({ messages, pending: mutation.isPending, error, open, setOpen, ask, reset }),
    [messages, mutation.isPending, error, open, ask, reset],
  );
  return <ChatCtx.Provider value={api}>{children}</ChatCtx.Provider>;
}

export function ChatPanel() {
  const { messages, pending, error, open, setOpen, ask } = useChat();
  const [draft, setDraft] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const hintId = useId();
  const panelId = "navigator-chat";

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && window.matchMedia("(max-width: 1023px)").matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const submit = (text: string) => {
    if (looksSensitive(text)) {
      setWarning("That looks like a Social Security, bank or account number. Please don't share it here: the Navigator doesn't need it to help you.");
      return;
    }
    setWarning(null);
    ask(text);
    setDraft("");
  };

  const last = messages[messages.length - 1];
  const streamingId = pending ? last?.id : undefined;
  const status = pending ? "The Navigator is replying." : last?.role === "assistant" && last.content ? "The Navigator replied." : "";

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        className="btn btn-primary fixed bottom-4 right-4 z-40 shadow-xl lg:hidden"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        {open ? <IconX size={20} /> : <IconChat size={20} />} {open ? "Close chat" : "Ask the Navigator"}
      </button>

      <aside
        id={panelId}
        aria-labelledby="chat-heading"
        className={`${open ? "fixed inset-0 z-50 flex" : "hidden"} flex-col bg-white lg:sticky lg:top-[4.5rem] lg:z-auto lg:flex lg:h-[calc(100vh-5.5rem)] lg:rounded-xl lg:border lg:border-line`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line bg-navy-900 px-4 py-3 text-paper on-dark lg:rounded-t-xl">
          <div>
            <h2 id="chat-heading" className="flex items-center gap-2 text-xl">
              <IconSparkle size={20} className="text-gold" /> Ask the Navigator
            </h2>
            <p className="text-sm text-paper/85">Knows your timeline and checklist. General information only.</p>
          </div>
          <button type="button" className="btn btn-sm btn-outline lg:hidden" onClick={() => setOpen(false)}>
            <IconX size={18} /> Close
          </button>
        </div>

        <div ref={logRef} role="log" aria-label="Conversation" className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-base">
          {messages.length === 0 && (
            <div>
              <p className="text-muted">Ask anything about your transition. Try one of these:</p>
              <ul className="mt-3 grid gap-2">
                {STARTERS.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => submit(q)}
                      className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-left font-medium text-navy-900 hover:border-navy-600 hover:bg-navy-100"
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="ml-8 rounded-2xl rounded-br-sm bg-navy-900 px-4 py-2.5 text-paper">
                <span className="sr-only">You said: </span>
                {m.display ?? m.content}
              </div>
            ) : (
              <div key={m.id} className="mr-4 rounded-2xl rounded-bl-sm bg-paper px-4 py-3 text-ink">
                <span className="sr-only">Navigator said: </span>
                {m.content ? <Markdown text={m.content} /> : <span className="text-muted">Thinking…</span>}
                {m.content && m.id !== streamingId && <Sources sources={m.sources} answer={m.content} />}
              </div>
            ),
          )}
          {error && (
            <p role="alert" className="flex gap-2 rounded-lg bg-bad-bg px-3 py-2 text-bad">
              <IconAlert size={20} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}
        </div>
        <p className="sr-only" aria-live="polite">{status}</p>

        <form
          className="border-t border-line p-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit(draft);
          }}
        >
          {warning && (
            <p role="alert" className="mb-2 rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">{warning}</p>
          )}
          <label htmlFor={inputId} className="sr-only">Your question</label>
          <div className="flex items-end gap-2">
            <textarea
              id={inputId}
              ref={inputRef}
              rows={2}
              value={draft}
              maxLength={CHAT_LIMITS.maxMessageChars}
              aria-describedby={hintId}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit(draft);
                }
              }}
              placeholder="Ask a question…"
              className="input min-h-[3rem] flex-1 resize-none text-base"
            />
            <button type="submit" className="btn btn-primary h-12 w-12 !p-0" disabled={pending || !draft.trim()} aria-label="Send">
              <IconSend size={20} />
            </button>
          </div>
          <p id={hintId} className="mt-2 text-xs leading-snug text-muted">
            Don't share Social Security numbers, bank details or medical details. Crisis? Dial 988 then press 1.
          </p>
        </form>
      </aside>
    </>
  );
}

/**
 * Sources under an answer: the pages the answer links to, or if it links none,
 * the official pages that were retrieved for the question.
 */
function Sources({ sources, answer }: { sources?: ChatSource[]; answer: string }) {
  if (!sources?.length) return null;
  const cited = sources.filter((s) => answer.includes(s.url));
  const shown = cited.length ? cited : sources;
  return (
    <div className="mt-3 border-t border-line pt-2">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{cited.length ? "Sources" : "Related official sources"}</p>
      <ul className="mt-1 space-y-1 text-sm">
        {shown.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-start gap-1">
              <IconExternal size={14} className="mt-1 shrink-0" />
              <span>{s.title}<span className="text-muted"> · {new URL(s.url).hostname.replace(/^www\./, "")}</span><span className="sr-only"> (opens in a new tab)</span></span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
