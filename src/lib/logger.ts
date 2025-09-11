// src\lib\logger.ts
export const logger = {
  info: (message: string, metadata: Record<string, unknown> = {}) => {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify({ level: 'INFO', message, timestamp, ...metadata }));
    } else {
      console.log(`[${timestamp}] [INFO] ${message}`, Object.keys(metadata).length > 0 ? metadata : '');
    }
  },
  error: (message: string, metadata: Record<string, unknown> = {}) => {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify({ level: 'ERROR', message, timestamp, ...metadata }));
    } else {
      console.error(`[${timestamp}] [ERROR] ${message}`, Object.keys(metadata).length > 0 ? metadata : '');
    }
  },
};
