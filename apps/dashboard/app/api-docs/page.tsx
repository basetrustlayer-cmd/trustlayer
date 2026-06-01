import { ApiReference } from "@scalar/nextjs-api-reference";

const config = {
  spec: {
    url: "https://raw.githubusercontent.com/basetrustlayer-cmd/trustlayer/main/api-spec/openapi.yaml"
  },
  defaultHttpClient: {
    targetKey: "shell",
    clientKey: "curl"
  },
  authentication: {
    preferredSecurityScheme: "ApiKeyAuth",
    apiKey: {
      token: process.env.NEXT_PUBLIC_SANDBOX_API_KEY ?? "tl_test_sandbox_seed_key_do_not_use_in_production"
    }
  },
  theme: "default",
  layout: "modern",
  hideModels: false,
  searchHotKey: "k"
};

export default ApiReference(config);
