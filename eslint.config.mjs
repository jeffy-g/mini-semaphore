// import globals from "globals";
import tsparser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";
import stylistic from "@stylistic/eslint-plugin";

export default [
{
    ignores: [
        "dist/*",
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
            // ...globals.es2021
        },
        // eslintrc の parserOptions と同じです。
        parserOptions: {
            parser: tsparser,
            // project: true,  
            // ecmaFeatures: { 
            //   modules: true
            // },
            // // project: "tsconfig.json",
            ecmaVersion: "latest",
        },
    },

    // 3. plugin は名称を指定できるようになりましたが、注意があります。
    plugins: {
        "@typescript-eslint": tseslint,
        "@stylistic": stylistic,
        // tseslint,
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
        "semi-spacing": ["error", {after: true, before: false}],
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
        "no-cond-assign": "off",
        "no-console": [
            "off",
            {
                allow: [
                    "warn",
                    "dir",
                    "time",
                    "timeEnd",
                    "timeLog",
                    "trace",
                    "assert",
                    "clear",
                    "count",
                    "countReset",
                    "group",
                    "groupEnd",
                    "table",
                    "debug",
                    "info",
                    "dirxml",
                    "groupCollapsed",
                    "Console",
                    "profile",
                    "profileEnd",
                    "timeStamp",
                    "context"
                ]
            }
        ],
        "no-trailing-spaces": [
            "error",
            {
                ignoreComments: true
            }
        ],
        "no-underscore-dangle": [
            "error",
            {
                allow: [
                    // deque.ts
                    "_a", "_c", "_f", "_l"
                ]
            }
            // { allowAfterThis: true }
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
}
];
