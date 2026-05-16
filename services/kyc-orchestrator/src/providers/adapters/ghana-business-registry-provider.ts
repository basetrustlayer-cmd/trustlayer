import type {
  KycProviderAdapter,
  KycVerificationRequest,
  KycVerificationResult
} from "../../types/index.js";
import { KycProviderError } from "../../errors/provider-error.js";

export class GhanaBusinessRegistryProvider implements KycProviderAdapter {
  code = "BUSINESS_REGISTRY" as const;

  supports(request: KycVerificationRequest): boolean {
    return (
      request.country === "GH" &&
      request.subjectType === "BUSINESS" &&
      request.method === "BUSINESS_ORC"
    );
  }

  async verify(
    request: KycVerificationRequest
  ): Promise<KycVerificationResult> {
    if (!request.businessRegistrationNumber) {
      throw new KycProviderError(
        "businessRegistrationNumber is required for Ghana ORC verification.",
        "INVALID_REQUEST",
        this.code
      );
    }

    return {
      provider: this.code,
      status: "VERIFIED",
      verified: true,
      confidence: 0.8,
      reference: `ghana_orc_${request.subjectId}`,
      raw: {
        registry: "GHANA_ORC",
        mode: "mock",
        country: "GH",
        registrationNumber: request.businessRegistrationNumber,
        message:
          "Ghana ORC mock provider. Real ORC integration pending external registry access."
      }
    };
  }
}
