import { z } from "zod";
import { errorFor, VaApiError, type VaClient } from "./client";
import { readFixturePdf } from "./fixtures";

/** What every tool returns: plain text for the model, plus structured data, and an error flag. */
export interface ToolResult {
  text: string;
  data?: unknown;
  isError?: boolean;
}

const ok = (data: unknown, note?: string): ToolResult => ({ text: (note ? `${note}\n\n` : "") + JSON.stringify(data, null, 2), data });
const fail = (message: string): ToolResult => ({ text: message, isError: true });

async function run(fn: () => Promise<ToolResult>): Promise<ToolResult> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof VaApiError) return fail(e.message);
    if (e instanceof z.ZodError) return fail("The VA sandbox returned data in an unexpected format. Try again later.");
    return fail("Something went wrong talking to the VA sandbox. Try again later.");
  }
}

// ---------------------------------------------------------------------------
// 1. find_va_facilities
// ---------------------------------------------------------------------------

export const FACILITY_TYPES = { health: "health", benefits: "benefits", vet_center: "vet_center" } as const;

export const findFacilitiesInput = {
  state: z.string().regex(/^[A-Za-z]{2}$/, "Use a two-letter state code, like MD").optional().describe("Two-letter state code, e.g. MD. Required when searching by city."),
  city: z.string().min(2).max(60).optional().describe("City name, e.g. Annapolis. The VA API has no city filter, so this filters results within the state."),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Use a 5-digit ZIP code").optional().describe("5-digit ZIP code."),
  lat: z.number().min(-90).max(90).optional().describe("Latitude, to sort results by distance. Use with long."),
  long: z.number().min(-180).max(180).optional().describe("Longitude, to sort results by distance. Use with lat."),
  radius: z.number().positive().max(500).optional().describe("Miles from lat/long. Only with lat and long."),
  type: z.enum(["health", "benefits", "vet_center"]).optional().describe("Facility type: health (medical centers and clinics), benefits (benefits offices), or vet_center."),
  limit: z.number().int().min(1).max(10).default(5).describe("How many facilities to return (1 to 10)."),
};
const FindFacilitiesSchema = z.object(findFacilitiesInput).superRefine((v, ctx) => {
  if ((v.lat === undefined) !== (v.long === undefined)) ctx.addIssue({ code: "custom", message: "Give both lat and long, or neither." });
  if (v.radius !== undefined && v.lat === undefined) ctx.addIssue({ code: "custom", message: "radius needs lat and long." });
  if (v.city && !v.state) ctx.addIssue({ code: "custom", message: "Searching by city needs a state too, e.g. city Annapolis, state MD." });
  if (!v.state && !v.zip && v.lat === undefined) ctx.addIssue({ code: "custom", message: "Give a state, a ZIP code, or lat and long." });
});
export type FindFacilitiesArgs = z.input<typeof FindFacilitiesSchema>;

const Address = z.object({ address1: z.string().nullish(), address2: z.string().nullish(), address3: z.string().nullish(), city: z.string().nullish(), state: z.string().nullish(), zip: z.string().nullish() }).nullish();
const NamedService = z.object({ name: z.string().nullish() }).passthrough();
const FacilitySchema = z.object({
  id: z.string(),
  attributes: z.object({
    name: z.string(),
    facilityType: z.string(),
    classification: z.string().nullish(),
    website: z.string().nullish(),
    address: z.object({ physical: Address }).passthrough().nullish(),
    phone: z.object({ main: z.string().nullish() }).passthrough().nullish(),
    hours: z.record(z.string(), z.string().nullish()).nullish(),
    services: z.object({ health: z.array(NamedService).nullish(), benefits: z.array(NamedService).nullish(), other: z.array(NamedService).nullish() }).passthrough().nullish(),
    operatingStatus: z.object({ code: z.string().nullish(), additionalInfo: z.string().nullish() }).passthrough().nullish(),
  }).passthrough(),
}).passthrough();
const FacilitiesResponseSchema = z.object({
  data: z.array(FacilitySchema),
  meta: z.object({ distances: z.array(z.object({ id: z.string(), distance: z.number() })).nullish() }).passthrough().nullish(),
}).passthrough();

const TYPE_LABEL: Record<string, string> = {
  va_benefits_facility: "Benefits office",
  va_health_facility: "Health facility",
  vet_center: "Vet Center",
  va_cemetery: "Cemetery",
};

export async function findVaFacilities(client: VaClient, args: FindFacilitiesArgs): Promise<ToolResult> {
  const parsed = FindFacilitiesSchema.safeParse(args);
  if (!parsed.success) return fail(`Can't search yet: ${parsed.error.issues.map((i) => i.message).join(" ")}`);
  const v = parsed.data;
  return run(async () => {
    const q = new URLSearchParams();
    if (v.state) q.set("state", v.state.toUpperCase());
    if (v.zip) q.set("zip", v.zip);
    if (v.lat !== undefined && v.long !== undefined) {
      q.set("lat", String(v.lat));
      q.set("long", String(v.long));
      if (v.radius) q.set("radius", String(v.radius));
    }
    if (v.type) q.set("type", v.type);
    // With a city we filter locally, so fetch the whole state in one page.
    q.set("per_page", String(v.city ? 200 : v.limit));

    // Docs: https://developer.va.gov/explore/api/va-facilities/docs?version=current
    // OpenAPI: https://api.va.gov/internal/docs/facilities/v1/openapi.json  (GET /services/va_facilities/v1/facilities, header "apikey")
    const res = await client.request("facilities", `/services/va_facilities/v1/facilities?${q}`);
    if (!res.ok) throw await errorFor(res, "the Facilities API");
    const body = FacilitiesResponseSchema.parse(await res.json());
    const distances = new Map((body.meta?.distances ?? []).map((d) => [d.id, d.distance]));

    let facilities = body.data;
    if (v.city) {
      const city = v.city.trim().toLowerCase();
      facilities = facilities.filter((f) => f.attributes.address?.physical?.city?.trim().toLowerCase() === city);
    }
    const results = facilities.slice(0, v.limit).map((f) => {
      const a = f.attributes;
      const p = a.address?.physical;
      const services = [...(a.services?.benefits ?? []), ...(a.services?.health ?? []), ...(a.services?.other ?? [])]
        .map((s) => s.name)
        .filter((n): n is string => Boolean(n));
      return {
        id: f.id,
        name: a.name,
        type: TYPE_LABEL[a.facilityType] ?? a.facilityType,
        address: p ? [p.address1, p.address2, p.address3, [p.city, p.state].filter(Boolean).join(", "), p.zip].filter(Boolean).join(", ") : null,
        phone: a.phone?.main ?? null,
        hours: a.hours ?? null,
        services: services.slice(0, 12),
        website: a.website ?? null,
        status: a.operatingStatus?.code ?? null,
        distanceMiles: distances.has(f.id) ? Math.round(distances.get(f.id)! * 10) / 10 : null,
      };
    });
    if (!results.length) {
      return ok({ facilities: [] }, `No ${v.type ? `${v.type.replace("_", " ")} ` : ""}facilities matched. Try a nearby city, a ZIP code, or the whole state.`);
    }
    return ok(
      { facilities: results, source: "VA Facilities API (sandbox)", findOnVaGov: "https://www.va.gov/find-locations/" },
      `Found ${results.length} VA ${results.length === 1 ? "facility" : "facilities"}. Sandbox data may be out of date: confirm on VA.gov and call ahead.`,
    );
  });
}

// ---------------------------------------------------------------------------
// 2. validate_document
// ---------------------------------------------------------------------------

export const fixtureInput = {
  fixture: z.string().describe("File name of a PDF in services/va-mcp/fixtures, e.g. sample-dd214-SAMPLE.pdf. Other paths are refused."),
};

const ValidateOk = z.object({ data: z.object({ attributes: z.object({ status: z.string() }).passthrough() }).passthrough() }).passthrough();
const ValidateFail = z.object({ errors: z.array(z.object({ title: z.string().nullish(), detail: z.string().nullish() }).passthrough()) }).passthrough();

export async function validateDocument(client: VaClient, args: { fixture: string }): Promise<ToolResult> {
  return run(async () => {
    const { name, bytes } = await readFixturePdf(args.fixture);
    // Docs: https://developer.va.gov/explore/api/benefits-intake/docs?version=current
    // OpenAPI: https://api.va.gov/internal/docs/benefits-intake/v1/openapi.json
    //   POST /services/vba_documents/v1/uploads/validate_document, raw PDF body, Content-Type: application/pdf
    const res = await client.request("intake", "/services/vba_documents/v1/uploads/validate_document", {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: bytes,
    });
    if (res.status === 200) {
      const body = ValidateOk.parse(await res.json());
      return ok({ fixture: name, valid: body.data.attributes.status === "valid", status: body.data.attributes.status }, `${name} meets the VA's PDF requirements.`);
    }
    if (res.status === 422) {
      const body = ValidateFail.parse(await res.json());
      const problems = body.errors.map((e) => e.detail ?? e.title ?? "Unknown problem");
      return ok({ fixture: name, valid: false, problems }, `${name} doesn't meet the VA's PDF requirements.`);
    }
    throw await errorFor(res, "document validation");
  });
}

// ---------------------------------------------------------------------------
// 3. upload_test_document (sandbox only, explicit confirm)
// ---------------------------------------------------------------------------

export const uploadInput = {
  ...fixtureInput,
  confirm: z.boolean().describe("Must be true. Confirms you intend to send this fixture to the VA sandbox for a fake test veteran."),
};

/**
 * Metadata for an obviously fake test veteran. fileNumber is the example from the
 * VA's own docs; numbers starting with 9 are not valid Social Security numbers.
 */
export const FAKE_TEST_VETERAN = {
  veteranFirstName: "Test",
  veteranLastName: "Sample-Veteran",
  fileNumber: "999887777",
  zipCode: "20571",
  source: "Selabrook Benefits Navigator sandbox test",
  docType: "DD-214",
  businessLine: "CMP",
} as const;

const UploadLocation = z.object({
  data: z.object({ id: z.string().uuid(), attributes: z.object({ guid: z.string().uuid(), status: z.string(), location: z.string().url() }).passthrough() }).passthrough(),
}).passthrough();

export async function uploadTestDocument(client: VaClient, args: { fixture: string; confirm: boolean }): Promise<ToolResult> {
  if (args.confirm !== true) {
    return fail("Not sent. upload_test_document sends a fixture to the VA sandbox for a fake test veteran, so it needs confirm: true.");
  }
  return run(async () => {
    const { name, bytes } = await readFixturePdf(args.fixture);

    // Step 1. Docs: https://developer.va.gov/explore/api/benefits-intake/docs?version=current ("How to Upload", steps 1-2)
    //   POST /services/vba_documents/v1/uploads -> data.id (guid) and data.attributes.location (pre-signed, valid 15 minutes)
    const created = await client.request("intake", "/services/vba_documents/v1/uploads", { method: "POST" });
    if (!created.ok) throw await errorFor(created, "starting an upload");
    const { data } = UploadLocation.parse(await created.json());
    const location = new URL(data.attributes.location);
    if (location.protocol !== "https:") throw new VaApiError("The VA returned an upload location that isn't HTTPS, so nothing was sent.");

    // Step 2. Docs: same page, steps 3-4. PUT multipart/form-data to the location with parts
    //   "metadata" (application/json) and "content" (application/pdf). No apikey header: auth is in the URL.
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(FAKE_TEST_VETERAN)], { type: "application/json" }), "metadata.json");
    form.append("content", new Blob([bytes], { type: "application/pdf" }), name);
    const put = await client.requestSigned(location.toString(), { method: "PUT", body: form });
    if (!put.ok) throw await errorFor(put, "the document upload");

    return ok(
      { submissionId: data.id, fixture: name, testVeteran: `${FAKE_TEST_VETERAN.veteranFirstName} ${FAKE_TEST_VETERAN.veteranLastName} (fake)` },
      "Uploaded to the VA sandbox. In the sandbox the status stops at 'received'; check it with get_upload_status.",
    );
  });
}

// ---------------------------------------------------------------------------
// 4. get_upload_status
// ---------------------------------------------------------------------------

export const statusInput = {
  submissionId: z.string().uuid("Use the submission ID returned by upload_test_document").describe("The submission ID (a UUID) from upload_test_document."),
};

export const UPLOAD_STATUSES = ["pending", "uploaded", "received", "processing", "success", "vbms", "error", "expired"] as const;

const StatusResponse = z.object({
  data: z.object({
    id: z.string(),
    attributes: z.object({
      guid: z.string(),
      status: z.enum(UPLOAD_STATUSES),
      code: z.string().nullish(),
      detail: z.string().nullish(),
      final_status: z.boolean().nullish(),
      updated_at: z.string().nullish(),
    }).passthrough(),
  }).passthrough(),
}).passthrough();

const STATUS_MEANING: Record<(typeof UPLOAD_STATUSES)[number], string> = {
  pending: "No document has been uploaded for this submission yet.",
  uploaded: "The document reached the VA server and hasn't been validated yet.",
  received: "Received and waiting for processing. In the sandbox this is the final status.",
  processing: "The VA is validating and processing the package.",
  success: "Received in the VA's mail handling system.",
  vbms: "Added to the veteran's electronic folder (VBMS).",
  error: "Something went wrong. See the code and detail.",
  expired: "Nothing was uploaded within 15 minutes, so this submission expired.",
};

export async function getUploadStatus(client: VaClient, args: { submissionId: string }): Promise<ToolResult> {
  const parsed = z.object(statusInput).safeParse(args);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid submission ID.");
  return run(async () => {
    // Docs: https://developer.va.gov/explore/api/benefits-intake/docs?version=current ("How to Upload", steps 5-6)
    //   GET /services/vba_documents/v1/uploads/{id}
    const res = await client.request("intake", `/services/vba_documents/v1/uploads/${encodeURIComponent(parsed.data.submissionId)}`);
    if (!res.ok) throw await errorFor(res, "submission");
    const a = StatusResponse.parse(await res.json()).data.attributes;
    return ok(
      { submissionId: a.guid, status: a.status, meaning: STATUS_MEANING[a.status], code: a.code ?? null, detail: a.detail ?? null, final: a.final_status ?? null, updatedAt: a.updated_at ?? null },
      `Status: ${a.status}.`,
    );
  });
}
