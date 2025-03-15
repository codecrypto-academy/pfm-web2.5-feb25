module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
      '^.+\\.tsx?$': 'ts-jest',    
    },
    testTimeout: 30000, // Establece 30 segundos como tiempo de espera predeterminado para todos los tests
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    //testMatch: ['**/__tests__/**/*.test.{js,ts}'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    rootDir: "src"
  };