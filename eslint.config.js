import globals from "globals";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default [
  eslintPluginPrettierRecommended,
  {
    files: ["**/*.{mjs,js}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
];
