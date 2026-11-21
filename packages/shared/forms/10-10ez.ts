/**
 * Plain-language prep guide for VA Form 10-10EZ (Application for Health Benefits).
 * Built from the official form (VA Form 10-10EZ, FEB 2025) and its printed instructions.
 * The veteran's answers stay in their browser. Nothing here fills in, prepares for filing or submits the form.
 * SSNs, dates of birth, contact details, insurance and Medicare numbers and all dollar amounts are
 * have-ready reminders only: never typed here.
 */
import type { PrepForm } from "../formPrep";

const YES_NO_UNSURE = ["Yes", "No", "Not sure"];

// VERIFY against va.gov before production
export const FORM_10_10EZ: PrepForm = {
  id: "10-10ez",
  number: "VA Form 10-10EZ",
  title: "Application for health benefits",
  heading: "Get ready to apply for VA health care",
  whenToUse: "Applies for VA health care enrollment or registration.",
  revision: "February 2025",
  aboutUrl: "https://www.va.gov/find-forms/about-form-10-10ez/",
  pdfUrl: "https://www.va.gov/vaforms/medical/pdf/VA%20Form%2010-10EZ.pdf",
  pageImages: Object.fromEntries([4, 5, 6].map((n) => [n, `/forms/10-10ez/page-${n}.png`])),
  sections: [
    {
      id: "general",
      formSection: "Section I: General information",
      title: "About you",
      intro: "Every applicant fills in Sections I to III. Type the sensitive details only on the official form.",
      haveReady: [
        "Mother's maiden name (Section I, Item 2)",
        "Social Security number (Section I, Item 5)",
        "Date and place of birth (Section I, Items 6A and 6B)",
        "Mailing and home address, phone numbers and email (Section I, Items 9A to 10E)",
        "Names, addresses and phone numbers for your next of kin and emergency contact (Section I, Items 12A to 13B)",
      ],
      questions: [
        {
          id: "benefit-type",
          where: { page: 4, top: 18.8, bottom: 23.8 },
          items: "Type of benefit(s) applying for",
          label: "Are you applying for enrollment or registration?",
          help:
            "Enrollment is for the full VA medical benefits package. Registration is for care VA can give without enrollment, like care for a VA-rated service-connected disability, a rating of 50% or more, or military sexual trauma (MST). The form lists them all. Registration only needs Sections I to III. If you're unsure, ask your VA enrollment coordinator or a representative.",
          kind: "choice",
          options: ["Enrollment", "Registration", "Not sure"],
        },
        {
          id: "contact-ok",
          where: { page: 4, top: 36.9, bottom: 47.6 },
          items: "Items 9A to 10E",
          label: "Are your mailing address, home address, phone and email up to date where you'll copy them from?",
          help: "Phone numbers and email are optional on the form. You'll type them on the official form, not here.",
          kind: "choice",
          options: ["Yes", "I need to check", "Not sure"],
        },
        {
          id: "marital",
          where: { page: 4, top: 47.6, bottom: 51.4 },
          items: "Item 11",
          label: "What is your current marital status?",
          help: "Pick the one that fits today.",
          kind: "choice",
          options: ["Married", "Never married", "Separated", "Widowed", "Divorced"],
        },
        {
          id: "contacts",
          where: { page: 4, top: 51.4, bottom: 66.7 },
          items: "Items 12A to 14",
          label: "Do you know who you'll list as next of kin and emergency contact?",
          help:
            "Item 14 also lets you name someone to receive personal things left at a VA facility. The form notes this is not a will or a transfer of title.",
          kind: "choice",
          options: ["Yes, I know who", "I need to decide", "Not sure"],
        },
        {
          id: "facility",
          where: { page: 4, top: 66.7, bottom: 72 },
          items: "Item 15",
          label: "Which VA medical center or clinic would you like to use?",
          help: "The form points to www.va.gov/find-locations for a list. A name and city is enough.",
          kind: "text",
        },
        {
          id: "first-appointment",
          where: { page: 4, top: 66.7, bottom: 72 },
          items: "Item 16",
          label: "Would you like VA to contact you to schedule your first appointment?",
          help: "",
          kind: "choice",
          options: YES_NO_UNSURE,
        },
      ],
    },
    {
      id: "military",
      formSection: "Section II: Military service information",
      title: "Your service",
      intro:
        "Your DD-214 has most of these answers. If you don't get VA benefits yet, the instructions say you may attach a copy of your discharge papers to speed things up.",
      haveReady: ["Military service number (Section II, Item 1F)", "A copy of your DD-214 or other discharge papers"],
      questions: [
        {
          id: "service",
          where: { page: 4, top: 74.1, bottom: 81.6 },
          items: "Items 1A to 1E",
          label: "Last branch of service, entry date, discharge date (or future discharge date) and discharge type",
          help: "For example: Army, entered 06/2004, discharged 06/2010, honorable. Copy the dates from your DD-214.",
          kind: "text",
        },
        {
          id: "history",
          where: { page: 4, top: 81.6, bottom: 93 },
          items: "Item 2 (A to F)",
          label: "Which of these apply to you?",
          help:
            "The form asks yes or no for each: Purple Heart, former prisoner of war, served in a combat theater after 11/11/1998, discharged or retired for a disability from the line of duty, served in SW Asia during the Gulf War (August 2, 1990 to November 11, 1998), and having a VA service-connected rating. List the ones that apply.",
          kind: "long",
        },
        {
          id: "locations",
          where: { page: 5, top: 8.1, bottom: 46.3 },
          items: "Item 3 (A to D)",
          label: "Did you serve in any of the exposure locations the form lists? Which ones, and about when?",
          help:
            "The form asks about radiation cleanup or testing, Gulf War hazard locations, deployments like Enduring Freedom or Iraqi Freedom, and herbicide (Agent Orange) locations. Month and year is enough for dates.",
          kind: "long",
        },
        {
          id: "exposures",
          where: { page: 5, top: 26.3, bottom: 46.3 },
          items: "Item 3E",
          label: "Were you exposed to any of these? Which ones, and about when?",
          help:
            "The form lists air pollutants (like burn pits), chemicals, contaminated water at Camp Lejeune, radiation, SHAD, occupational hazards, asbestos, mustard gas, warfare agents and other. Write what you remember.",
          kind: "long",
        },
      ],
    },
    {
      id: "insurance",
      formSection: "Section III: Insurance information",
      title: "Health insurance",
      intro: "List every health plan that covers you, including coverage through a spouse or someone else.",
      haveReady: [
        "Insurance company name, address and phone, policy holder, policy number and group code (Section III, Items 1 to 4)",
        "Medicare number and Part A effective date (Section III, Items 6B and 6C)",
        "Your insurance, Medicare or Medicaid cards",
      ],
      questions: [
        {
          id: "other-insurance",
          where: { page: 5, top: 46.3, bottom: 56.8 },
          items: "Items 1 to 4",
          label: "Do you have any other health insurance?",
          help: "Include coverage through a spouse or another person. If you have more than one plan, the form says to use a separate sheet.",
          kind: "choice",
          options: YES_NO_UNSURE,
        },
        {
          id: "medicaid",
          where: { page: 5, top: 56.8, bottom: 62.2 },
          items: "Item 5",
          label: "Are you eligible for Medicaid?",
          help: "The form describes Medicaid as federal health insurance for low income adults.",
          kind: "choice",
          options: YES_NO_UNSURE,
        },
        {
          id: "medicare",
          where: { page: 5, top: 56.8, bottom: 62.2 },
          items: "Item 6A",
          label: "Are you enrolled in Medicare hospital insurance (Part A)?",
          help: "If yes, the form asks for the effective date and your Medicare number.",
          kind: "choice",
          options: YES_NO_UNSURE,
        },
      ],
    },
    {
      id: "dependents",
      formSection: "Section IV: Dependent information",
      title: "Your family",
      intro: "VA asks about your spouse and children. You'll write their names and details only on the official form.",
      haveReady: [
        "Spouse's Social Security number, date of birth, date of marriage, and address and phone if different from yours (Section IV, Items 1A to 1E)",
        "Each child's date of birth, Social Security number and the date they became your dependent (Section IV, Items 2A to 2C)",
        "What your child paid for college or training, if they had income (Section IV, Item 2G)",
      ],
      questions: [
        {
          id: "spouse",
          where: { page: 5, top: 64.2, bottom: 88.6 },
          items: "Items 1 to 1E",
          label: "Will you list a spouse?",
          help: "The instructions say to include your spouse even if you didn't live together, as long as you gave support last calendar year.",
          kind: "choice",
          options: YES_NO_UNSURE,
        },
        {
          id: "children",
          where: { page: 5, top: 64.2, bottom: 95.5 },
          items: "Items 2 to 2G",
          label: "How many children will you list?",
          help:
            "Count biological, adopted and stepchildren who are unmarried and under 18, or 18 to 22 and in school, or who became permanently unable to support themselves before 18. Use a separate sheet for more than one.",
          kind: "choice",
          options: ["None", "1", "2", "3 or more", "Not sure"],
        },
        {
          id: "support",
          where: { page: 5, top: 88.6, bottom: 95.5 },
          items: "Item 3",
          label: "If your spouse or a child didn't live with you last year, did you support them?",
          help: "Support can include things like tuition, clothing or medical bills.",
          kind: "choice",
          options: ["Yes", "No", "Doesn't apply", "Not sure"],
        },
      ],
    },
    {
      id: "employment",
      formSection: "Section V: Employment information",
      title: "Work",
      intro: "A short section about your job, if you have one or are retired.",
      haveReady: ["Retirement date, and your employer's name, address and phone (Section V, Items 1B to 1E)"],
      questions: [
        {
          id: "employment-status",
          where: { page: 6, top: 10.4, bottom: 20.5 },
          items: "Item 1A",
          label: "What is your employment status?",
          help: "If you're employed or retired, the form asks for the company's name, address and phone.",
          kind: "choice",
          options: ["Full time", "Part time", "Not employed", "Retired"],
        },
      ],
    },
    {
      id: "financial",
      formSection: "Sections VI to VIII: Financial disclosure, income and deductible expenses",
      title: "Money and household income",
      intro:
        "Sharing financial information is your choice. VA uses it to decide copays, enrollment priority and help like travel pay and cost-free medicine. You'll write any amounts only on the official form.",
      haveReady: [
        "Last year's gross income from work for you, your spouse and children (Section VII, Item 1)",
        "Last year's net income from a farm, ranch, property or business (Section VII, Item 2)",
        "Last year's other income, like Social Security, compensation, pension, interest and dividends (Section VII, Item 3)",
        "Last year's medical expenses you or your spouse paid that weren't reimbursed (Section VIII, Item 1)",
        "Funeral or burial costs you paid last year for a spouse or child, and your own college or training costs (Section VIII, Items 2 and 3)",
      ],
      questions: [
        {
          id: "disclose",
          where: { page: 6, top: 20.5, bottom: 36.1 },
          items: "Section VI",
          label: "Will you provide your household financial information for last calendar year?",
          help:
            "The instructions say this is needed mainly if you have no service-connected rating or a 0% rating. It doesn't apply if, for example, you're a former POW, a Purple Heart recipient, a recently discharged combat veteran, getting VA compensation or pension, or on Medicaid. The form lists them all. A VA enrollment coordinator or a free accredited representative can help you decide.",
          kind: "choice",
          options: ["Yes, I'll provide it", "No, I won't provide it", "Not sure"],
        },
        {
          id: "medical-expenses",
          where: { page: 6, top: 50.1, bottom: 62.2 },
          items: "Section VIII, Items 1 to 3",
          label: "Did you or your spouse pay medical costs last year that weren't reimbursed?",
          help:
            "Examples: doctors, dentists, medicine, Medicare, health insurance, hospital and nursing home. Gather receipts or statements if you'll provide financial information.",
          kind: "choice",
          options: YES_NO_UNSURE,
        },
      ],
    },
    {
      id: "sign",
      formSection: "Section IX and Assignment of Benefits",
      title: "Agreeing and signing",
      intro:
        "By sending the form you agree to pay any VA copays that apply. The assignment of benefits lets VA collect from your health plan for care that isn't for a service-connected condition; the form has the full wording. You sign only on the official form or VA.gov.",
      questions: [
        {
          id: "signer",
          where: { page: 6, top: 86.5, bottom: 94 },
          items: "Signature and date",
          label: "Who will sign?",
          help:
            "The instructions say you or someone with your power of attorney must sign and date it. If you sign with an \"X\", two people you know must watch you sign and sign the form too.",
          kind: "choice",
          options: ["I'll sign myself", "Someone with my power of attorney will sign", "I'll sign with an X (two witnesses)", "Not sure"],
        },
      ],
    },
  ],
};
