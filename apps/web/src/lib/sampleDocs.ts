import { addDays, type DocumentId, type Intake, labelFor } from "@vbn/shared";
import type { StoredFile } from "./docStore";

/**
 * Clearly fake documents for the demo. Every page is watermarked SAMPLE and
 * uses an obviously fictional person. No real identifiers of any kind.
 */
interface SampleDef {
  docId: DocumentId;
  title: string;
  lines: (i: Intake) => string[];
}

const PERSON = "SAMPLE, JORDAN A.";

const SAMPLES: SampleDef[] = [
  {
    docId: "dd214",
    title: "SAMPLE DD-214 (Certificate of Release or Discharge from Active Duty)",
    lines: (i) => [
      "CERTIFICATE OF RELEASE OR DISCHARGE FROM ACTIVE DUTY (DD FORM 214) - SAMPLE",
      "THIS IS A FAKE DOCUMENT FOR DEMONSTRATION ONLY. NOT VALID FOR ANY PURPOSE.",
      "",
      `1. NAME: ${PERSON}`,
      `2. DEPARTMENT, COMPONENT AND BRANCH: ${labelFor.branch(i.branch).toUpperCase()} / REGULAR`,
      "3. SOCIAL SECURITY NUMBER: NOT SHOWN IN SAMPLE",
      "4.a GRADE, RATE OR RANK: SFC     4.b PAY GRADE: E-7",
      "12.a DATE ENTERED AD THIS PERIOD: 2006-08-14",
      `12.b SEPARATION DATE THIS PERIOD: ${i.separationDate}`,
      "12.c NET ACTIVE SERVICE THIS PERIOD: 20 YRS 10 MOS 06 DAYS",
      "13. DECORATIONS, MEDALS, BADGES: ARMY COMMENDATION MEDAL (2ND AWARD), ARMY ACHIEVEMENT MEDAL (3RD AWARD)",
      "14. MILITARY EDUCATION: BASIC LEADER COURSE, 2010; ADVANCED LEADER COURSE, 2014",
      `23. TYPE OF SEPARATION: ${i.separationType === "retirement" ? "RETIREMENT" : "DISCHARGE"}`,
      "24. CHARACTER OF SERVICE: HONORABLE",
      `25. SEPARATION AUTHORITY: SAMPLE REGULATION ${i.separationType === "retirement" ? "CHAPTER 12" : "CHAPTER 4"}`,
      "26. SEPARATION CODE: SAMPLE     27. REENTRY CODE: SAMPLE",
      `28. NARRATIVE REASON: ${i.separationType === "retirement" ? "SUFFICIENT SERVICE FOR RETIREMENT" : "COMPLETION OF REQUIRED ACTIVE SERVICE"}`,
    ],
  },
  {
    docId: "orders",
    title: "SAMPLE retirement or separation orders",
    lines: (i) => [
      `${i.separationType === "retirement" ? "RETIREMENT" : "SEPARATION"} ORDERS - SAMPLE`,
      "THIS IS A FAKE DOCUMENT FOR DEMONSTRATION ONLY. NOT VALID FOR ANY PURPOSE.",
      "",
      `ORDER NUMBER: SAMPLE-000-0001`,
      `THE FOLLOWING MEMBER, ${PERSON}, ${labelFor.branch(i.branch).toUpperCase()}, IS RELEASED FROM ACTIVE DUTY.`,
      `EFFECTIVE DATE: ${i.separationDate}`,
      `TRANSITION LEAVE BEGINS: ${addDays(i.separationDate, -60)}`,
      `HOME OF SELECTION: ${labelFor.state(i.state).toUpperCase()}`,
      `ACCOUNTING CLASSIFICATION: SAMPLE`,
      "FOR THE COMMANDER: SAMPLE SIGNATURE BLOCK",
    ],
  },
  {
    docId: "marriage-certificate",
    title: "SAMPLE marriage certificate",
    lines: () => [
      "CERTIFICATE OF MARRIAGE - SAMPLE",
      "THIS IS A FAKE DOCUMENT FOR DEMONSTRATION ONLY. NOT VALID FOR ANY PURPOSE.",
      "",
      `PARTY A: ${PERSON}`,
      "PARTY B: SAMPLE, ALEX R.",
      "DATE OF MARRIAGE: 2012-05-19",
      "PLACE OF MARRIAGE: SAMPLE COUNTY",
      "OFFICIANT: SAMPLE OFFICIANT",
      "FILED WITH: SAMPLE COUNTY CLERK, CERTIFICATE NO. SAMPLE-0000",
    ],
  },
  {
    docId: "dependent-birth-certificates",
    title: "SAMPLE birth certificate (dependent)",
    lines: () => [
      "CERTIFICATE OF LIVE BIRTH - SAMPLE",
      "THIS IS A FAKE DOCUMENT FOR DEMONSTRATION ONLY. NOT VALID FOR ANY PURPOSE.",
      "",
      "CHILD: SAMPLE, RILEY J.",
      "DATE OF BIRTH: 2015-09-03",
      "PLACE OF BIRTH: SAMPLE CITY",
      `PARENT: ${PERSON}`,
      "PARENT: SAMPLE, ALEX R.",
      "STATE FILE NUMBER: SAMPLE-0000",
    ],
  },
];

// ---- Minimal PDF writer (Helvetica text + diagonal SAMPLE watermark) ----

function pdfEscape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[^\x20-\x7e]/g, "?");
}

function wrap(line: string, max = 88): string[] {
  if (line.length <= max) return [line];
  const out: string[] = [];
  let cur = "";
  for (const word of line.split(" ")) {
    if ((cur + " " + word).trim().length > max) {
      out.push(cur.trim());
      cur = "   " + word;
    } else cur += " " + word;
  }
  if (cur.trim()) out.push(cur.trimEnd());
  return out;
}

function buildPdf(title: string, lines: string[]): Blob {
  const body: string[] = [];
  // Watermark
  const c = Math.cos(Math.PI / 5).toFixed(4);
  const s = Math.sin(Math.PI / 5).toFixed(4);
  body.push(`q 0.95 0.72 0.66 rg BT /F2 110 Tf ${c} ${s} -${s} ${c} 120 220 Tm (SAMPLE) Tj ET Q`);
  // Header band
  body.push("q 0.06 0.13 0.23 rg 0 752 612 40 re f Q");
  body.push(`BT 0.97 0.96 0.93 rg /F2 13 Tf 40 767 Td (${pdfEscape(title)}) Tj ET`);
  // Text
  let y = 720;
  body.push("0.08 0.13 0.18 rg");
  for (const raw of lines.flatMap((l) => wrap(l))) {
    body.push(`BT /F1 10.5 Tf 40 ${y} Td (${pdfEscape(raw)}) Tj ET`);
    y -= 17;
  }
  body.push(`BT 0.6 0.2 0.15 rg /F2 10 Tf 40 40 Td (SAMPLE - FOR DEMONSTRATION ONLY - CONTAINS NO REAL PERSONAL INFORMATION) Tj ET`);
  const stream = body.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

/** Builds sample files for the checklist items that apply to this person. */
export function buildSampleFiles(intake: Intake, applicable: DocumentId[]): StoredFile[] {
  return SAMPLES.filter((s) => applicable.includes(s.docId)).map((s) => {
    const lines = s.lines(intake);
    const blob = buildPdf(s.title, lines);
    return {
      docId: s.docId,
      name: `${s.docId}-SAMPLE.pdf`,
      type: "application/pdf",
      size: blob.size,
      addedAt: new Date().toISOString(),
      blob,
      sample: { title: s.title, text: lines.join("\n") },
    };
  });
}
