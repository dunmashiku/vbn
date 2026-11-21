/**
 * Plain-language prep guide for VA Form 21-526EZ (Application for Disability Compensation).
 * Built from the official form (VA Form 21-526EZ, JAN 2026) and VA.gov's "How to file a VA disability claim".
 * The veteran's answers stay in their browser. Nothing here fills in, prepares for filing or submits the form.
 * SSN, VA file number, date of birth and bank details are have-ready reminders only: never typed here.
 */
import { FORM_10_10EZ } from "./forms/10-10ez";
import { FORM_21_0781 } from "./forms/21-0781";
import { FORM_21_0966 } from "./forms/21-0966";

// VERIFY against va.gov before production
export const FORM_526EZ_SOURCE = {
  form: "VA Form 21-526EZ",
  revision: "January 2026",
  aboutUrl: "https://www.va.gov/find-forms/about-form-21-526ez/",
  pdfUrl: "https://www.vba.va.gov/pubs/forms/VBA-21-526EZ-ARE.pdf",
  howToFileUrl: "https://www.va.gov/disability/how-to-file-claim/",
  evidenceUrl: "https://www.va.gov/disability/how-to-file-claim/evidence-needed/",
  representativeUrl: "https://www.va.gov/get-help-from-accredited-representative/find-rep/",
} as const;

export type PrepQuestionKind = "text" | "long" | "choice";

export interface PrepQuestion {
  id: string;
  /** Item numbers on the official form, e.g. "Item 16". */
  items: string;
  label: string;
  help: string;
  kind: PrepQuestionKind;
  options?: string[];
  /** Where the item sits on the official form: page number and top/bottom as % of page height. */
  where?: { page: number; top: number; bottom: number };
}

export interface PrepSection {
  id: string;
  /** Section name as printed on the official form. */
  formSection: string;
  title: string;
  intro: string;
  /** Things to have ready but never type into this app. */
  haveReady?: string[];
  questions: PrepQuestion[];
}

const YES_NO_UNSURE = ["Yes", "No", "Not sure"];

// VERIFY against va.gov before production
export const FORM_526EZ_SECTIONS: PrepSection[] = [
  {
    id: "claim-type",
    formSection: "Item 1",
    title: "Which kind of claim",
    intro: "The form starts by asking how VA should process your claim.",
    questions: [
      {
        id: "process",
        where: { page: 9, top: 16.5, bottom: 26 },
        items: "Item 1",
        label: "Which process fits you?",
        help:
          "BDD (pre-discharge) is only for service members with 180 to 90 days left on active duty who can attend VA exams within 45 days of filing. IDES is only if your service referred you to it. If you're unsure, ask your representative.",
        kind: "choice",
        options: ["Standard claim", "Fully Developed Claim (FDC)", "BDD (pre-discharge)", "IDES (referred by my service)", "Not sure"],
      },
    ],
  },
  {
    id: "identification",
    formSection: "Section I: Veteran's identification information",
    title: "About you",
    intro: "Basic details VA uses to find your records. Type the sensitive ones only on the official form.",
    haveReady: ["Social Security number (Item 3)", "VA file number, if you've filed before (Item 5)", "Date of birth (Item 6)", "Service number or DoD ID (Item 7)"],
    questions: [
      { id: "filed-before", where: { page: 9, top: 36.2, bottom: 41 }, items: "Item 4", label: "Have you ever filed a claim with VA?", help: "If yes, the form asks for your VA file number.", kind: "choice", options: YES_NO_UNSURE },
      { id: "release-date", where: { page: 9, top: 45.3, bottom: 52 }, items: "Item 8", label: "BDD only: your date, or expected date, of release from active duty", help: "Leave blank if you've already separated.", kind: "text" },
      { id: "mailing-ok", where: { page: 9, top: 45.3, bottom: 67.5 }, items: "Items 9 to 11", label: "Is your current mailing address, phone and email up to date where you'll copy them from?", help: "Phone and email are optional on the form. You'll type them on the official form, not here.", kind: "choice", options: ["Yes", "I need to check", "Not sure"] },
    ],
  },
  {
    id: "housing",
    formSection: "Sections II and III: Change of address and homeless information",
    title: "Address changes and housing",
    intro: "Only answer these if they apply. If you're homeless or at risk, VA asks so it can reach you.",
    questions: [
      { id: "moving", where: { page: 9, top: 73.5, bottom: 96 }, items: "Items 13A to 13C", label: "Are you moving, temporarily or permanently?", help: "If yes, the form asks for the new address and the dates.", kind: "choice", options: ["No", "Yes, temporarily", "Yes, permanently"] },
      { id: "homeless", where: { page: 10, top: 8.4, bottom: 33.8 }, items: "Items 14A to 14F", label: "Are you homeless or at risk of becoming homeless?", help: "If yes, the form asks about your living situation and someone VA can contact to reach you.", kind: "choice", options: ["No", "Yes, homeless", "Yes, at risk", "Prefer to discuss with my representative"] },
    ],
  },
  {
    id: "exposure",
    formSection: "Section IV: Exposure information",
    title: "Toxic exposures",
    intro: "The PACT Act covers many conditions linked to burn pits, Agent Orange and other exposures.",
    questions: [
      { id: "toxic", where: { page: 10, top: 35.5, bottom: 41.2 }, items: "Item 15A", label: "Are you claiming any conditions related to toxic exposures?", help: "Examples: burn pits, Agent Orange, contaminated water at Camp Lejeune, asbestos, radiation.", kind: "choice", options: YES_NO_UNSURE },
      { id: "locations", where: { page: 10, top: 41.2, bottom: 79.2 }, items: "Items 15B to 15E", label: "Where and roughly when were you exposed? (month and year is enough)", help: "The form lists Gulf War and herbicide locations and asks for approximate dates. Write what you remember.", kind: "long" },
    ],
  },
  {
    id: "conditions",
    formSection: "Section V: Claim information",
    title: "Your conditions",
    intro: "This is the heart of the claim. For each condition, VA asks what it is, what caused it, how it relates to service and about when it began.",
    questions: [
      {
        id: "conditions",
        where: { page: 11, top: 6.4, bottom: 58.5 },
        items: "Item 16",
        label: "List each condition, one per line: what it is · what happened · about when it started",
        help: "The form's own example: \"Hearing loss · noise, heavy equipment operator in service · July 1968\". Symptoms are fine if you don't have a diagnosis.",
        kind: "long",
      },
      { id: "treatment", where: { page: 11, top: 58.4, bottom: 80.8 }, items: "Item 17", label: "Where were you treated for these after discharge? (VA medical centers or military treatment facilities, and about when)", help: "If treatment started in 2005 or later, the form says you don't need the dates.", kind: "long" },
      {
        id: "extra-forms",
        where: { page: 11, top: 80.6, bottom: 97 },
        items: "Note after Item 17",
        label: "Does any of this apply? (the form asks for an extra form for each)",
        help: "Mental health condition: VA Form 21-0781. Can't work because of disability: 21-8940 and 21-4192. Adding dependents: 21-686c. Your representative can help with these.",
        kind: "long",
      },
    ],
  },
  {
    id: "service",
    formSection: "Section VI: Service information",
    title: "Your service",
    intro: "Your DD-214 has most of these answers.",
    questions: [
      { id: "branch", where: { page: 12, top: 10, bottom: 17.5 }, items: "Items 19A and 19B", label: "Branch and component", help: "For example: Army, Active. Or Navy, Reserves.", kind: "text" },
      { id: "dates", where: { page: 12, top: 17.4, bottom: 30.5 }, items: "Items 20A and 20D", label: "Most recent active service dates, and any other periods", help: "Copy them from your DD-214.", kind: "text" },
      { id: "separation-place", where: { page: 12, top: 17.4, bottom: 25 }, items: "Item 20B", label: "Place of last or expected separation", help: "The base or installation.", kind: "text" },
      { id: "combat", where: { page: 12, top: 24.8, bottom: 30.5 }, items: "Item 20C", label: "Did you serve in a combat zone since 9-11-2001?", help: "", kind: "choice", options: YES_NO_UNSURE },
      { id: "guard-reserve", where: { page: 12, top: 30.5, bottom: 51.2 }, items: "Items 21A to 22C", label: "Have you served in the Reserves or National Guard, or are you on federal orders now?", help: "If yes, the form asks for your unit and obligation dates.", kind: "choice", options: YES_NO_UNSURE },
      { id: "other-name", where: { page: 12, top: 6.4, bottom: 10.2 }, items: "Items 18A and 18B", label: "Did you serve under another name?", help: "", kind: "choice", options: ["No", "Yes"] },
    ],
  },
  {
    id: "pay",
    formSection: "Section VII: Service pay",
    title: "Retired, separation and severance pay",
    intro: "These answers can change how VA pays you, so they're worth going over with your representative.",
    questions: [
      { id: "retired-pay", where: { page: 12, top: 64, bottom: 97 }, items: "Items 24A to 25", label: "Do you receive, or will you receive, military retired pay?", help: "The form explains that retired pay may be reduced by the VA compensation awarded, unless you qualify for concurrent receipt. Item 26 is a box to decline VA compensation: talk to your representative before checking it.", kind: "choice", options: YES_NO_UNSURE },
      { id: "separation-pay", where: { page: 13, top: 10.4, bottom: 20 }, items: "Items 27A to 27D", label: "Have you received separation pay, disability severance pay or another lump sum?", help: "If yes, the form asks for the date and pre-tax amount. VA may withhold compensation to recoup it.", kind: "choice", options: YES_NO_UNSURE },
    ],
  },
  {
    id: "deposit-sign",
    formSection: "Sections VIII to XII: Direct deposit and signature",
    title: "Direct deposit and signing",
    intro: "You'll enter bank details and sign only on the official form or VA.gov.",
    haveReady: ["Bank routing and account number, or know if you're already enrolled (Items 29 to 32)"],
    questions: [
      { id: "signer", where: { page: 13, top: 78, bottom: 97 }, items: "Items 33 to 37", label: "Who will sign?", help: "If someone signs for you, the form needs VA Form 21-0972 on record. A representative can sign some claims only with VA Form 21-22 or 21-22a on record.", kind: "choice", options: ["I'll sign myself", "Someone will sign for me", "Not sure"] },
    ],
  },
];

export interface PrepForm {
  /** URL id, e.g. "21-526ez". */
  id: string;
  number: string;
  title: string;
  /** Page heading, e.g. "Get ready for your disability claim". Defaults to "Prepare your <number>". */
  heading?: string;
  /** One line for the forms list: when you'd use this form. */
  whenToUse?: string;
  revision: string;
  aboutUrl: string;
  pdfUrl: string;
  /** Rendered pages of the official form (seals and logos covered), keyed by page number. */
  pageImages: Record<number, string>;
  sections: PrepSection[];
}

export const FORM_526EZ: PrepForm = {
  id: "21-526ez",
  number: "VA Form 21-526EZ",
  title: "Application for disability compensation",
  heading: "Get ready for your disability claim",
  whenToUse: "The main claim form for VA disability compensation.",
  revision: FORM_526EZ_SOURCE.revision,
  aboutUrl: FORM_526EZ_SOURCE.aboutUrl,
  pdfUrl: FORM_526EZ_SOURCE.pdfUrl,
  pageImages: Object.fromEntries([9, 10, 11, 12, 13].map((n) => [n, `/forms/21-526ez/page-${n}.png`])),
  sections: FORM_526EZ_SECTIONS,
};

/** Every form with a prep guide. Add a form by writing its sections and rendering its pages. */
export const PREP_FORMS: PrepForm[] = [FORM_526EZ, FORM_21_0966, FORM_10_10EZ, FORM_21_0781];
export const prepFormById = (id: string) => PREP_FORMS.find((f) => f.id === id);

export type PrepAnswers = Record<string, string>;

export const prepQuestionCount = (form: PrepForm = FORM_526EZ) => form.sections.reduce((n, s) => n + s.questions.length, 0);

export const answeredCount = (answers: PrepAnswers, form: PrepForm = FORM_526EZ) =>
  form.sections.reduce((n, s) => n + s.questions.filter((q) => answers[`${s.id}.${q.id}`]?.trim()).length, 0);
