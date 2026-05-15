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

    return {
      provider: this.code,
      status: "PENDING",
      verified: false,
      confidence: 0.25,
      reference: `paystack_identity_${request.subjectId}`,
      raw: {
        mode: "stub",
        message: "Paystack Identity adapter scaffold created. Real API call not yet implemented."
      }
    };
  }
}
