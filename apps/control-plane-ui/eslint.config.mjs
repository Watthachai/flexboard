// apps/control-plane-ui/eslint.config.mjs
import next from "eslint-config-next";

export default [
  ...next, // core-web-vitals defaults ของ Next 15

  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/.next/**", "**/dist/**"],
    languageOptions: {
      parserOptions: {
        // ให้รู้จัก tsconfig ของแอปนี้
        project: ["./tsconfig.json"],
        tsconfigRootDir: new URL(".", import.meta.url),
      },
    },
    rules: {
      // คุณยังอยาก “เห็น error ทั้งหมด” ใน Problems panel
      // แต่ถ้าอยาก build ผ่าน ให้ผ่อนกฎได้ทีหลัง
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "react/no-unescaped-entities": "error",
    },
  },
];
