export const APP_VERSION = "5.15.0.0";
export const APP_NAME = "Flexboard OnPrem Viewer";
export const BUILD_DATE = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

export const VERSION_INFO = {
  version: APP_VERSION,
  name: APP_NAME,
  buildDate: BUILD_DATE,
  displayName: `${APP_NAME} v${APP_VERSION}`,
} as const;
