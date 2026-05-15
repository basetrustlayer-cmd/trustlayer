import type {
  KycProviderAdapter,
  KycVerificationRequest
} from "../../types/index.js";

export class KycProviderRouter {
  constructor(private readonly providers: KycProviderAdapter[]) {}

  selectProvider(request: KycVerificationRequest): KycProviderAdapter {
    const provider = this.providers.find((candidate) => candidate.supports(request));

    if (!provider) {
      throw new Error(`No KYC provider supports method ${request.method} in ${request.country}`);
    }

    return provider;
  }
}
