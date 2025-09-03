import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/prefer-const": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Next.js specific rules - these are handled by next/core-web-vitals
      // "@next/next/no-html-link-for-pages": "error",
      // "@next/next/no-img-element": "warn",

      // React specific rules
      "react/jsx-key": "error",
      "react/no-unescaped-entities": "warn",
      "react/react-in-jsx-scope": "off", // Not needed in Next.js
      "react/prop-types": "off", // We use TypeScript

      // General JavaScript/TypeScript rules
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-unused-expressions": "error",
      "no-var": "error",
      "prefer-const": "error",
      "prefer-template": "warn",

      // Code style rules
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],

      // Performance rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}"],
    rules: {
      // Relax rules for test files
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
  {
    files: ["**/*.config.{js,mjs,ts}", "**/next.config.{js,mjs,ts}"],
    rules: {
      // Relax rules for config files
      "@typescript-eslint/no-var-requires": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
  {
    files: ["**/*.d.ts"],
    rules: {
      // Type definition files
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-types": "off",
    },
  },
  {
    // API routes specific rules
    files: ["**/api/**/*.{js,ts}", "**/pages/api/**/*.{js,ts}", "**/app/**/route.{js,ts}"],
    rules: {
      "no-console": "off", // Console is useful in API routes
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "node_modules/**",
      "coverage/**",
      ".nyc_output/**",
      "*.min.js",
      "public/**",
      ".env*",
      "next-env.d.ts",
      "tailwind.config.*",
      "postcss.config.*",
    ],
  },
];

export default eslintConfig;