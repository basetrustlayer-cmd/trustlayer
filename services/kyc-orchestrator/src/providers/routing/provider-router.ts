import type {
  KycProviderAdapter,
  KycVerificationRequest
} from "../../types/index.js";
import { KycProviderError } from "../../errors/provider-error.js";

export class KycProviderRouter {
  constructor(private readonly providers: KycProviderAdapter[]) {}

  selectProvider(request: KycVerificationRequest): KycProviderAdapter {
    const provider = this.providers.find((candidate) => candidate.supports(request));

    if (!provider) {
      throw new KycProviderError(
        `No KYC provider supports method ${request.method} in ${request.country}.`,
        "UNSUPPORTED_METHOD",
        "MOCK"
      );
    }

    return provider;
  }
}
