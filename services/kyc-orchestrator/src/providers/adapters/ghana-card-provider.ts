import type {
  KycProviderAdapter,
  KycVerificationRequest,
  KycVerificationResult
} from "../../types/index.js";
import { KycProviderError } from "../../errors/provider-error.js";

export class GhanaCardProvider implements KycProviderAdapter {
  code = "GHANA_CARD" as const;

  supports(request: KycVerificationRequest): boolean {
    return request.country === "GH" && request.method === "GHANA_CARD";
  }

  async verify(request: KycVerificationRequest): Promise<KycVerificationResult> {
    if (!request.nationalId) {
      throw new KycProviderError(
        "nationalId is required for Ghana Card verification.",
        "INVALID_REQUEST",
        this.code
      );
    }

    return {
      provider: this.code,
      status: "VERIFIED",
      verified: true,
      confidence: 0.85,
      reference: `ghana_card_${request.subjectId}`,
      raw: {
        mode: "mock",
        message: "Ghana Card mock provider. Real NIA integration pending external agreement."
      }
    };
  }
}
