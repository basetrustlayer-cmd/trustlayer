export type CreateHubtelCheckoutInput = {
  organizationId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
};

function getHubtelConfig() {
  const clientId = process.env.HUBTEL_CLIENT_ID;
  const clientSecret = process.env.HUBTEL_CLIENT_SECRET;
  const merchantAccountNumber =
    process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER;

  if (!clientId) {
    throw new Error("HUBTEL_CLIENT_ID is required.");
  }

  if (!clientSecret) {
    throw new Error("HUBTEL_CLIENT_SECRET is required.");
  }

  if (!merchantAccountNumber) {
    throw new Error("HUBTEL_MERCHANT_ACCOUNT_NUMBER is required.");
  }

  return {
    clientId,
    clientSecret,
    merchantAccountNumber
  };
}

export async function createHubtelCheckoutSession(
  input: CreateHubtelCheckoutInput
) {
  getHubtelConfig();

  throw new Error(
    "Hubtel checkout integration not implemented yet."
  );
}

export async function handleHubtelWebhook(
  payload: unknown
): Promise<void> {
  void payload;

  throw new Error(
    "Hubtel webhook integration not implemented yet."
  );
}
