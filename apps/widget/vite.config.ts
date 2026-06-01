import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "TrustLayerWidget",
      fileName: "widget",
      formats: ["iife"]
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    },
    outDir: "dist",
    emptyOutDir: true
  }
});
