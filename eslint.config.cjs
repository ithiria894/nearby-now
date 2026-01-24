// eslint.config.cjs

const js = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const unusedImports = require("eslint-plugin-unused-imports");

// :zap: CHANGE 1: ESLint v9 flat config with TS/TSX + React + unused-imports support
module.exports = [
  js.configs.recommended,

  // :zap: CHANGE 2: TypeScript / React Native app code
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
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
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "unused-imports": unusedImports,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "no-undef": "off",
      // :zap: CHANGE 3: Remove unused imports automatically
      "unused-imports/no-unused-imports": "error",

      // Keep noise low for RN/Expo projects
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
          },
      ],

      // Basic hooks safety
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // :zap: CHANGE 4: Node config files (metro, babel, etc.)
  {
    files: ["**/*.config.js", "metro.config.js", "babel.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        process: "readonly",
      },
    },
  },

  // :zap: CHANGE 5: Ignore generated folders
  {
    ignores: [
      "node_modules/**",
      ".expo/**",
      "dist/**",
      "build/**",
      ".husky/**",
      "coverage/**",
    ],
  },
];
