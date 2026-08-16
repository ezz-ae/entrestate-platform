import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    deps: {
      inline: ["@neondatabase/auth"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "next/headers": path.resolve(__dirname, "tests/mocks/next-headers.ts"),
      "server-only": path.resolve(__dirname, "tests/mocks/server-only.ts"),
    },
  },
})
