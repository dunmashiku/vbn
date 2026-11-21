/**
 * Retrieval quality check: `pnpm eval:rag`.
 * For each sample question, does retrieve() return the expected source page
 * in its results, and at what rank? Exits non-zero below the pass threshold.
 */
import { createRetriever } from "./retriever";

export const EVAL_CASES: { question: string; expected: string }[] = [
  { question: "How many days before I get out can I file a disability claim?", expected: "bdd" },
  { question: "How do I get a copy of my DD-214?", expected: "dd214-records" },
  { question: "How long do I have to sign up for TRICARE after I retire?", expected: "tricare-retiring" },
  { question: "How do I apply for VA health care?", expected: "va-health-care" },
  { question: "Does my wife have to agree if I pick less survivor coverage?", expected: "sbp" },
  { question: "Will I need a medical exam to keep my life insurance?", expected: "vgli" },
  { question: "Can I transfer my GI Bill to my children?", expected: "gi-bill-transfer" },
  { question: "What veteran benefits does Maryland offer?", expected: "state-benefits" },
  { question: "Do I have to pay someone to help with my claim?", expected: "accredited-representatives" },
  { question: "Who can I talk to right now if I'm having thoughts of suicide?", expected: "veterans-crisis-line" },
];

const PASS_RATE = 0.8;

async function main() {
  const retriever = await createRetriever();
  let hits = 0;
  let reciprocalRanks = 0;
  console.log(`Retrieval eval over ${retriever.size} passages\n`);
  for (const c of EVAL_CASES) {
    const results = await retriever.retrieve(c.question);
    const docs = results.map((r) => r.docId);
    const rank = docs.indexOf(c.expected) + 1;
    if (rank > 0) {
      hits++;
      reciprocalRanks += 1 / rank;
    }
    console.log(`${rank > 0 ? "PASS" : "FAIL"}  rank ${rank || "-"}  ${c.question}`);
    console.log(`      expected ${c.expected}; got ${docs.join(", ") || "(nothing)"}`);
  }
  const rate = hits / EVAL_CASES.length;
  console.log(`\nHit rate: ${hits}/${EVAL_CASES.length} (${Math.round(rate * 100)}%)   MRR: ${(reciprocalRanks / EVAL_CASES.length).toFixed(2)}`);
  if (rate < PASS_RATE) {
    console.error(`Below the ${PASS_RATE * 100}% pass threshold.`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
