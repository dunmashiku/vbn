/**
 * Timeline milestone rules.
 *
 * Reviewers: this is the only file you need to edit to change what appears on
 * a person's timeline. Day offsets are relative to the separation/retirement
 * date: negative = before, positive = after.
 *
 *  - opensDays: when the window opens (we start showing it as "due soon")
 *  - dueDays:   the target deadline (after this it shows as "overdue")
 *
 * A milestone can have one window for everyone, or a different window for
 * retirement vs. separation.
 */
import type { AppliesWhen } from "./conditions";
import type { SeparationType } from "./intake";

export type MilestoneId =
  | "tap"
  | "bdd"
  | "sbp"
  | "health"
  | "dd214-review"
  | "education"
  | "vgli"
  | "state-benefits";

export interface DayWindow {
  opensDays: number;
  dueDays: number;
  /** Plain-language description of the window, shown under the dates. */
  label: string;
}

export interface Source {
  label: string;
  url: string;
}

export interface MilestoneRule {
  id: MilestoneId;
  title: string;
  /** Short name used in links and the document checklist. */
  shortTitle: string;
  window: DayWindow | Record<SeparationType, DayWindow>;
  appliesWhen?: AppliesWhen;
  /** Two plain-language sentences. */
  explanation: string;
  /** First source is the primary "Learn more" link. */
  sources: [Source, ...Source[]];
}

export const MILESTONES: MilestoneRule[] = [
  {
    // VERIFY against va.gov before production
    id: "tap",
    title: "Begin the Transition Assistance Program (TAP)",
    shortTitle: "Transition Assistance Program",
    window: {
      retirement: { opensDays: -730, dueDays: -365, label: "Start about 24 months before retirement, and no later than 12 months before." },
      separation: { opensDays: -365, dueDays: -365, label: "Start no later than 12 months before separation." },
    },
    explanation:
      "TAP is the required program that walks you through benefits, employment and financial planning before you leave. Starting early gives you time to act on what you learn, including the VA benefits briefings.",
    sources: [
      { label: "VA: Transition Assistance Program", url: "https://www.benefits.va.gov/transition/tap.asp" },
      { label: "DoD TAP", url: "https://www.dodtap.mil/" },
    ],
  },
  {
    // VERIFY against va.gov before production
    id: "bdd",
    title: "File a VA disability claim through Benefits Delivery at Discharge (BDD)",
    shortTitle: "VA disability claim (BDD)",
    window: { opensDays: -180, dueDays: -90, label: "File between 180 and 90 days before you leave service." },
    appliesWhen: { serviceConnected: ["yes", "not-sure"] },
    explanation:
      "BDD lets you file a disability claim before you leave, so a decision can come soon after separation. You need to be available for exams during the 45 days after you file, and a free accredited representative can help you file.",
    sources: [
      { label: "VA.gov: Pre-discharge claim (BDD)", url: "https://www.va.gov/disability/how-to-file-claim/when-to-file/pre-discharge-claim/" },
      { label: "VA.gov: Find an accredited representative", url: "https://www.va.gov/get-help-from-accredited-representative/find-rep/" },
    ],
  },
  {
    // VERIFY against va.gov before production
    id: "sbp",
    title: "Make your Survivor Benefit Plan (SBP) election",
    shortTitle: "Survivor Benefit Plan",
    window: { opensDays: -180, dueDays: -1, label: "Decide before your retirement date. The choice is hard to change later." },
    appliesWhen: { separationType: ["retirement"] },
    explanation:
      "SBP pays a monthly annuity to an eligible survivor after a retiree's death, in exchange for a monthly premium from retired pay. A married retiree's spouse generally must consent in writing to anything less than full coverage, so talk it through with your retirement services officer early.",
    sources: [
      { label: "DoD: Survivor Benefit Plan", url: "https://militarypay.defense.gov/Benefits/Survivor-Benefit-Program/" },
    ],
  },
  {
    // VERIFY against va.gov before production
    id: "health",
    title: "Decide on health coverage: TRICARE and VA health care",
    shortTitle: "Health coverage",
    window: {
      retirement: { opensDays: -90, dueDays: 90, label: "Enroll in a TRICARE retiree plan within 90 days after retirement." },
      separation: { opensDays: -90, dueDays: 0, label: "Plan before your last day; transitional coverage may apply for a limited time." },
    },
    explanation:
      "Your active-duty coverage ends when you leave, so you need to choose what comes next for you and your family. Retirees must enroll in a TRICARE plan to keep coverage, and you can also apply for VA health care, which is a separate program.",
    sources: [
      { label: "VA.gov: Apply for VA health care", url: "https://www.va.gov/health-care/how-to-apply/" },
      { label: "TRICARE: Retiring", url: "https://www.tricare.mil/LifeEvents/Retiring" },
      { label: "TRICARE: Separating", url: "https://www.tricare.mil/LifeEvents/Separating" },
    ],
  },
  {
    // VERIFY against va.gov before production
    id: "dd214-review",
    title: "Review your DD-214 for accuracy",
    shortTitle: "DD-214 review",
    window: { opensDays: -30, dueDays: 30, label: "Review the draft before you sign, and your copy right after separation." },
    explanation:
      "Your DD-214 is the main proof of service for almost every veteran benefit. Errors in dates, awards or character of service are much easier to fix before you leave than after.",
    sources: [
      { label: "VA.gov: Get your military records", url: "https://www.va.gov/records/get-military-service-records/" },
    ],
  },
  {
    // VERIFY against va.gov before production
    id: "education",
    title: "Plan education benefits and any GI Bill transfer",
    shortTitle: "Education and GI Bill",
    window: { opensDays: -365, dueDays: -1, label: "A GI Bill transfer to dependents must be approved while you are still serving." },
    explanation:
      "Check which education benefits you have earned, such as the Post-9/11 GI Bill, and how long you have to use them. If you want to transfer benefits to a spouse or child, that request must be approved before you leave and usually requires additional service, so ask your education office early.",
    sources: [
      { label: "VA.gov: Transfer Post-9/11 GI Bill benefits", url: "https://www.va.gov/education/transfer-post-9-11-gi-bill-benefits/" },
      { label: "VA.gov: Education and training", url: "https://www.va.gov/education/" },
    ],
  },
  {
    // VERIFY against va.gov before production
    id: "vgli",
    title: "Apply for Veterans' Group Life Insurance (VGLI)",
    shortTitle: "Life insurance (VGLI)",
    window: { opensDays: 0, dueDays: 240, label: "Apply within 240 days after separation to skip health questions." },
    explanation:
      "Your SGLI coverage ends 120 days after you leave service, and VGLI lets you keep life insurance as a veteran. If you apply within 240 days you generally won't need to prove good health.",
    sources: [
      { label: "VA.gov: Veterans' Group Life Insurance", url: "https://www.va.gov/life-insurance/options-eligibility/vgli/" },
    ],
  },
  {
    // VERIFY against va.gov before production
    id: "state-benefits",
    title: "Check your state's veteran benefits",
    shortTitle: "State veteran benefits",
    window: { opensDays: 0, dueDays: 180, label: "In your first months after service." },
    explanation:
      "Many states offer their own benefits, such as property tax relief, tuition help, license fee waivers and veteran hiring preference. Your state veterans affairs office can tell you what you qualify for and help with paperwork for free.",
    sources: [
      { label: "VA.gov: State veterans affairs offices", url: "https://www.va.gov/statedva.htm" },
    ],
  },
];

export function windowFor(rule: MilestoneRule, type: SeparationType): DayWindow {
  return "opensDays" in rule.window ? rule.window : rule.window[type];
}
