import globals from "globals";
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
    // 2. env オプションは無くなり、代わりに globals を使用するようになりました。
    globals: {
      // ...globals.browser,
      // ...globals.node,
      ...globals.es2021
    },
    // eslintrc の parserOptions と同じです。
    parserOptions: {
      sourceType: "script",
      parser: tsparser,
      // project: true,  
      // ecmaFeatures: { 
      //   modules: true
      // },
      // // project: "tsconfig.json",
      ecmaVersion: 2022,
    },
  },

  // 3. plugin は名称を指定できるようになりましたが、注意があります。
  plugins: {
    "@typescript-eslint": tseslintPlugin,
    "@stylistic": stylistic,
  },
  rules: {
    // "@typescript-eslint/indent": "error",
    indent: ["warn", 4, {
      SwitchCase: 1
    }],
    // see https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#supported-rules
    "@typescript-eslint/array-type": ["warn", {
      default: "array-simple"
    }],
    // "@typescript-eslint/await-thenable": 1, // DEVNOTE: error...
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
    "@typescript-eslint/no-require-imports": "error",
    "@typescript-eslint/no-var-requires": "error",
    "prefer-function-type": "off",

    quotes: ["error", "double", { avoidEscape: true }],

    semi: ["error", "always"],
    "semi-spacing": ["error", { after: true, before: false }],
    "semi-style": ["error", "last"],
    "no-extra-semi": "error",
    "no-unexpected-multiline": "error",
    "no-unreachable": "error",

    camelcase: [
      "error", {
        allow: [
          "[\\w_]+"
        ]
      }
    ],
    "comma-dangle": "off",
    curly: [
      "error",
      "multi-line"
    ],
    "id-denylist": "error",
    "id-match": "error", // see https://eslint.org/docs/rules/id-match
    "max-classes-per-file": [
      "error",
      4
    ],
    "max-len": [
      "error", {
        code: 1500, comments: 250
      }
    ],
    // "no-cond-assign": "off",
    "no-trailing-spaces": [
      "error",
      {
        ignoreComments: true
      }
    ],
    "padding-line-between-statements": [
      "off",
      {
        blankLine: "always",
        prev: "*",
        next: "return"
      }
    ],
    radix: "off",
    // https://eslint.org/docs/rules/keyword-spacing
    "keyword-spacing": "error",
  }
});
