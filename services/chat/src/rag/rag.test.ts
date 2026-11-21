import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { chunkDoc, DEFAULT_CONTENT_DIR, parseDoc, parseFrontMatter } from "./content";
import { EVAL_CASES } from "./eval";
import { buildRetriever, createRetriever } from "./retriever";

describe("content notes", () => {
  it("every note has title, official source, retrieval date and verify: true", async () => {
    const files = (await readdir(DEFAULT_CONTENT_DIR)).filter((f) => f.endsWith(".md"));
    expect(files.length).toBeGreaterThanOrEqual(10);
    expect(files.length).toBeLessThanOrEqual(15);
    for (const f of files) {
      const { meta } = parseFrontMatter(await readFile(path.join(DEFAULT_CONTENT_DIR, f), "utf8"));
      expect(meta.title, f).toBeTruthy();
      expect(meta.source, f).toMatch(/^https:\/\/[^/]*(va\.gov|tricare\.mil|defense\.gov|veteranscrisisline\.net)\//);
      expect(meta.retrieved, f).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(meta.verify, f).toBe("true");
    }
  });
});

describe("chunkDoc", () => {
  const doc = parseDoc(
    "sample.md",
    "---\ntitle: Sample\nsource: https://www.va.gov/sample/\nretrieved: 2026-11-20\nverify: true\n---\n\n## First\n\nAlpha paragraph.\n\nBeta paragraph.\n\n## Second\n\nGamma paragraph.\n",
  );

  it("makes one passage per section, keeping the heading and source", () => {
    const passages = chunkDoc(doc);
    expect(passages.map((p) => p.heading)).toEqual(["First", "Second"]);
    expect(passages[0]!.text).toContain("Beta paragraph.");
    expect(passages.every((p) => p.source === "https://www.va.gov/sample/")).toBe(true);
  });

  it("splits a very long section into several passages", () => {
    const long = parseDoc("long.md", `---\ntitle: Long\nsource: https://www.va.gov/long/\n---\n\n## Big\n\n${Array.from({ length: 8 }, (_, i) => `Paragraph ${i} ${"word ".repeat(60)}`).join("\n\n")}`);
    expect(chunkDoc(long).length).toBeGreaterThan(1);
  });
});

describe("retrieve()", () => {
  it("returns at most k passages, at most two per page", async () => {
    const r = await createRetriever();
    const results = await r.retrieve("TRICARE health coverage retirement enroll", { k: 4 });
    expect(results.length).toBeLessThanOrEqual(4);
    const perDoc = new Map<string, number>();
    for (const p of results) perDoc.set(p.docId, (perDoc.get(p.docId) ?? 0) + 1);
    expect(Math.max(...perDoc.values())).toBeLessThanOrEqual(2);
  });

  it("returns nothing for an empty index or unrelated query", async () => {
    expect(await buildRetriever([]).retrieve("anything")).toEqual([]);
  });

  it("finds the expected page for at least 8 of the 10 eval questions", async () => {
    const r = await createRetriever();
    let hits = 0;
    for (const c of EVAL_CASES) {
      if ((await r.retrieve(c.question)).some((p) => p.docId === c.expected)) hits++;
    }
    expect(hits).toBeGreaterThanOrEqual(8);
  });
});
