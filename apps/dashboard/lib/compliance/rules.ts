export type ComplianceRule = {
  country: string;
  industry: string;
  requiredDocuments: string[];
};

export const complianceRules: ComplianceRule[] = [
  {
    country: "GH",
    industry: "Retail",
    requiredDocuments: [
      "CERTIFICATE_OF_INCORPORATION",
      "TAX_IDENTIFICATION",
      "BUSINESS_OPERATING_PERMIT",
      "VAT_REGISTRATION"
    ]
  },
  {
    country: "GH",
    industry: "Food",
    requiredDocuments: [
      "CERTIFICATE_OF_INCORPORATION",
      "TAX_IDENTIFICATION",
      "FOOD_DRUG_AUTHORITY_APPROVAL",
      "BUSINESS_OPERATING_PERMIT"
    ]
  },
  {
    country: "NG",
    industry: "Food",
    requiredDocuments: [
      "CERTIFICATE_OF_INCORPORATION",
      "TAX_IDENTIFICATION",
      "FOOD_DRUG_AUTHORITY_APPROVAL",
      "IMPORT_EXPORT_LICENSE"
    ]
  },
  {
    country: "KE",
    industry: "Manufacturing",
    requiredDocuments: [
      "CERTIFICATE_OF_INCORPORATION",
      "TAX_IDENTIFICATION",
      "SOCIAL_SECURITY_REGISTRATION",
      "ENVIRONMENTAL_PERMIT"
    ]
  }
];

export function getRequiredDocuments(country: string, industry: string) {
  const exact = complianceRules.find(
    (rule) =>
      rule.country.toLowerCase() === country.toLowerCase() &&
      rule.industry.toLowerCase() === industry.toLowerCase()
  );

  if (exact) return exact.requiredDocuments;

  return [
    "CERTIFICATE_OF_INCORPORATION",
    "TAX_IDENTIFICATION",
    "BUSINESS_OPERATING_PERMIT"
  ];
}
