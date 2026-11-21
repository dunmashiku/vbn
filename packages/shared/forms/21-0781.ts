/**
 * Plain-language prep guide for VA Form 21-0781 (Statement in Support of Claimed Mental Health Disorder(s)
 * Due to an In-Service Traumatic Event(s)). Built from the official form (VA Form 21-0781, MAR 2024).
 * This form covers traumatic events, which can include military sexual trauma. Questions follow the form's own
 * items, ask for brief notes only and never suggest what events or symptoms to report.
 * The veteran's answers stay in their browser. Nothing here fills in, prepares for filing or submits the form.
 * SSN, VA file number, date of birth, service number, phone and email are have-ready reminders only.
 */
import type { PrepForm } from "../formPrep";

// VERIFY against va.gov before production
export const FORM_21_0781: PrepForm = {
  id: "21-0781",
  number: "VA Form 21-0781",
  title: "Statement about a traumatic event in service",
  heading: "Get ready for your mental health statement",
  whenToUse: "Optional statement that supports a mental health claim related to an event during service. Go at your own pace.",
  revision: "March 2024",
  aboutUrl: "https://www.va.gov/find-forms/about-form-21-0781/",
  pdfUrl: "https://www.vba.va.gov/pubs/forms/VBA-21-0781-ARE.pdf",
  pageImages: Object.fromEntries([3, 4, 5, 6, 7].map((n) => [n, `/forms/21-0781/page-${n}.png`])),
  sections: [
    {
      id: "identification",
      formSection: "Section I: Veteran/service member's identification information",
      title: "Before you start, and about you",
      intro:
        "This statement asks about hard experiences, so go at your own pace. You can stop any time, and write only as much as you're comfortable with. It's fine to leave details for your accredited representative or a Vet Center counselor to go over with you. The form itself is optional. If you need someone to talk to right now, the Veterans Crisis Line is there: dial 988 then press 1, text 838255, or chat at VeteransCrisisLine.net. This first part is just basic details VA uses to find your records.",
      haveReady: [
        "Social Security number (Item 2)",
        "VA file number, if you have one (Item 3)",
        "Date of birth (Item 4)",
        "Service number, if you have one (Item 5)",
        "Phone number and email, which is optional (Items 6 and 7)",
      ],
      questions: [
        {
          id: "contact-ok",
          where: { page: 3, top: 31, bottom: 41 },
          items: "Items 6 and 7",
          label: "Is your phone number and email up to date where you'll copy them from?",
          help: "Email is optional on the form. You'll type these on the official form, not here.",
          kind: "choice",
          options: ["Yes", "I need to check", "Not sure"],
        },
      ],
    },
    {
      id: "events",
      formSection: "Section II: Traumatic event(s) information",
      title: "The event or events",
      intro:
        "The form says this part is helpful but not required. Approximate dates and places are fine, and VA will still review your claim if you can't fill it in. Short notes are enough here.",
      questions: [
        {
          id: "event-type",
          where: { page: 3, top: 42.8, bottom: 53.2 },
          items: "Item 8",
          label: "Which of the form's event types does your statement cover?",
          help:
            "The form lets you check more than one. If you check the box for a personal event involving military sexual trauma (MST), the form points you to Section VI. You can also leave this for your representative.",
          kind: "choice",
          options: [
            "Combat traumatic event(s)",
            "Personal traumatic event(s), not involving MST",
            "Personal traumatic event(s), involving MST",
            "Other traumatic event(s)",
            "More than one of these",
            "Not sure",
            "I'd rather go over this with my representative",
          ],
        },
        {
          id: "event-notes",
          where: { page: 3, top: 71.8, bottom: 96.4 },
          items: "Items 9A to 9C",
          label: "Brief notes for each event, one per line: roughly what kind of event · where (unit, base or duty station) · about when",
          help:
            "Short notes are enough, and you don't have to relive details here. A few words, a place and a month or year are plenty. The form has room for up to six events. Naming other people isn't required, and the form says VA won't contact them.",
          kind: "long",
        },
      ],
    },
    {
      id: "additional",
      formSection: "Section III: Additional information associated with the in-service traumatic event(s)",
      title: "Other information that may help",
      intro:
        "The form notes that events in service often weren't reported or written down, and that's understood. These items help VA look for other records. All of them are optional.",
      questions: [
        {
          id: "changes",
          where: { page: 4, top: 30.1, bottom: 97 },
          items: "Items 10A to 10C",
          label: "For a personal traumatic event: any changes afterward you'd like to note, and about when (optional)",
          help:
            "The form has a checklist and space to add your own. Brief notes are fine, including any record that shows the change. The form says that if your event is combat only, you can skip to Item 11.",
          kind: "long",
        },
        {
          id: "report",
          where: { page: 5, top: 42.2, bottom: 59.9 },
          items: "Item 11",
          label: "Was an official report filed?",
          help:
            "If yes, the form asks which type of report, if you know. If you're not sure, the form says VA may send you a follow-up letter.",
          kind: "choice",
          options: ["Yes", "No", "Not sure", "I'd rather go over this with my representative"],
        },
        {
          id: "report-details",
          where: { page: 5, top: 42.2, bottom: 59.9 },
          items: "Item 11",
          label: "If a report was filed: what kind, and where, if you know (optional)",
          help:
            "The form lists restricted, unrestricted or neither (it notes those two options weren't available before 2005), a police report, or another report. A word or two is enough.",
          kind: "text",
        },
        {
          id: "sources",
          where: { page: 5, top: 59.9, bottom: 79.1 },
          items: "Item 12",
          label: "Who or what else might have information from that time? (optional)",
          help:
            "The form has a checklist of possible sources, such as people you knew then, counseling or health clinics, clergy, journals or reports, and a box for none. If someone wants to write a statement for you, the form points to VA Form 21-10210.",
          kind: "long",
        },
      ],
    },
    {
      id: "treatment",
      formSection: "Section IV: Treatment information",
      title: "Treatment",
      intro: "VA asks where you've been treated so it can request those records.",
      questions: [
        {
          id: "treated",
          where: { page: 5, top: 80.8, bottom: 97 },
          items: "Items 13A and 13B",
          label: "Have you received treatment related to the impact of the event or events?",
          help:
            "If yes, the form asks what kind of place: private provider, VA Vet Center, community care, VA medical center or clinic, or military treatment facility. For private or Vet Center records, VA needs your consent on VA Forms 21-4142 and 21-4142a.",
          kind: "choice",
          options: ["Yes", "No", "Not sure"],
        },
        {
          id: "facilities",
          where: { page: 6, top: 6.5, bottom: 25.2 },
          items: "Items 13C to 13E",
          label: "Where were you treated, and about when? (name and city of each place, month and year if you know)",
          help:
            "Approximate dates are fine, and there's a box if you don't have dates. If VA or military treatment began in 2005 or later, the form says you don't need dates.",
          kind: "long",
        },
      ],
    },
    {
      id: "remarks",
      formSection: "Section V: Remarks",
      title: "Anything else",
      intro: "The form says this section is optional and can be left blank.",
      questions: [
        {
          id: "remarks",
          where: { page: 6, top: 25.2, bottom: 60.5 },
          items: "Item 14",
          label: "Anything else you'd like VA to know (optional)",
          help: "Use this if you ran out of room in an earlier item. Short notes are enough.",
          kind: "long",
        },
      ],
    },
    {
      id: "vha-notice",
      formSection:
        "Section VI: Option for Veterans Benefits Administration (VBA) to notify Veterans Health Administration (VHA) about certain upcoming events during the claim and/or appeal process",
      title: "A notice to VA health care (MST claims only)",
      intro: "This section only applies if you checked the box for a personal traumatic event involving MST in Item 8.",
      questions: [
        {
          id: "vha-notice",
          where: { page: 6, top: 60.5, bottom: 89.3 },
          items: "Item 15",
          label: "Would you like VA benefits staff to let VA health care know about upcoming claim events?",
          help:
            "If you're enrolled in VA health care, you can choose whether your VA medical record shows a notice when you have a scheduled exam, Board hearing or decision. It shows only the type of event and timing, not claim details, though providers may know it relates to an MST claim. Your choice won't affect your claim, and you can change it any time.",
          kind: "choice",
          options: [
            "Yes, I consent",
            "No, I don't consent",
            "I want to take back consent I gave before",
            "Not applicable, or not enrolled in VA health care",
            "Not sure yet",
          ],
        },
      ],
    },
    {
      id: "signature",
      formSection: "Sections VII to X: Certification and signature",
      title: "Signing",
      intro: "You'll sign only on the official form or VA.gov.",
      haveReady: ["If you sign with an \"X\": two witnesses, who sign and print their name and address on the form (Items 17A to 18B)"],
      questions: [
        {
          id: "signer",
          where: { page: 6, top: 89.3, bottom: 97 },
          items: "Items 16A to 20D",
          label: "Who will sign?",
          help:
            "If someone signs for you, the form needs VA Form 21-0972 on record. A representative can sign only with VA Form 21-22 or 21-22a on record.",
          kind: "choice",
          options: ["I'll sign myself", "Someone will sign for me", "My representative will sign", "Not sure"],
        },
      ],
    },
  ],
};
