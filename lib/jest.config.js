/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    "<rootDir>/src/__tests__/**/*.test.ts"
  ],
  transform: {
    "^.+\\.tsx?$": [
      'ts-jest',
      {
        // Para permitir un tipado más flexible
        isolatedModules: true,
        diagnostics: {
          // Ignorar problemas conocidos de tipado
          warnOnly: true
        }
      }
    ]
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleFileExtensions: [
    "ts", "tsx", "js", "jsx", "json", "node"
  ],
  collectCoverage: true,
  coverageDirectory: "coverage",
  testTimeout: 30000
};
