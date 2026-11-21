import type { VaConfig } from "./config";

/** A plain-language error safe to show to a user or model. Never contains the key or a signed URL. */
export class VaApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Client-side limiter for the VA's 60 requests per minute: a sliding window of
 * request start times. Calls wait their turn instead of failing.
 */
export class RateLimiter {
  private starts: number[] = [];
  constructor(
    private readonly max = 60,
    private readonly windowMs = 60_000,
    private readonly now = () => Date.now(),
    private readonly sleep = (ms: number) => new Promise((r) => setTimeout(r, ms)),
  ) {}

  async acquire(): Promise<void> {
    for (;;) {
      const t = this.now();
      this.starts = this.starts.filter((s) => t - s < this.windowMs);
      if (this.starts.length < this.max) {
        this.starts.push(t);
        return;
      }
      await this.sleep(this.windowMs - (t - this.starts[0]!) + 5);
    }
  }
}

export interface VaClientOptions {
  fetch?: FetchLike;
  limiter?: RateLimiter;
  sleep?: (ms: number) => Promise<void>;
  maxRetries?: number;
}

type Api = "facilities" | "intake";

export class VaClient {
  private readonly fetch: FetchLike;
  private readonly limiter: RateLimiter;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly maxRetries: number;

  constructor(
    readonly config: VaConfig,
    opts: VaClientOptions = {},
  ) {
    this.fetch = opts.fetch ?? ((input, init) => fetch(input, init));
    this.limiter = opts.limiter ?? new RateLimiter();
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.maxRetries = opts.maxRetries ?? 3;
  }

  private key(api: Api): string {
    const key = api === "facilities" ? this.config.facilitiesKey : this.config.intakeKey;
    if (!key) {
      throw new VaApiError(
        `No VA API key is configured for the ${api === "facilities" ? "Facilities" : "Benefits Intake"} API. Add VA_API_KEY to services/va-mcp/.env.`,
      );
    }
    return key;
  }

  /** Calls a VA API path on the sandbox host with the apikey header, rate limiting and 429/5xx retries. */
  async request(api: Api, path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("apikey", this.key(api));
    headers.set("Accept", "application/json");
    return this.send(`${this.config.baseUrl}${path}`, { ...init, headers });
  }

  /** Sends to a pre-signed upload URL from the VA. No apikey header: auth is in the URL. */
  async requestSigned(url: string, init: RequestInit): Promise<Response> {
    return this.send(url, init);
  }

  private async send(url: string, init: RequestInit): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
      await this.limiter.acquire();
      let res: Response;
      try {
        res = await this.fetch(url, init);
      } catch {
        if (attempt < this.maxRetries) {
          await this.sleep(backoffMs(attempt));
          continue;
        }
        throw new VaApiError("Couldn't reach the VA sandbox. Check the internet connection and try again.");
      }
      const retryable = res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504;
      if (retryable && attempt < this.maxRetries) {
        const retryAfter = Number(res.headers.get("retry-after"));
        await this.sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoffMs(attempt));
        continue;
      }
      return res;
    }
  }
}

export function backoffMs(attempt: number): number {
  return Math.min(8000, 500 * 2 ** attempt) + Math.floor(Math.random() * 200);
}

/** Maps a non-OK VA response to a plain-language error. */
export async function errorFor(res: Response, what: string): Promise<VaApiError> {
  switch (res.status) {
    case 401:
      return new VaApiError(`The VA sandbox didn't receive a valid API key for ${what}. Check VA_API_KEY in services/va-mcp/.env.`, 401);
    case 403:
      return new VaApiError(`The VA API key isn't approved for ${what}. Request sandbox access for that API on developer.va.gov.`, 403);
    case 404:
      return new VaApiError(`The VA sandbox couldn't find that ${what}.`, 404);
    case 413:
      return new VaApiError("The file is too large for the VA (limit 100 MB).", 413);
    case 429:
      return new VaApiError("The VA sandbox rate limit was reached. Wait a minute and try again.", 429);
    default:
      return new VaApiError(`The VA sandbox returned an error for ${what} (HTTP ${res.status}). Try again later.`, res.status);
  }
}
