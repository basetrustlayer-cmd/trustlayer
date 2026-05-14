/**
 * PARKED MODULE
 *
 * TrustLayer is being realigned as a B2B identity verification and TrustScore API.
 * Procurement/compliance document rules are outside the current MVP scope.
 *
 * This compatibility stub preserves the original function signature so all
 * existing imports continue to compile while returning no requirements.
 */

export type ComplianceRule = {
  country: string;
  industry: string;
  requiredDocuments: string[];
};

/**
 * No active compliance rules in the current MVP.
 */
export const complianceRules: ComplianceRule[] = [];

/**
 * Returns no required documents.
 * Parameters are intentionally ignored to maintain backward compatibility.
 */
export function getRequiredDocuments(
  _country: string,
  _industry: string
): string[] {
  void _country;
  void _industry;
  return [];
}
