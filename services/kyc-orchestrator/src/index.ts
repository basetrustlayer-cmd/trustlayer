import type {
  KycProviderAdapter,
  KycVerificationRequest,
  KycVerificationResult
} from "./types/index.js";
import { MockKycProvider } from "./providers/mock-provider.js";
import { KycProviderRouter } from "./providers/routing/provider-router.js";
import { GhanaCardProvider } from "./providers/adapters/ghana-card-provider.js";
import { GhanaBusinessRegistryProvider } from "./providers/adapters/ghana-business-registry-provider.js";
import { PaystackIdentityProvider } from "./providers/adapters/paystack-identity-provider.js";
import { FlutterwaveVerifyProvider } from "./providers/adapters/flutterwave-verify-provider.js";
import { StripeIdentityProvider } from "./providers/adapters/stripe-identity-provider.js";

export * from "./types/index.js";
export * from "./errors/provider-error.js";
export { MockKycProvider };
export { GhanaCardProvider };
export { GhanaBusinessRegistryProvider };
export { PaystackIdentityProvider };
export { FlutterwaveVerifyProvider };
export { StripeIdentityProvider };
export { KycProviderRouter };

export class KycOrchestrator {
  private readonly router: KycProviderRouter;

  constructor(private readonly providers: KycProviderAdapter[]) {
    this.router = new KycProviderRouter(providers);
  }

  async verify(request: KycVerificationRequest): Promise<KycVerificationResult> {
    const provider = this.router.selectProvider(request);
    return provider.verify(request);
  }
}

export function createDefaultKycOrchestrator(): KycOrchestrator {
  return new KycOrchestrator([
    new GhanaBusinessRegistryProvider(),
    new GhanaCardProvider(),
    new PaystackIdentityProvider(),
    new FlutterwaveVerifyProvider(),
    new StripeIdentityProvider(),
    new MockKycProvider()
  ]);
}
