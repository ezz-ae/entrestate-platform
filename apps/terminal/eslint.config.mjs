import tsParser from "@typescript-eslint/parser"
import tsPlugin from "@typescript-eslint/eslint-plugin"
import reactHooks from "eslint-plugin-react-hooks"

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "dist/**",
      "coverage/**",
      "public/**",
      "**/*.min.*",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
    },
    rules: {},
  },
]
