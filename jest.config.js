//
// DEVNOTE: 2022/2/21 - fix node esm module emits syntax error
//
module.exports = {
  preset: "ts-jest/presets/default-esm", // MUST
  globals: {
    "ts-jest": {
      // tsconfig: "./src/tsconfig.json", // <- needless
      useESM: true
    }
  },
  // this is optional?
  testEnvironment: "node",
  verbose: true,
  // `transform` property implicitly sets preset to "ts-jest"
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  // default: (/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$
  testRegex: "/__tests__/.*\\.tsx?$",
  moduleFileExtensions: [
    "ts",
    "js"
  ],
  projects: ["<rootDir>"]
};
