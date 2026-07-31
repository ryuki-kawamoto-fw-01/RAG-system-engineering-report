// Jest setup for Next.js server-side unit tests.

// Silence Next.js revalidate warnings etc. (keep console output for real failures)

// Silence error logs during tests (intentional error-path coverage).
const originalConsoleError = console.error;
console.error = jest.fn();

// Expose a helper in case a test needs real console.error.
globalThis.__restoreConsoleError = () => {
  console.error = originalConsoleError;
};
