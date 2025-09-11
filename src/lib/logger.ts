// src\lib\logger.ts
export const logger = {
  info: (message: string, metadata: Record<string, unknown> = {}) => {
    console.log(`[INFO] ${message}`, metadata);
  },
  error: (message: string, metadata: Record<string, unknown> = {}) => {
    console.error(`[ERROR] ${message}`, metadata);
  },
};
