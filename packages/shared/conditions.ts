import type { Intake, MaritalStatus, SeparationType, ServiceConnected } from "./intake";

/**
 * Declarative "which intake answers make this apply" rule.
 * Every listed field must match (AND). An omitted field matches anything.
 * Kept declarative (not functions) so non-developers can review it and so
 * the rules can later move to a database or CMS unchanged.
 */
export interface AppliesWhen {
  separationType?: SeparationType[];
  serviceConnected?: ServiceConnected[];
  maritalStatus?: MaritalStatus[];
  hasDependents?: boolean;
  /** Either currently divorced, or married with a prior divorce. */
  hasDivorce?: boolean;
}

export function matches(rule: AppliesWhen | undefined, intake: Intake): boolean {
  if (!rule) return true;
  if (rule.separationType && !rule.separationType.includes(intake.separationType)) return false;
  if (rule.serviceConnected && !rule.serviceConnected.includes(intake.serviceConnected)) return false;
  if (rule.maritalStatus && !rule.maritalStatus.includes(intake.maritalStatus)) return false;
  if (rule.hasDependents !== undefined && rule.hasDependents !== intake.hasDependents) return false;
  if (rule.hasDivorce !== undefined) {
    const divorced = intake.maritalStatus === "divorced" || intake.priorDivorce;
    if (rule.hasDivorce !== divorced) return false;
  }
  return true;
}
