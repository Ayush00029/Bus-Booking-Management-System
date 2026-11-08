module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 45000,
  verbose: true,
  testMatch: ['**/tests/**/*.test.js']
};

