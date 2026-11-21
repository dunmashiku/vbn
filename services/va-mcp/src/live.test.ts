/**
 * Optional live tests against the real VA sandbox. Skipped unless VA_LIVE_TEST=1.
 *   pnpm --filter @vbn/va-mcp test:live
 * The upload test also needs VA_LIVE_UPLOAD=1, because it sends the fake SAMPLE
 * DD-214 to the sandbox for a fake test veteran.
 */
import { describe, expect, it } from "vitest";
import { VaClient } from "./client";
import { loadDotEnv, readConfig } from "./config";
import { findVaFacilities, getUploadStatus, uploadTestDocument, validateDocument } from "./tools";

const live = process.env.VA_LIVE_TEST === "1";
const liveUpload = live && process.env.VA_LIVE_UPLOAD === "1";

describe.skipIf(!live)("VA sandbox (live)", () => {
  loadDotEnv();
  const client = new VaClient(readConfig());

  it("finds benefits offices in Maryland", async () => {
    const r = await findVaFacilities(client, { state: "MD", type: "benefits", limit: 3 });
    expect(r.isError, r.text).toBeFalsy();
    expect((r.data as { facilities: unknown[] }).facilities.length).toBeGreaterThan(0);
  }, 30_000);

  it("validates the sample PDF", async () => {
    const r = await validateDocument(client, { fixture: "sample-dd214-SAMPLE.pdf" });
    expect(r.isError, r.text).toBeFalsy();
    expect(r.data).toMatchObject({ valid: true });
  }, 30_000);

  it.skipIf(!liveUpload)("uploads the sample for a fake veteran and reads its status", async () => {
    const up = await uploadTestDocument(client, { fixture: "sample-dd214-SAMPLE.pdf", confirm: true });
    expect(up.isError, up.text).toBeFalsy();
    const id = (up.data as { submissionId: string }).submissionId;
    const st = await getUploadStatus(client, { submissionId: id });
    expect(st.isError, st.text).toBeFalsy();
  }, 60_000);
});
