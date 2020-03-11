module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        // "project": "tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "@typescript-eslint/tslint"
    ],
    "rules": {
        "@typescript-eslint/indent": "error",
        "@typescript-eslint/member-delimiter-style": [
            "error",
            {
                "multiline": {
                    "delimiter": "semi",
                    "requireLast": true
                },
                "singleline": {
                    "delimiter": "semi",
                    "requireLast": false
                }
            }
        ],
        "@typescript-eslint/no-require-imports": "error",
        "@typescript-eslint/no-var-requires": "error",
        "@typescript-eslint/prefer-function-type": "off",
        "@typescript-eslint/quotes": [
            "error",
            "double",
            {
                "avoidEscape": true
            }
        ],
        "@typescript-eslint/semi": [
            "error",
            "always"
        ],
        "camelcase": "error",
        "comma-dangle": "off",
        "curly": [
            "error",
            "multi-line"
        ],
        "id-blacklist": "error",
        "id-match": "error",
        "max-classes-per-file": [
            "error",
            4
        ],
        "max-len": [
            "error",
            {
                "code": 1500
            }
        ],
        "no-cond-assign": "off",
        "no-console": [
            "off",
            {
                "allow": [
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
                "ignoreComments": true
            }
        ],
        "no-underscore-dangle": [
            "error",
            {
                "allow": [
                    // deque.ts
                    "_a", "_c", "_f", "_l"
                ]
            }
            // { "allowAfterThis": true }
        ],
        // default allow
        // "no-unused-expressions": [
        //     "error",
        //     {
        //         "allowShortCircuit": true,
        //         "allowTernary": true,
        //     }
        // ],
        "padding-line-between-statements": [
            "off",
            {
                "blankLine": "always",
                "prev": "*",
                "next": "return"
            }
        ],
        "radix": "off",
        // https://eslint.org/docs/rules/keyword-spacing
        "keyword-spacing": "error",
        // "@typescript-eslint/tslint/config": [
        //     "error",
        //     {
        //         "rules": {
        //             "whitespace": [
        //                 true,
        //                 "check-branch"
        //             ]
        //         }
        //     }
        // ]
    }
};
