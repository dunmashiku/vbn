/**
 * Logs go to stderr (stdout carries the MCP protocol). Tool name, duration and
 * status only: never inputs, document contents, URLs or personal data.
 */
export function logTool(tool: string, ms: number, status: "ok" | "error" | "refused") {
  process.stderr.write(`[va-mcp] tool=${tool} status=${status} ms=${ms}\n`);
}

export async function timed<T>(tool: string, fn: () => Promise<T>, isError: (r: T) => boolean): Promise<T> {
  const start = Date.now();
  try {
    const r = await fn();
    logTool(tool, Date.now() - start, isError(r) ? "error" : "ok");
    return r;
  } catch (e) {
    logTool(tool, Date.now() - start, "error");
    throw e;
  }
}
