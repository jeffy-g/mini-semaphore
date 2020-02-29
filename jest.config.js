
module.exports = {
  // // preset: "ts-jest",
  // globals: {
  //   "ts-jest": {
  //     "tsConfig": "./tsconfig.json"
  //   }
  // },
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
