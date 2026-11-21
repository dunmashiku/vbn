import type { StoredFile } from "./docStore";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

const SIGNATURES: { type: StoredFile["type"]; bytes: number[]; exts: string[] }[] = [
  { type: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46, 0x2d], exts: ["pdf"] }, // %PDF-
  { type: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], exts: ["png"] },
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff], exts: ["jpg", "jpeg"] },
];

export type FileCheck = { ok: true; type: StoredFile["type"] } | { ok: false; error: string };

/** Checks size, then the file's magic bytes (not just its extension or reported type). */
export async function checkFile(file: File): Promise<FileCheck> {
  if (file.size === 0) return { ok: false, error: "That file is empty." };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: "That file is larger than 10 MB. Try a smaller scan or photo." };
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const match = SIGNATURES.find((s) => s.bytes.every((b, i) => head[i] === b));
  if (!match) return { ok: false, error: "Only PDF, JPG and PNG files can be attached." };
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!match.exts.includes(ext)) {
    return { ok: false, error: `This file's contents don't match its .${ext || "?"} extension. Only real PDF, JPG and PNG files can be attached.` };
  }
  return { ok: true, type: match.type };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
