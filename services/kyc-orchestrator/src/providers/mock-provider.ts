import type {
  KycProviderAdapter,
  KycVerificationRequest,
  KycVerificationResult
} from "../types/index.js";

export class MockKycProvider implements KycProviderAdapter {
  code = "MOCK" as const;

  supports(_request: KycVerificationRequest): boolean {
    return true;
  }

  async verify(request: KycVerificationRequest): Promise<KycVerificationResult> {
    if (request.method === "PHONE_OTP") {
      return {
        provider: this.code,
        status: "OTP_SENT",
        verified: false,
        confidence: 0.45,
        reference: `mock_${request.subjectId}`
      };
    }

    return {
      provider: this.code,
      status: "VERIFIED",
      verified: true,
      confidence: 0.85,
      reference: `mock_${request.subjectId}`
    };
  }
}
