import { KycProviderError } from "../errors/provider-error.js";
import type {
  KycVerificationRequest,
  KycVerificationResult
} from "../types/index.js";

export function normalizeKycRequest(
  request: KycVerificationRequest
): KycVerificationRequest {
  const country = request.country.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(country)) {
    throw new KycProviderError(
      "country must be a valid ISO-3166 alpha-2 code.",
      "INVALID_REQUEST",
      "MOCK"
    );
  }

  const normalized = {
    ...request,
    country
  };

  if (normalized.method === "PHONE_OTP" && !normalized.phone) {
    throw new KycProviderError("phone is required for PHONE_OTP.", "INVALID_REQUEST", "MOCK");
  }

  if (["GHANA_CARD", "BVN", "NIN"].includes(normalized.method) && !normalized.nationalId) {
    throw new KycProviderError("nationalId is required for this verification method.", "INVALID_REQUEST", "MOCK");
  }

  if (normalized.method === "BUSINESS_ORC" && !normalized.businessRegistrationNumber) {
    throw new KycProviderError(
      "businessRegistrationNumber is required for BUSINESS_ORC.",
      "INVALID_REQUEST",
      "MOCK"
    );
  }

  return normalized;
}

export function assertValidKycResult(result: KycVerificationResult): void {
  if (result.confidence < 0 || result.confidence > 1) {
    throw new KycProviderError(
      "provider confidence must be between 0 and 1.",
      "VERIFICATION_FAILED",
      result.provider
    );
  }
}
