// import globals from "globals";
import tsesconfig from "typescript-eslint";
import tsparser from "@typescript-eslint/parser";
import tseslintPlugin from "@typescript-eslint/eslint-plugin";
import stylistic from "@stylistic/eslint-plugin";

/**
 * [ESLint Config Inspector] - Visually check eslint config
 * npx eslint --inspect-config
 *  - https://ma-vericks.com/blog/eslint-flat-config/
 */
const ignoreConfig = {
  ignores: [
    "etc/**/*.js",
    "tmp/**/*.js",
    "dist/**/*.js",
    "build/**/*.js",
    "samples/**/*.js",
    "scripts/**/*.js",
    "coverage/**/*.js",
  ]
};
export default tsesconfig.config(
  // export default [{
  ignoreConfig, {
  ignores: [
    "dist/*",
    "coverage/*",
    "build/*",
    "scripts/*",
    "__tests__/*",
  ],
  files: ["src/**/*.ts"],
  languageOptions: {
    // // 2. env オプションは無くなり、代わりに globals を使用するようになりました。
    // globals: {
    //   // ...globals.browser,
    //   // ...globals.node,
    //   ...globals.es2021
    // },
    // eslintrc の parserOptions と同じです。
    parserOptions: {
      sourceType: "script",
      parser: tsparser,
      // ecmaVersion: 2022,
    },
  },

  // 3. plugin は名称を指定できるようになりましたが、注意があります。
  plugins: {
    "@tseslintPlugin": tseslintPlugin,
    "@stylistic": stylistic,
  },
  rules: {
    // "@tseslintPlugin/array-type": ["warn", {
    //   default: "array-simple"
    // }],
    "@stylistic/indent": ["warn", 4, {
      SwitchCase: 1
    }],
    "@stylistic/member-delimiter-style": [
      "error",
      {
        multiline: {
          delimiter: "semi",
          requireLast: true
        },
        singleline: {
          delimiter: "semi",
          requireLast: false
        }
      }
    ],
    "@stylistic/prefer-function-type": "off",
    "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
    "@stylistic/semi": ["error", "always"],
    "@stylistic/semi-spacing": ["error", { after: true, before: false }],
    "@stylistic/semi-style": ["error", "last"],
    "@stylistic/no-extra-semi": "error",
    "no-unexpected-multiline": "error",
    "no-unreachable": "error",

    "@stylistic/comma-dangle": "off",
    // https://eslint.org/docs/rules/keyword-spacing
    "@stylistic/keyword-spacing": "error",
    "@stylistic/max-len": [
      "error", {
        code: 250, comments: 150
      }
    ],
    "@stylistic/no-trailing-spaces": [
      "error", {
        ignoreComments: true
      }
    ],
    "@stylistic/padding-line-between-statements": [
      "off", {
        blankLine: "always",
        prev: "*",
        next: "return"
      }
    ],

    "id-denylist": "error",
    "id-match": "error", // see https://eslint.org/docs/rules/id-match
    "no-cond-assign": "off",
    "max-classes-per-file": [
      "error", 4
    ],
    radix: "off",
    camelcase: [
      "error", {
        allow: [
          "[\\w_]+"
        ]
      }
    ],
    curly: [
      "error",
      "multi-line"
    ],
  }
});
