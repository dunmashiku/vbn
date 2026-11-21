import { describe, expect, it } from "vitest";
import type { Intake } from "./intake";
import { applicableDocuments, buildTimeline, statusFor } from "./timeline";

const base: Intake = {
  branch: "army",
  separationType: "retirement",
  separationDate: "2027-07-21",
  maritalStatus: "married",
  priorDivorce: false,
  hasDependents: true,
  serviceConnected: "not-sure",
  state: "MD",
};

describe("buildTimeline", () => {
  it("builds the demo person's 8 milestones, with TAP overdue", () => {
    const t = buildTimeline(base, {}, "2026-11-20");
    expect(t).toHaveLength(8);
    expect(t.find((m) => m.rule.id === "tap")?.status).toBe("overdue");
    expect(t.find((m) => m.rule.id === "bdd")).toMatchObject({ opens: "2027-01-22", due: "2027-04-22", status: "upcoming" });
  });

  it("shows the Survivor Benefit Plan to retirees only", () => {
    expect(buildTimeline(base, {}, "2026-11-20").some((m) => m.rule.id === "sbp")).toBe(true);
    expect(buildTimeline({ ...base, separationType: "separation" }, {}, "2026-11-20").some((m) => m.rule.id === "sbp")).toBe(false);
  });

  it("hides the BDD claim when there's no service-connected condition", () => {
    expect(buildTimeline({ ...base, serviceConnected: "no" }, {}, "2026-11-20").some((m) => m.rule.id === "bdd")).toBe(false);
  });

  it("marks checked-off milestones as done", () => {
    expect(buildTimeline(base, { tap: true }, "2026-11-20").find((m) => m.rule.id === "tap")?.status).toBe("done");
  });
});

describe("statusFor", () => {
  it("covers upcoming, due soon, overdue and done", () => {
    expect(statusFor("2027-01-01", "2027-03-01", "2026-11-20", false)).toBe("upcoming");
    expect(statusFor("2026-11-01", "2027-03-01", "2026-11-20", false)).toBe("due-soon");
    expect(statusFor("2026-12-30", "2026-12-31", "2026-11-20", false)).toBe("due-soon");
    expect(statusFor("2026-01-01", "2026-06-01", "2026-11-20", false)).toBe("overdue");
    expect(statusFor("2026-01-01", "2026-06-01", "2026-11-20", true)).toBe("done");
  });
});

describe("applicableDocuments", () => {
  const ids = (i: Intake) => applicableDocuments(i).map((d) => d.id);

  it("includes marriage and dependent documents only when they apply", () => {
    expect(ids(base)).toEqual(expect.arrayContaining(["marriage-certificate", "dependent-birth-certificates"]));
    expect(ids({ ...base, maritalStatus: "single", hasDependents: false })).not.toContain("marriage-certificate");
  });

  it("includes a divorce decree for a prior divorce", () => {
    expect(ids(base)).not.toContain("divorce-decree");
    expect(ids({ ...base, priorDivorce: true })).toContain("divorce-decree");
  });

  it("always lists SSNs and bank details as have-ready only", () => {
    const docs = applicableDocuments(base).filter((d) => d.id === "ssn" || d.id === "bank-info");
    expect(docs).toHaveLength(2);
    expect(docs.every((d) => d.handling === "have-ready")).toBe(true);
  });
});
