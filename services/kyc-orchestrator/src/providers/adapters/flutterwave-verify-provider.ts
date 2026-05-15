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

    return {
      provider: this.code,
      status: "PENDING",
      verified: false,
      confidence: 0.25,
      reference: `flutterwave_verify_${request.subjectId}`,
      raw: {
        mode: "stub",
        message: "Flutterwave Verify adapter scaffold created. Real API call not yet implemented."
      }
    };
  }
}
