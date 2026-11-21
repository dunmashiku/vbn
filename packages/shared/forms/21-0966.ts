/**
 * Plain-language prep guide for VA Form 21-0966 (Intent to File a Claim for Compensation and/or Pension,
 * or Survivors Pension and/or DIC). Built from the official form (VA Form 21-0966, MAY 2026).
 * The answers stay in the browser. Nothing here fills in, prepares for filing or submits the form.
 * SSN, VA file number, date of birth, service number and contact details are have-ready reminders only: never typed here.
 */
import type { PrepForm } from "../formPrep";

const YES_NO_UNSURE = ["Yes", "No", "Not sure"];

// VERIFY against va.gov before production
export const FORM_21_0966: PrepForm = {
  id: "21-0966",
  number: "VA Form 21-0966",
  title: "Intent to file a claim",
  heading: "Get ready to tell VA you plan to file",
  whenToUse: "Tells VA you plan to file, so a claim you complete within a year can count from an earlier date.",
  revision: "May 2026",
  aboutUrl: "https://www.va.gov/find-forms/about-form-21-0966/",
  pdfUrl: "https://www.vba.va.gov/pubs/forms/VBA-21-0966-ARE.pdf",
  pageImages: { 1: "/forms/21-0966/page-1.png", 2: "/forms/21-0966/page-2.png" },
  sections: [
    {
      id: "veteran",
      formSection: "Section I: Veteran's identification information",
      title: "About the veteran",
      intro:
        "This short form tells VA you plan to file. The form asks you to fill in as much as you can, because VA can't process it if it can't tell who the veteran or claimant is. Type the sensitive details only on the official form.",
      haveReady: [
        "Veteran's Social Security number (Item 2)",
        "VA file number, if the veteran has filed before (Item 4)",
        "Veteran's date of birth (Item 5)",
        "Veteran's service number, if there is one (Item 6)",
        "Mailing address, phone and email (Items 7 to 9)",
      ],
      questions: [
        { id: "filed-before", where: { page: 1, top: 29.4, bottom: 36.3 }, items: "Item 3", label: "Has the veteran ever filed a claim with VA?", help: "If yes, the form asks for the VA file number.", kind: "choice", options: YES_NO_UNSURE },
        { id: "contact-ok", where: { page: 1, top: 40.8, bottom: 57.2 }, items: "Items 7 to 9", label: "Is the veteran's mailing address, phone and email up to date where you'll copy them from?", help: "The form marks the address and email as \"if applicable.\" You'll type them on the official form, not here.", kind: "choice", options: ["Yes", "I need to check", "Not sure"] },
        { id: "email-ok", where: { page: 1, top: 50.5, bottom: 57.2 }, items: "Item 9", label: "Would the veteran like VA to send letters about this claim by email?", help: "There's a box next to the email address to agree to this.", kind: "choice", options: YES_NO_UNSURE },
      ],
    },
    {
      id: "claimant",
      formSection: "Section II: Claimant's identification information",
      title: "If you're not the veteran",
      intro: "The form says to fill in this section only if the claimant is not the veteran, for example a surviving spouse or child. If you are the veteran, you can skip it.",
      haveReady: [
        "Your Social Security number (Item 11)",
        "Your VA file number, if you've filed before (Item 13)",
        "Your date of birth (Item 15)",
        "Your mailing address, phone and email (Items 16 to 18)",
      ],
      questions: [
        { id: "who", where: { page: 1, top: 57.2, bottom: 95 }, items: "Items 10 to 18", label: "Are you the veteran, or someone else?", help: "Only fill in Section II if you're not the veteran.", kind: "choice", options: ["I'm the veteran", "I'm someone else", "Not sure"] },
        { id: "relationship", where: { page: 1, top: 70.2, bottom: 79 }, items: "Item 14", label: "Only if you're not the veteran: how are you related to the veteran?", help: "The form asks you to check one.", kind: "choice", options: ["Spouse", "Child", "Fiduciary", "Veteran service officer", "Alternate signer", "Third-party", "Other", "Not sure"] },
        { id: "claimant-filed-before", where: { page: 1, top: 64.6, bottom: 70.2 }, items: "Item 12", label: "Only if you're not the veteran: have you ever filed a claim with VA?", help: "If yes, the form asks for your VA file number.", kind: "choice", options: YES_NO_UNSURE },
        { id: "claimant-email-ok", where: { page: 1, top: 87.8, bottom: 95 }, items: "Item 18", label: "Only if you're not the veteran: would you like VA to send letters about this claim by email?", help: "There's a box next to your email address to agree to this.", kind: "choice", options: YES_NO_UNSURE },
      ],
    },
    {
      id: "benefits",
      formSection: "Section III: General benefit election",
      title: "Which benefits",
      intro:
        "The form says that if VA gets your completed application for a benefit you check here within one year of filing this form, the application counts as filed on the date VA received this form. Only the first completed application for each benefit gets that date. VA will send you the right application. For disability compensation, you can also apply online at VA.gov.",
      questions: [
        { id: "general-benefit", where: { page: 2, top: 9.6, bottom: 14.2 }, items: "Item 19", label: "Which benefits do you plan to file for?", help: "On the form, check every box that fits. The form says VA may not be able to use it to set an effective date if you don't check at least one. If you're unsure which fits, a free accredited representative can help.", kind: "choice", options: ["Compensation", "Pension", "Both compensation and pension", "Not sure"] },
        { id: "survivor-benefit", where: { page: 2, top: 14.2, bottom: 19.5 }, items: "Item 19", label: "Only if you're a surviving dependent of the veteran: are you filing for Survivors Pension and/or DIC (Dependency and Indemnity Compensation)?", help: "The form says to check this box only if you're a surviving dependent of the veteran.", kind: "choice", options: YES_NO_UNSURE },
      ],
    },
    {
      id: "sign",
      formSection: "Section IV: Declaration of intent and signature",
      title: "Signing",
      intro:
        "By signing, you say you understand this form is not a claim for benefits. You still need to file a complete application for each benefit, and VA must get it within one year of getting this form for the earlier date to count. You'll sign only on the official form.",
      questions: [
        { id: "signer", where: { page: 2, top: 42, bottom: 60.2 }, items: "Items 20 to 22", label: "Who will sign?", help: "The veteran, the claimant or an authorized person can sign. The form says a VSO, attorney or agent may complete it only if a valid power of attorney has been completed.", kind: "choice", options: ["I'll sign myself", "Someone will sign for me", "My VSO, attorney or agent", "Not sure"] },
      ],
    },
  ],
};
