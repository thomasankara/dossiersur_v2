import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
      exclude: [
        "src/components/ui/**",
        "src/app/**/page.tsx",
        "src/app/**/layout.tsx",
        "src/app/**/loading.tsx",
        "src/app/**/not-found.tsx",
        "src/app/**/error.tsx",
        "src/types/**",
        "**/*.d.ts",
        "vitest.config.ts",
        "next.config.ts",
        "postcss.config.mjs",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
