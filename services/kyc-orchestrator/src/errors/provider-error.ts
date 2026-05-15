import type { KycProviderCode } from "../types/index.js";

export type KycProviderErrorCode =
  | "PROVIDER_UNAVAILABLE"
  | "INVALID_REQUEST"
  | "UNSUPPORTED_METHOD"
  | "VERIFICATION_FAILED"
  | "TIMEOUT"
  | "CONFIGURATION_ERROR";

export class KycProviderError extends Error {
  constructor(
    message: string,
    public readonly code: KycProviderErrorCode,
    public readonly provider: KycProviderCode,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "KycProviderError";
  }
}
