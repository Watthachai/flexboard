/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Console Logger Utility
 * Automatically disables console logs in production
 */

// Check if we're in production and console should be disabled
const isProduction = process.env.NODE_ENV === "production";
const disableConsole = process.env.NEXT_PUBLIC_DISABLE_CONSOLE === "true";
const shouldDisableLogging = isProduction && disableConsole;

// Save original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
};

// Create logger that respects environment settings
export const logger = {
  log: (...args: any[]) => {
    if (!shouldDisableLogging) {
      originalConsole.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (!shouldDisableLogging) {
      originalConsole.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always allow errors in production for debugging
    originalConsole.error(...args);
  },
  info: (...args: any[]) => {
    if (!shouldDisableLogging) {
      originalConsole.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (
      !shouldDisableLogging &&
      process.env.NEXT_PUBLIC_DEBUG_MODE === "true"
    ) {
      originalConsole.debug(...args);
    }
  },
};

// Function to globally disable console in production
export const disableConsoleInProduction = () => {
  if (shouldDisableLogging) {
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.warn = () => {};
    // Keep console.error for production debugging

    console.info("🔇 Console logging disabled in production");
  }
};

// Auto-disable on import if in production
if (typeof window !== "undefined" && shouldDisableLogging) {
  disableConsoleInProduction();
}

export default logger;
