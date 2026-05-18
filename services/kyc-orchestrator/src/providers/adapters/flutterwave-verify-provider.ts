import type {
  KycProviderAdapter,
  KycVerificationRequest,
  KycVerificationResult
} from "../../types/index.js";
import { KycProviderError } from "../../errors/provider-error.js";

export class FlutterwaveVerifyProvider implements KycProviderAdapter {
  code = "FLUTTERWAVE_VERIFY" as const;

  supports(request: KycVerificationRequest): boolean {
    return (
      ["GH", "NG"].includes(request.country) &&
      ["BVN", "NIN", "BUSINESS_ORC"].includes(request.method)
    );
  }

  async verify(request: KycVerificationRequest): Promise<KycVerificationResult> {
    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      throw new KycProviderError(
        "FLUTTERWAVE_SECRET_KEY is required for Flutterwave verification.",
        "CONFIGURATION_ERROR",
        this.code
      );
    }

    if (process.env.FLUTTERWAVE_VERIFY_REAL_MODE !== "true") {
      throw new KycProviderError(
        "Flutterwave Verify real verification is not implemented. Do not enable this provider until the API integration is complete.",
        "PROVIDER_UNAVAILABLE",
        this.code
      );
    }

    throw new KycProviderError(
      "Flutterwave Verify real verification mode was enabled, but no live API implementation exists yet.",
      "PROVIDER_UNAVAILABLE",
      this.code
    );
  }
}
