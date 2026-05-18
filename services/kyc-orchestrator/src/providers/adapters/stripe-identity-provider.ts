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

    if (process.env.STRIPE_IDENTITY_REAL_MODE !== "true") {
      throw new KycProviderError(
        "Stripe Identity real verification is not implemented. Do not enable this provider until the API integration is complete.",
        "PROVIDER_UNAVAILABLE",
        this.code
      );
    }

    throw new KycProviderError(
      "Stripe Identity real verification mode was enabled, but no live API implementation exists yet.",
      "PROVIDER_UNAVAILABLE",
      this.code
    );
  }
}
