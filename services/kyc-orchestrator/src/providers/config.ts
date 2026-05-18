export function isKycMockModeEnabled(): boolean {
  return process.env.TRUSTLAYER_KYC_MOCK_MODE === "true";
}

export function requireKycMockMode(provider: string): void {
  if (!isKycMockModeEnabled()) {
    throw new Error(
      `${provider} mock verification is disabled. Set TRUSTLAYER_KYC_MOCK_MODE=true only in sandbox/demo environments.`
    );
  }
}
