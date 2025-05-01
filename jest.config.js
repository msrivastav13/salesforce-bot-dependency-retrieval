export default {
  transform: {},
  testEnvironment: 'node',
  collectCoverage: false,
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
}; 