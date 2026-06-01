import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  client: "fetch",
  input: "../../api-spec/openapi.yaml",
  output: {
    path: "src/generated",
    format: "prettier"
  }
});
