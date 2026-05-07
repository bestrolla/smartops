module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/config/**',
    '!src/scripts/**'
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  testTimeout: 30000
}; 