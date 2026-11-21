The navigator app in this repo is mostly built. Add grounded answers (RAG) to the existing chat. Read `CLAUDE.md` and `docs/architecture.md` first, look at how `services/chat` and the chat UI work today, and change only what is needed. Don't rebuild anything that already works.

### Grounded answers (RAG)

The chat must answer from official sources, not from the model's memory.

- Create `content/va/` with 10 to 15 short markdown files, one per topic: Benefits Delivery at Discharge, Survivor Benefit Plan, TRICARE options for retirees, VA health care enrollment, VGLI, DD-214, GI Bill transfer, state benefits, accredited representatives and the Veterans Crisis Line. Write each by reading the official page. Each file has front matter with a title, the source URL, the date retrieved and `verify: true`.
- At startup, the chat service splits these files into passages of a few paragraphs and builds an in-memory search index with MiniSearch (approved dependency). No embeddings API is needed for the demo.
- For each question, retrieve the top 3 to 5 passages and include them in the prompt with their source URLs. The model answers from them, cites sources as links, and says it isn't sure when the passages don't cover the question.
- Keep the existing chat rules (general information only, never file claims, point to free accredited representatives, Veterans Crisis Line for anyone in crisis, never ask for Social Security or bank numbers).
- In the chat UI, show the sources under each answer.
- Add a small evaluation script with 10 sample questions and the source page each should retrieve, to check retrieval quality. Add a `pnpm eval:rag` command.
- Keep retrieval behind a single `retrieve(query)` interface, so production can swap in Amazon Bedrock Knowledge Bases or Aurora PostgreSQL with pgvector and Bedrock embeddings without changing the chat code. Describe this in `docs/architecture.md`, and update `CLAUDE.md` and the README demo script.

Work in small steps: content files, index and `retrieve()`, chat service integration, sources in the UI, evaluation script, docs. Run type checks and the existing tests after each step, and make sure `pnpm dev` still works at the end. Ask before adding any dependency other than MiniSearch.
