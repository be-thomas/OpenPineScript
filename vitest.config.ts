import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Glob discovery: a new tests/<version>/… file is picked up with no
    // config change. Hand-listing test files silently drops suites.
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Conformance runs execute full backtests over multi-hundred-bar datasets.
    testTimeout: 30_000,
  },
});
