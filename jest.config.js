//
// DEVNOTE: 2022/2/21 - fix node esm module emits syntax error
//
module.exports = {
  preset: "ts-jest/presets/default-esm", // MUST
  // this is optional?
  testEnvironment: "node",
  verbose: true,
  /*
   * ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
   * transform: {
   *     <transform_regex>: ['ts-jest', {
   *        // ts-jest config goes here in Jest
   *     }
   *   ],
   * }
   */
  // `transform` property implicitly sets preset to "ts-jest"
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest", {
        useESM: true,
        tsconfig: {
          // DEVNOTE: 2024/12/09 - The `target` option does not seem to be necessary.
          // target: "es2020",
          // TIP: Dynamic imports are only supported when the '--module' flag is set to
          // 'es2020', 'es2022', 'esnext', 'commonjs', 'amd', 'system', 'umd', 'node16', or 'nodenext'.
          module: "es2020",
          // esModuleInterop: true,
          // DEVNOTE: 2024/12/09 - This flag is automatically turned on if the `esModuleInterop` flag is enabled.
          allowSyntheticDefaultImports: true,
        },
      }
    ]
  },
  // default: (/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$
  // testRegex: "/__tests__/stress-test.ts",
  testRegex: "/__tests__/.*\\.tsx?$",
  collectCoverageFrom: [
    // all ?
    "./src/!(*.d.ts)",
    "./dist/{cjs,esm,umd,webpack,webpack-esm}/**/!(*.d.ts)",
  ],
  moduleFileExtensions: [
    "ts", "js", "mjs"
  ],
  projects: ["<rootDir>"]
};
