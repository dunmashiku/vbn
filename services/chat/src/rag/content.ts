import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** One chunk of an official-source note: a section of a few paragraphs. */
export interface Passage {
  id: string;
  docId: string;
  title: string;
  heading: string;
  text: string;
  source: string;
  retrieved: string;
}

export interface ContentDoc {
  docId: string;
  title: string;
  source: string;
  retrieved: string;
  body: string;
}

/** content/va at the repo root. Override with CONTENT_DIR (for example when bundled for Lambda). */
export const DEFAULT_CONTENT_DIR =
  process.env.CONTENT_DIR ?? fileURLToPath(new URL("../../../../content/va", import.meta.url));

/** Minimal front matter reader for `key: value` lines between `---` fences. */
export function parseFrontMatter(raw: string): { meta: Record<string, string>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!m) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of m[1]!.split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: raw.slice(m[0].length) };
}

export function parseDoc(fileName: string, raw: string): ContentDoc {
  const { meta, body } = parseFrontMatter(raw);
  const docId = fileName.replace(/\.md$/, "");
  if (!meta.title || !meta.source) throw new Error(`${fileName}: front matter needs title and source`);
  return { docId, title: meta.title, source: meta.source, retrieved: meta.retrieved ?? "", body };
}

const MAX_PASSAGE_CHARS = 1400;

/**
 * Splits a note into passages: one per `## ` section, and long sections into
 * groups of paragraphs under MAX_PASSAGE_CHARS.
 */
export function chunkDoc(doc: ContentDoc): Passage[] {
  const sections: { heading: string; text: string }[] = [];
  let heading = doc.title;
  let buf: string[] = [];
  const flush = () => {
    const text = buf.join("\n").trim();
    if (text) sections.push({ heading, text });
    buf = [];
  };
  for (const line of doc.body.split(/\r?\n/)) {
    const h = /^##\s+(.*)$/.exec(line);
    if (h) {
      flush();
      heading = h[1]!.trim();
    } else buf.push(line);
  }
  flush();

  const passages: Passage[] = [];
  for (const s of sections) {
    const paragraphs = s.text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    let group: string[] = [];
    const emit = () => {
      if (!group.length) return;
      passages.push({
        id: `${doc.docId}#${passages.length}`,
        docId: doc.docId,
        title: doc.title,
        heading: s.heading,
        text: group.join("\n\n"),
        source: doc.source,
        retrieved: doc.retrieved,
      });
      group = [];
    };
    for (const p of paragraphs) {
      if (group.length && [...group, p].join("\n\n").length > MAX_PASSAGE_CHARS) emit();
      group.push(p);
    }
    emit();
  }
  return passages;
}

export async function loadPassages(dir = DEFAULT_CONTENT_DIR): Promise<{ docs: ContentDoc[]; passages: Passage[] }> {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
  const docs = await Promise.all(files.map(async (f) => parseDoc(f, await readFile(path.join(dir, f), "utf8"))));
  return { docs, passages: docs.flatMap(chunkDoc) };
}
