import { describe, expect, it } from "vitest";
import { createApp, retrievalQuery } from "./app";
import { buildRetriever } from "./rag/retriever";

const context = {
  intake: { branch: "army", separationType: "retirement", separationDate: "2027-07-21", maritalStatus: "married", priorDivorce: false, hasDependents: true, serviceConnected: "not-sure", state: "MD" },
  today: "2026-11-20",
  timeline: [],
  documents: [],
};

const app = createApp({ anthropic: null, model: "test", retriever: buildRetriever([]) });
const post = (body: unknown, ip = "1.1.1.1") =>
  app.request("/api/chat", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip }, body: JSON.stringify(body) });

describe("POST /api/chat", () => {
  it("rejects a body that fails validation, naming fields but not values", async () => {
    const res = await post({ messages: [{ role: "user", content: "hi" }] }, "2.2.2.2");
    expect(res.status).toBe(400);
    const data = (await res.json()) as { fields: string[] };
    expect(data.fields).toContain("context");
  });

  it("rejects messages over the length cap", async () => {
    const res = await post({ messages: [{ role: "user", content: "x".repeat(2001) }], context }, "3.3.3.3");
    expect(res.status).toBe(400);
  });

  it("returns 503 with a clear message when no API key is configured", async () => {
    const res = await post({ messages: [{ role: "user", content: "When should I file?" }], context }, "4.4.4.4");
    expect(res.status).toBe(503);
  });

  it("rate limits repeated requests from one client", async () => {
    let last = 0;
    for (let i = 0; i < 14; i++) last = (await post({}, "5.5.5.5")).status;
    expect(last).toBe(429);
  });
});

describe("retrievalQuery", () => {
  it("adds the previous question for short follow-ups", () => {
    const q = retrievalQuery(
      [
        { role: "user", content: "When should I file my disability claim?" },
        { role: "assistant", content: "..." },
        { role: "user", content: "How long do I have?" },
      ],
      "retirement",
    );
    expect(q).toContain("disability claim");
    expect(q).toContain("How long do I have?");
  });

  it("doesn't add the previous question for a full new question", () => {
    const q = retrievalQuery(
      [
        { role: "user", content: "When should I file my disability claim?" },
        { role: "user", content: "What happens to my health coverage after I retire from the Army?" },
      ],
      "separation",
    );
    expect(q).not.toContain("disability");
    expect(q).toContain("separating");
  });
});
