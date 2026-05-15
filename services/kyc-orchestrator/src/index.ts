import type {
  KycProviderAdapter,
  KycVerificationRequest,
  KycVerificationResult
} from "./types/index.js";
import { MockKycProvider } from "./providers/mock-provider.js";

export * from "./types/index.js";
export { MockKycProvider };

export class KycOrchestrator {
  constructor(private readonly providers: KycProviderAdapter[]) {}

  async verify(request: KycVerificationRequest): Promise<KycVerificationResult> {
    const provider = this.providers.find((candidate) => candidate.supports(request));

    if (!provider) {
      throw new Error(`No KYC provider supports method ${request.method} in ${request.country}`);
    }

    return provider.verify(request);
  }
}

export function createDefaultKycOrchestrator(): KycOrchestrator {
  return new KycOrchestrator([new MockKycProvider()]);
}
