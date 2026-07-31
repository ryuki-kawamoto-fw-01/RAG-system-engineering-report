const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'node',
  coverageProvider: 'v8',
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  roots: ['<rootDir>', '<rootDir>/tests/code/frontend'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  collectCoverageFrom: [
    '<rootDir>/src/app/(dashboard)/chat/[id]/_components/chat.tsx',
    '<rootDir>/src/app/_components/chat/chat-box.tsx',
    '<rootDir>/src/app/_components/chat/chat-message.tsx',
    '<rootDir>/src/app/_components/chat/feedback-bad-button.tsx',
    '<rootDir>/src/app/_components/chat/feedback-good-button.tsx',
    '!<rootDir>/src/**/*.d.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1',
    // Some components import the root config via relative paths like "../../../../config".
    // Tests under "tests/code/frontend" also mock that path; map it to the real file.
    '^(?:\\.\\./){4,}config$': '<rootDir>/config.ts',
  },
  testMatch: ['**/?(*.)+(spec|test).ts', '**/test_*.ts'],
};

module.exports = createJestConfig(customJestConfig);
