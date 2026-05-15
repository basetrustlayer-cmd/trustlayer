export type KycProviderCode =
  | "MOCK"
  | "STRIPE_IDENTITY"
  | "PAYSTACK_IDENTITY"
  | "FLUTTERWAVE_VERIFY"
  | "GHANA_CARD"
  | "BVN"
  | "NIN"
  | "BUSINESS_REGISTRY";

export type KycSubjectType = "INDIVIDUAL" | "BUSINESS";

export type KycVerificationMethod =
  | "PHONE_OTP"
  | "GHANA_CARD"
  | "BVN"
  | "NIN"
  | "BUSINESS_ORC";

export type KycVerificationStatus =
  | "PENDING"
  | "OTP_SENT"
  | "VERIFIED"
  | "FAILED"
  | "EXPIRED";

export type KycVerificationRequest = {
  subjectId: string;
  subjectType: KycSubjectType;
  method: KycVerificationMethod;
  country: string;
  phone?: string;
  nationalId?: string;
  businessRegistrationNumber?: string;
};

export type KycVerificationResult = {
  provider: KycProviderCode;
  status: KycVerificationStatus;
  verified: boolean;
  confidence: number;
  reference?: string;
  raw?: unknown;
};

export interface KycProviderAdapter {
  code: KycProviderCode;
  supports(request: KycVerificationRequest): boolean;
  verify(request: KycVerificationRequest): Promise<KycVerificationResult>;
}
