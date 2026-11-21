import { z } from "zod";

export const BRANCHES = [
  { value: "army", label: "Army" },
  { value: "navy", label: "Navy" },
  { value: "air-force", label: "Air Force" },
  { value: "marine-corps", label: "Marine Corps" },
  { value: "space-force", label: "Space Force" },
  { value: "coast-guard", label: "Coast Guard" },
] as const;

export const SEPARATION_TYPES = [
  { value: "retirement", label: "Retirement" },
  { value: "separation", label: "Separation" },
] as const;

export const MARITAL_STATUSES = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
] as const;

export const SERVICE_CONNECTED = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not-sure", label: "Not sure" },
] as const;

export const STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"],
  ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"],
  ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
  ["PR", "Puerto Rico"], ["GU", "Guam"], ["VI", "U.S. Virgin Islands"], ["AS", "American Samoa"],
  ["MP", "Northern Mariana Islands"], ["OUTSIDE", "Outside the U.S."],
] as const;

type Values<T extends readonly { value: string }[]> = T[number]["value"];
const enumOf = <T extends readonly { value: string }[]>(list: T) =>
  z.enum(list.map((o) => o.value) as [Values<T>, ...Values<T>[]]);

export const IntakeSchema = z.object({
  branch: enumOf(BRANCHES),
  separationType: enumOf(SEPARATION_TYPES),
  /** ISO date, YYYY-MM-DD */
  separationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker format YYYY-MM-DD"),
  maritalStatus: enumOf(MARITAL_STATUSES),
  /** Married applicants only: a divorce from an earlier marriage. */
  priorDivorce: z.boolean().default(false),
  hasDependents: z.boolean(),
  serviceConnected: enumOf(SERVICE_CONNECTED),
  state: z.enum(STATES.map(([code]) => code) as [string, ...string[]]),
});

export type Intake = z.infer<typeof IntakeSchema>;
export type Branch = Intake["branch"];
export type SeparationType = Intake["separationType"];
export type MaritalStatus = Intake["maritalStatus"];
export type ServiceConnected = Intake["serviceConnected"];

export const labelFor = {
  branch: (v: Branch) => BRANCHES.find((b) => b.value === v)?.label ?? v,
  separationType: (v: SeparationType) => SEPARATION_TYPES.find((b) => b.value === v)?.label ?? v,
  maritalStatus: (v: MaritalStatus) => MARITAL_STATUSES.find((b) => b.value === v)?.label ?? v,
  serviceConnected: (v: ServiceConnected) => SERVICE_CONNECTED.find((b) => b.value === v)?.label ?? v,
  state: (code: string) => STATES.find(([c]) => c === code)?.[1] ?? code,
};
