import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "apps/dashboard/uploads/**",
      "**/*.tsbuildinfo"
    ]
  },
  {
    files: ["**/*.{js,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off"
    }
  }
];
