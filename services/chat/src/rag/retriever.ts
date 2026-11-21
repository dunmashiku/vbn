import MiniSearch from "minisearch";
import { loadPassages, type Passage } from "./content";

/**
 * The one retrieval interface the chat depends on.
 *
 * Demo: an in-memory MiniSearch (BM25-style keyword) index over content/va.
 * Production: implement the same interface with Amazon Bedrock Knowledge Bases
 * or Aurora PostgreSQL + pgvector with Bedrock embeddings. The chat code
 * doesn't change. See docs/architecture.md.
 */
export interface RetrievedPassage extends Passage {
  score: number;
}

export interface Retriever {
  retrieve(query: string, opts?: { k?: number }): Promise<RetrievedPassage[]>;
  readonly size: number;
}

const STOP_WORDS = new Set(
  "a an and are as at be but by can do does for from get how i if in is it its me my of on or should so than that the their them then there these they this to up us was we what when where which who why will with you your yours".split(" "),
);

const DEFAULT_K = 4;
/** Drop weak matches: anything scoring under this share of the best hit. */
const RELATIVE_CUTOFF = 0.3;
/** At most this many passages from one source page, so answers can draw on more than one page. */
const MAX_PER_DOC = 2;

export function buildRetriever(passages: Passage[]): Retriever {
  const index = new MiniSearch<Passage>({
    fields: ["title", "heading", "text"],
    storeFields: ["docId", "title", "heading", "text", "source", "retrieved"],
    processTerm: (term) => {
      const t = term.toLowerCase();
      return STOP_WORDS.has(t) ? null : t;
    },
    searchOptions: {
      boost: { title: 3, heading: 2 },
      prefix: (term) => term.length > 3,
      fuzzy: (term) => (term.length > 5 ? 0.2 : false),
      combineWith: "OR",
    },
  });
  index.addAll(passages);
  const byId = new Map(passages.map((p) => [p.id, p]));

  return {
    size: passages.length,
    async retrieve(query, opts) {
      const k = opts?.k ?? DEFAULT_K;
      const hits = index.search(query.slice(0, 500));
      const top = hits[0]?.score ?? 0;
      const perDoc = new Map<string, number>();
      const out: RetrievedPassage[] = [];
      for (const h of hits) {
        if (out.length >= k || h.score < top * RELATIVE_CUTOFF) break;
        const p = byId.get(String(h.id))!;
        const n = perDoc.get(p.docId) ?? 0;
        if (n >= MAX_PER_DOC) continue;
        perDoc.set(p.docId, n + 1);
        out.push({ ...p, score: Math.round(h.score * 100) / 100 });
      }
      return out;
    },
  };
}

export async function createRetriever(dir?: string): Promise<Retriever> {
  const { passages } = await loadPassages(dir);
  return buildRetriever(passages);
}
