import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PREP_FORMS } from "./formPrep";

const PUBLIC_DIR = join(__dirname, "../../apps/web/public");
const SENSITIVE_LABEL = /social security|ssn|routing|account number|date of birth|file number/i;

describe("form prep guides", () => {
  it("have unique form ids", () => {
    const ids = PREP_FORMS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const form of PREP_FORMS) {
    describe(form.number, () => {
      const questions = form.sections.flatMap((s) => s.questions.map((q) => ({ key: `${s.id}.${q.id}`, q })));

      it("has unique question keys", () => {
        const keys = questions.map((x) => x.key);
        expect(new Set(keys).size).toBe(keys.length);
      });

      it("places every question on a rendered page of the official form", () => {
        for (const { key, q } of questions) {
          expect(q.where, key).toBeDefined();
          const src = form.pageImages[q.where!.page];
          expect(src, `${key} page ${q.where!.page}`).toBeDefined();
          expect(existsSync(join(PUBLIC_DIR, src!)), src).toBe(true);
          expect(q.where!.top).toBeGreaterThanOrEqual(0);
          expect(q.where!.bottom).toBeLessThanOrEqual(100);
          expect(q.where!.bottom).toBeGreaterThan(q.where!.top);
        }
      });

      it("never asks for sensitive numbers in a typed field", () => {
        for (const { key, q } of questions) {
          if (q.kind !== "choice") expect(SENSITIVE_LABEL.test(q.label), key).toBe(false);
          if (q.kind === "choice") expect(q.options?.length, key).toBeGreaterThan(1);
        }
      });
    });
  }
});
