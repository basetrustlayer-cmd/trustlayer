import { KycProviderError } from "../errors/provider-error.js";
import type { KycProviderCode } from "../types/index.js";

export function isKycMockModeEnabled(): boolean {
  return process.env.TRUSTLAYER_KYC_MOCK_MODE === "true";
}

export function requireKycMockMode(
  providerName: string,
  providerCode: KycProviderCode
): void {
  if (!isKycMockModeEnabled()) {
    throw new KycProviderError(
      `${providerName} mock verification is disabled. Set TRUSTLAYER_KYC_MOCK_MODE=true only in sandbox/demo environments.`,
      "CONFIGURATION_ERROR",
      providerCode
    );
  }
}
