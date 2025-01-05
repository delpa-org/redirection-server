/** @license AGPL-3.0-or-later
 *
 * Copyright(C) 2025 Hong Xu <hong@topbug.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const tsFiles = ["**/*.ts", "**/*.mts"];

export default [
  eslint.configs.recommended,
  {
    ignores: ["dist/*", "docs/*"],
  },
  {
    files: [...tsFiles, "**/*.js", "**/*.mjs"],
    rules: {
      "no-constant-binary-expression": ["error"],
      "no-constructor-return": ["error"],
      "no-duplicate-imports": ["error"],
      "no-new-native-nonconstructor": ["error"],
      "no-self-compare": ["error"],
      "no-template-curly-in-string": ["error"],
      "no-unneeded-ternary": ["error"],
      "no-unreachable-loop": ["error"],
      "no-unused-private-class-members": ["error"],
      "sort-imports": ["error"],
      "unicode-bom": ["error", "never"],
    },
  },
  // Apply ts rules only to ts files
  ...[
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
  ].map((elem) => ({
    ...elem,
    files: tsFiles,
  })),
  {
    files: tsFiles,
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "never",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false,
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-unnecessary-type-assertion": [
        "error",
        { typesToIgnore: ["const"] },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
        },
      ],
      // This must be off otherwise "@typescript-eslint/no-unused-expressions"
      // may not work properly. See the doc of
      // @typescript-eslint/no-unused-expressions.
      "no-unused-expressions": "off",
      "@typescript-eslint/no-unused-expressions": "error",
    },
  },
];
