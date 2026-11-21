import type { MiddlewareHandler } from "hono";

/**
 * Fixed-window, in-memory rate limit keyed by client address.
 * Fine for a single local process. In production this moves to API Gateway
 * throttling plus AWS WAF rate-based rules (see docs/architecture.md).
 */
export function rateLimit(opts: { windowMs: number; max: number; key: (c: Parameters<MiddlewareHandler>[0]) => string }): MiddlewareHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return async (c, next) => {
    const now = Date.now();
    const k = opts.key(c);
    let entry = hits.get(k);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      hits.set(k, entry);
    }
    entry.count++;
    if (hits.size > 10_000) {
      for (const [key, e] of hits) if (e.resetAt <= now) hits.delete(key);
    }
    if (entry.count > opts.max) {
      c.header("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return c.json({ error: "Too many questions in a short time. Please wait a minute and try again." }, 429);
    }
    await next();
  };
}
