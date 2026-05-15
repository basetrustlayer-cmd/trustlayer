import type {
  KycProviderAdapter,
  KycVerificationRequest,
  KycVerificationResult
} from "../../types/index.js";
import { KycProviderError } from "../../errors/provider-error.js";

export class StripeIdentityProvider implements KycProviderAdapter {
  code = "STRIPE_IDENTITY" as const;

  supports(request: KycVerificationRequest): boolean {
    return request.method === "GHANA_CARD" && request.country !== "GH";
  }

  async verify(request: KycVerificationRequest): Promise<KycVerificationResult> {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new KycProviderError(
        "STRIPE_SECRET_KEY is required for Stripe Identity verification.",
        "CONFIGURATION_ERROR",
        this.code
      );
    }

    return {
      provider: this.code,
      status: "PENDING",
      verified: false,
      confidence: 0.25,
      reference: `stripe_identity_${request.subjectId}`,
      raw: {
        mode: "stub",
        message: "Stripe Identity adapter scaffold created. Real API call not yet implemented."
      }
    };
  }
}
