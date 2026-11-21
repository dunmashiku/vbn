import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VaApiError } from "./client";

export const FIXTURES_DIR = fileURLToPath(new URL("../fixtures", import.meta.url));

/**
 * Reads a PDF from fixtures/ only. Rejects paths, traversal, symlinks out of
 * the folder and anything that isn't a PDF, so tools can never read other files.
 */
export async function readFixturePdf(name: string, dir = FIXTURES_DIR): Promise<{ name: string; bytes: Uint8Array<ArrayBuffer> }> {
  if (!/^[A-Za-z0-9._-]+\.pdf$/.test(name) || name.startsWith(".")) {
    throw new VaApiError("Only a PDF file name from the fixtures folder is allowed, for example sample-dd214-SAMPLE.pdf.");
  }
  let real: string;
  let realDir: string;
  try {
    realDir = await realpath(dir);
    real = await realpath(path.join(dir, name));
  } catch {
    throw new VaApiError(`There's no fixture named ${name}.`);
  }
  if (path.dirname(real) !== realDir) throw new VaApiError("Only files inside the fixtures folder are allowed.");
  const buf = await readFile(real);
  const bytes = new Uint8Array(new ArrayBuffer(buf.byteLength));
  bytes.set(buf);
  if (!(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46)) {
    throw new VaApiError(`${name} isn't a PDF.`);
  }
  return { name, bytes };
}
