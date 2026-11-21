import { fileURLToPath } from "node:url";

/** The only host this server will talk to. Production VA access needs VA review first. */
export const SANDBOX_HOST = "sandbox-api.va.gov";
export const DEFAULT_BASE_URL = `https://${SANDBOX_HOST}`;

export interface VaConfig {
  baseUrl: string;
  /** Facilities API key. Falls back to VA_API_KEY. */
  facilitiesKey: string | null;
  /** Benefits Intake API key. Falls back to VA_API_KEY. */
  intakeKey: string | null;
}

export class ConfigError extends Error {}

/** Load services/va-mcp/.env if present (Node's built-in loader). */
export function loadDotEnv() {
  try {
    process.loadEnvFile(fileURLToPath(new URL("../.env", import.meta.url)));
  } catch {
    // No .env: use the real environment.
  }
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): VaConfig {
  const raw = (env.VA_API_BASE_URL ?? "").trim() || DEFAULT_BASE_URL;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ConfigError(`VA_API_BASE_URL is not a valid URL. Use ${DEFAULT_BASE_URL}.`);
  }
  if (url.protocol !== "https:" || url.hostname !== SANDBOX_HOST) {
    throw new ConfigError(
      `Refusing to start: VA_API_BASE_URL must be the VA sandbox (${DEFAULT_BASE_URL}). ` +
        `Got host "${url.hostname}". Production VA APIs require VA review and approval.`,
    );
  }
  const shared = env.VA_API_KEY?.trim() || null;
  return {
    baseUrl: url.origin,
    facilitiesKey: env.VA_FACILITIES_API_KEY?.trim() || shared,
    intakeKey: env.VA_BENEFITS_INTAKE_API_KEY?.trim() || shared,
  };
}
