/**
 * Document checklist rules.
 *
 * handling:
 *  - "upload":     the person may attach a copy in their browser to stay organized.
 *  - "have-ready": reminder only. Nothing is uploaded, typed or stored, ever.
 *
 * The app never submits anything to the VA. The veteran uploads documents
 * themselves on VA.gov or gives them to their free accredited representative.
 */
import type { AppliesWhen } from "./conditions";
import type { MilestoneId } from "./milestones";

export type DocumentId =
  | "dd214"
  | "medical-records"
  | "orders"
  | "marriage-certificate"
  | "dependent-birth-certificates"
  | "divorce-decree"
  | "ssn"
  | "bank-info";

export type DocumentHandling = "upload" | "have-ready";

export interface DocumentRule {
  id: DocumentId;
  name: string;
  /** Plain short name for compact lists (timeline cards), in words service members already use. The full name shows on My documents. */
  shortName: string;
  milestones: MilestoneId[];
  appliesWhen?: AppliesWhen;
  why: string;
  whereToGet: { label: string; url: string };
  handling: DocumentHandling;
}

export const DOCUMENTS: DocumentRule[] = [
  {
    // VERIFY against va.gov before production
    id: "dd214",
    name: "DD-214 (Certificate of Release or Discharge from Active Duty)",
    shortName: "DD-214",
    milestones: ["dd214-review", "bdd", "health", "vgli", "education", "state-benefits"],
    why: "Proof of your service, needed for most VA and state benefits. You receive it at separation.",
    whereToGet: { label: "VA.gov: Get your military records", url: "https://www.va.gov/records/get-military-service-records/" },
    handling: "upload",
  },
  {
    // VERIFY against va.gov before production
    id: "medical-records",
    name: "Service treatment records and any private medical records",
    shortName: "Service treatment records",
    milestones: ["bdd"],
    appliesWhen: { serviceConnected: ["yes", "not-sure"] },
    why: "Supports a disability claim by showing a condition began or got worse during service.",
    whereToGet: { label: "VA.gov: Evidence for a disability claim", url: "https://www.va.gov/disability/how-to-file-claim/evidence-needed/" },
    handling: "upload",
  },
  {
    // VERIFY against va.gov before production
    id: "orders",
    name: "Retirement or separation orders",
    shortName: "Retirement or separation orders",
    milestones: ["health", "sbp"],
    why: "Used to set up retiree health coverage and retired pay, and to confirm your separation date.",
    whereToGet: { label: "milConnect (DMDC)", url: "https://milconnect.dmdc.osd.mil/" },
    handling: "upload",
  },
  {
    // VERIFY against va.gov before production
    id: "marriage-certificate",
    name: "Marriage certificate",
    shortName: "Marriage certificate",
    milestones: ["sbp", "health", "bdd"],
    appliesWhen: { maritalStatus: ["married"] },
    why: "Used to add your spouse for dependent benefits and for the Survivor Benefit Plan.",
    whereToGet: { label: "CDC: Where to write for vital records", url: "https://www.cdc.gov/nchs/w2w/index.htm" },
    handling: "upload",
  },
  {
    // VERIFY against va.gov before production
    id: "dependent-birth-certificates",
    name: "Birth or adoption certificates for dependents",
    shortName: "Birth or adoption certificates",
    milestones: ["health", "bdd", "education"],
    appliesWhen: { hasDependents: true },
    why: "Used to add children to health coverage, disability compensation and any GI Bill transfer.",
    whereToGet: { label: "CDC: Where to write for vital records", url: "https://www.cdc.gov/nchs/w2w/index.htm" },
    handling: "upload",
  },
  {
    // VERIFY against va.gov before production
    id: "divorce-decree",
    name: "Divorce decree from any prior marriage",
    shortName: "Divorce decree",
    milestones: ["sbp", "bdd"],
    appliesWhen: { hasDivorce: true },
    why: "Shows a prior marriage legally ended, which affects dependent benefits and survivor elections.",
    whereToGet: { label: "CDC: Where to write for vital records", url: "https://www.cdc.gov/nchs/w2w/index.htm" },
    handling: "upload",
  },
  {
    // VERIFY against va.gov before production
    id: "ssn",
    name: "Social Security numbers for you and your dependents",
    shortName: "Social Security numbers",
    milestones: ["bdd", "health", "vgli"],
    why: "Requested on most benefit applications. Have them ready, but never type them here.",
    whereToGet: { label: "SSA: Social Security card", url: "https://www.ssa.gov/number-card" },
    handling: "have-ready",
  },
  {
    // VERIFY against va.gov before production
    id: "bank-info",
    name: "Bank routing and account numbers for direct deposit",
    shortName: "Direct deposit details",
    milestones: ["bdd"],
    why: "VA pays benefits by direct deposit. Have the numbers ready when you apply, but never type them here.",
    whereToGet: { label: "VA.gov: Direct deposit", url: "https://www.va.gov/change-direct-deposit/" },
    handling: "have-ready",
  },
];
