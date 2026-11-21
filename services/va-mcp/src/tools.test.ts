import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";
import { RateLimiter, VaClient, type FetchLike } from "./client";
import { ConfigError, readConfig } from "./config";
import { readFixturePdf } from "./fixtures";
import { createServer } from "./server";
import { FAKE_TEST_VETERAN, findVaFacilities, getUploadStatus, uploadTestDocument, validateDocument } from "./tools";

const KEY = "test-key-not-real";
const config = { baseUrl: "https://sandbox-api.va.gov", facilitiesKey: KEY, intakeKey: KEY };
const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

/** A mocked fetch that records calls and returns queued responses. */
function mockFetch(...responses: Response[]) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fn: FetchLike = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const r = responses.shift();
    if (!r) throw new Error("no more mocked responses");
    return r;
  });
  return { fn, calls };
}
const client = (fetch: FetchLike) => new VaClient(config, { fetch, sleep: async () => {}, limiter: new RateLimiter(1000) });

const facility = (id: string, city: string, extra: Record<string, unknown> = {}) => ({
  id,
  type: "va_facilities",
  attributes: {
    name: `${city} VA Office`,
    facilityType: "va_benefits_facility",
    lat: 38.9,
    long: -76.5,
    website: "https://www.va.gov/example",
    address: { physical: { address1: "1 Main St", city, state: "MD", zip: "21401" } },
    phone: { main: "410-555-0100" },
    hours: { monday: "8:00AM-4:00PM" },
    services: { benefits: [{ name: "Disability compensation", link: "x" }] },
    operatingStatus: { code: "NORMAL" },
    ...extra,
  },
});

describe("config", () => {
  it("defaults to the sandbox and accepts the sandbox URL", () => {
    expect(readConfig({}).baseUrl).toBe("https://sandbox-api.va.gov");
    expect(readConfig({ VA_API_BASE_URL: "https://sandbox-api.va.gov/" }).baseUrl).toBe("https://sandbox-api.va.gov");
  });

  it("refuses production or any other host", () => {
    expect(() => readConfig({ VA_API_BASE_URL: "https://api.va.gov" })).toThrow(ConfigError);
    expect(() => readConfig({ VA_API_BASE_URL: "http://sandbox-api.va.gov" })).toThrow(ConfigError);
    expect(() => readConfig({ VA_API_BASE_URL: "https://sandbox-api.va.gov.evil.example" })).toThrow(ConfigError);
  });

  it("uses per-API keys when given, else VA_API_KEY", () => {
    const c = readConfig({ VA_API_KEY: "shared", VA_FACILITIES_API_KEY: "fac" });
    expect(c).toMatchObject({ facilitiesKey: "fac", intakeKey: "shared" });
  });
});

describe("find_va_facilities", () => {
  it("searches by state and type with the apikey header and returns plain fields", async () => {
    const m = mockFetch(json(200, { data: [facility("vba_313", "Baltimore")], meta: {} }));
    const r = await findVaFacilities(client(m.fn), { state: "md", type: "benefits", limit: 3 });
    expect(r.isError).toBeFalsy();
    const url = new URL(m.calls[0]!.url);
    expect(url.pathname).toBe("/services/va_facilities/v1/facilities");
    expect(Object.fromEntries(url.searchParams)).toEqual({ state: "MD", type: "benefits", per_page: "3" });
    expect(new Headers(m.calls[0]!.init?.headers).get("apikey")).toBe(KEY);
    expect(r.data).toMatchObject({ facilities: [{ name: "Baltimore VA Office", phone: "410-555-0100", type: "Benefits office" }] });
  });

  it("filters by city locally, since the API has no city parameter", async () => {
    const m = mockFetch(json(200, { data: [facility("a", "Baltimore"), facility("b", "Annapolis")] }));
    const r = await findVaFacilities(client(m.fn), { state: "MD", city: "annapolis" });
    expect(new URL(m.calls[0]!.url).searchParams.get("per_page")).toBe("200");
    expect((r.data as { facilities: { id: string }[] }).facilities.map((f) => f.id)).toEqual(["b"]);
  });

  it("includes distance when searching near a point", async () => {
    const m = mockFetch(json(200, { data: [facility("a", "Annapolis")], meta: { distances: [{ id: "a", distance: 2.345 }] } }));
    const r = await findVaFacilities(client(m.fn), { lat: 38.97, long: -76.49, type: "benefits" });
    expect((r.data as { facilities: { distanceMiles: number }[] }).facilities[0]!.distanceMiles).toBe(2.3);
  });

  it("rejects incomplete input without calling the API", async () => {
    const m = mockFetch();
    expect((await findVaFacilities(client(m.fn), { city: "Annapolis" })).isError).toBe(true);
    expect((await findVaFacilities(client(m.fn), { lat: 38 })).isError).toBe(true);
    expect(m.calls).toHaveLength(0);
  });

  it("explains a missing key in plain language", async () => {
    const noKey = new VaClient({ ...config, facilitiesKey: null }, { fetch: mockFetch().fn });
    const r = await findVaFacilities(noKey, { state: "MD" });
    expect(r).toMatchObject({ isError: true });
    expect(r.text).toContain("VA_API_KEY");
  });

  it("retries on 429 with backoff, then succeeds", async () => {
    const m = mockFetch(json(429, { message: "API rate limit exceeded" }, { "retry-after": "1" }), json(200, { data: [] }));
    const r = await findVaFacilities(client(m.fn), { state: "MD" });
    expect(m.calls).toHaveLength(2);
    expect(r.isError).toBeFalsy();
  });

  it("returns a plain error for an unexpected response shape", async () => {
    const r = await findVaFacilities(client(mockFetch(json(200, { nope: true })).fn), { state: "MD" });
    expect(r).toMatchObject({ isError: true });
  });

  it("never includes the API key in the result", async () => {
    const r = await findVaFacilities(client(mockFetch(json(403, { message: "You cannot consume this service" })).fn), { state: "MD" });
    expect(r.isError).toBe(true);
    expect(r.text).not.toContain(KEY);
  });
});

describe("validate_document", () => {
  it("posts the raw PDF with Content-Type application/pdf", async () => {
    const m = mockFetch(json(200, { data: { type: "documentValidation", attributes: { status: "valid" } } }));
    const r = await validateDocument(client(m.fn), { fixture: "sample-dd214-SAMPLE.pdf" });
    expect(m.calls[0]!.url).toBe("https://sandbox-api.va.gov/services/vba_documents/v1/uploads/validate_document");
    expect(new Headers(m.calls[0]!.init?.headers).get("content-type")).toBe("application/pdf");
    expect(r.data).toMatchObject({ valid: true });
  });

  it("reports validation problems from a 422", async () => {
    const m = mockFetch(json(422, { errors: [{ title: "Document failed validation", detail: "Document is locked with a user password", status: "422" }] }));
    const r = await validateDocument(client(m.fn), { fixture: "sample-dd214-SAMPLE.pdf" });
    expect(r.data).toMatchObject({ valid: false, problems: ["Document is locked with a user password"] });
  });

  it("refuses anything outside fixtures/", async () => {
    const m = mockFetch();
    for (const fixture of ["../package.json", "/etc/passwd", "../../services/chat/.env", "notes.txt", ".hidden.pdf"]) {
      expect((await validateDocument(client(m.fn), { fixture })).isError, fixture).toBe(true);
    }
    expect(m.calls).toHaveLength(0);
  });
});

describe("upload_test_document", () => {
  const location = "https://sandbox-api.va.gov/services/vba_documents/internal/upload/abc?signature=SECRET";
  const id = "6d8433c1-cd55-4c24-affd-f592287a7572";

  it("refuses without confirm: true", async () => {
    const m = mockFetch();
    const r = await uploadTestDocument(client(m.fn), { fixture: "sample-dd214-SAMPLE.pdf", confirm: false });
    expect(r.isError).toBe(true);
    expect(m.calls).toHaveLength(0);
  });

  it("requests a location, then PUTs multipart metadata for the fake veteran and the PDF", async () => {
    const m = mockFetch(json(202, { data: { id, type: "document_upload", attributes: { guid: id, status: "pending", location } } }), new Response(null, { status: 200 }));
    const r = await uploadTestDocument(client(m.fn), { fixture: "sample-dd214-SAMPLE.pdf", confirm: true });
    expect(r.data).toMatchObject({ submissionId: id });
    expect(m.calls[0]!.url).toBe("https://sandbox-api.va.gov/services/vba_documents/v1/uploads");
    expect(m.calls[1]!.url).toBe(location);
    expect(m.calls[1]!.init?.method).toBe("PUT");
    expect(new Headers(m.calls[1]!.init?.headers).get("apikey")).toBeNull();
    const form = m.calls[1]!.init?.body as FormData;
    expect(JSON.parse(await (form.get("metadata") as Blob).text())).toEqual(FAKE_TEST_VETERAN);
    expect((form.get("content") as Blob).type).toBe("application/pdf");
    expect(r.text).not.toContain("SECRET");
  });

  it("refuses files outside fixtures/ even with confirm", async () => {
    const m = mockFetch();
    expect((await uploadTestDocument(client(m.fn), { fixture: "../src/tools.ts", confirm: true })).isError).toBe(true);
    expect(m.calls).toHaveLength(0);
  });
});

describe("get_upload_status", () => {
  it("returns the status and what it means", async () => {
    const id = "6d8433c1-cd55-4c24-affd-f592287a7572";
    const m = mockFetch(json(200, { data: { id, type: "document_upload", attributes: { guid: id, status: "received", final_status: false, updated_at: "2026-11-20T10:00:00Z" } } }));
    const r = await getUploadStatus(client(m.fn), { submissionId: id });
    expect(m.calls[0]!.url).toBe(`https://sandbox-api.va.gov/services/vba_documents/v1/uploads/${id}`);
    expect(r.data).toMatchObject({ status: "received", final: false });
  });

  it("rejects an ID that isn't a UUID", async () => {
    expect((await getUploadStatus(client(mockFetch().fn), { submissionId: "../../x" })).isError).toBe(true);
  });

  it("maps 404 to a plain message", async () => {
    const r = await getUploadStatus(client(mockFetch(json(404, {})).fn), { submissionId: "6d8433c1-cd55-4c24-affd-f592287a7572" });
    expect(r.text).toContain("couldn't find");
  });
});

describe("rate limiter", () => {
  it("waits once 60 requests start within a minute", async () => {
    let now = 0;
    const waits: number[] = [];
    const limiter = new RateLimiter(60, 60_000, () => now, async (ms) => {
      waits.push(ms);
      now += ms;
    });
    for (let i = 0; i < 60; i++) await limiter.acquire();
    expect(waits).toHaveLength(0);
    await limiter.acquire();
    expect(waits.length).toBe(1);
    expect(waits[0]).toBeGreaterThanOrEqual(60_000);
  });
});

describe("fixtures", () => {
  it("ships a SAMPLE DD-214 PDF marked fake", async () => {
    const { bytes } = await readFixturePdf("sample-dd214-SAMPLE.pdf");
    const text = new TextDecoder("latin1").decode(bytes);
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain("SAMPLE");
    expect(text).toContain("FAKE");
  });
});

describe("MCP server", () => {
  it("lists the four tools and calls one over MCP", async () => {
    const m = mockFetch(json(200, { data: [facility("vba_313", "Baltimore")] }));
    const server = createServer(client(m.fn));
    const [a, b] = InMemoryTransport.createLinkedPair();
    const mcp = new Client({ name: "test", version: "0" });
    await Promise.all([server.connect(a), mcp.connect(b)]);
    const { tools } = await mcp.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["find_va_facilities", "get_upload_status", "upload_test_document", "validate_document"]);
    const res = await mcp.callTool({ name: "find_va_facilities", arguments: { state: "MD", type: "benefits" } });
    expect(res.isError).toBe(false);
    expect(JSON.stringify(res.content)).toContain("Baltimore VA Office");
    await mcp.close();
  });
});
