import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "services/**/*.test.ts",
      "apps/**/*.test.ts",
      "packages/**/*.test.ts"
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**"
    ]
  }
});
