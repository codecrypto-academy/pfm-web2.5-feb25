/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  testMatch: ["**/test/*.test.ts"],
  moduleNameMapper: {
    '^node-fetch$': require.resolve('node-fetch')  
  }

};