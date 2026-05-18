import type {
  KycProviderAdapter,
  KycVerificationRequest,
  KycVerificationResult
} from "../../types/index.js";
import { KycProviderError } from "../../errors/provider-error.js";

export class PaystackIdentityProvider implements KycProviderAdapter {
  code = "PAYSTACK_IDENTITY" as const;

  supports(request: KycVerificationRequest): boolean {
    return (
      request.country === "NG" &&
      (request.method === "BVN" || request.method === "NIN")
    );
  }

  async verify(request: KycVerificationRequest): Promise<KycVerificationResult> {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new KycProviderError(
        "PAYSTACK_SECRET_KEY is required for Paystack identity verification.",
        "CONFIGURATION_ERROR",
        this.code
      );
    }

    if (process.env.PAYSTACK_IDENTITY_REAL_MODE !== "true") {
      throw new KycProviderError(
        "Paystack Identity real verification is not implemented. Do not enable this provider until the API integration is complete.",
        "PROVIDER_UNAVAILABLE",
        this.code
      );
    }

    throw new KycProviderError(
      "Paystack Identity real verification mode was enabled, but no live API implementation exists yet.",
      "PROVIDER_UNAVAILABLE",
      this.code
    );
  }
}
