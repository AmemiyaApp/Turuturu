// src\lib\monitoring.ts
// This module provides structured logging and metrics collection

export interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
}

export const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

// Type-safe context interface
interface LogContext {
  [key: string]: string | number | boolean | null | undefined | LogContext | Error;
}

export interface LogEntry {
  timestamp: string;
  level: keyof LogLevel;
  message: string;
  context?: LogContext;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  performance?: {
    duration: number;
    memory?: number;
  };
}

class Logger {
  private minLevel: number;
  private context: LogContext;

  constructor(minLevel: keyof LogLevel = 'INFO', context: LogContext = {}) {
    this.minLevel = LOG_LEVELS[minLevel];
    this.context = context;
  }

  private shouldLog(level: keyof LogLevel): boolean {
    return LOG_LEVELS[level] >= this.minLevel;
  }

  private createLogEntry(
    level: keyof LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    if (process.env.NODE_ENV === 'production') {
      // In production, use structured JSON logging
      console.log(JSON.stringify(entry));
    } else {
      // In development, use readable format
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      const prefix = `[${timestamp}] ${entry.level}:`;
      console.log(prefix, entry.message, entry.context || '');
      if (entry.error) {
        console.error('Error:', entry.error);
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('DEBUG')) return;
    this.output(this.createLogEntry('DEBUG', message, context));
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('INFO')) return;
    this.output(this.createLogEntry('INFO', message, context));
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('WARN')) return;
    this.output(this.createLogEntry('WARN', message, context));
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog('ERROR')) return;
    this.output(this.createLogEntry('ERROR', message, context, error));
  }

  withContext(additionalContext: LogContext): Logger {
    return new Logger(
      Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key as keyof LogLevel] === this.minLevel) as keyof LogLevel || 'INFO',
      { ...this.context, ...additionalContext }
    );
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  startTiming(label: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
      return duration;
    };
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(value);

    // Keep only last 100 measurements
    const values = this.metrics.get(label)!;
    if (values.length > 100) {
      values.splice(0, values.length - 100);
    }
  }

  getMetrics(label: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(label);
    if (!values || values.length === 0) return null;

    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    for (const [label] of this.metrics) {
      const metrics = this.getMetrics(label);
      if (metrics) {
        result[label] = metrics;
      }
    }
    return result;
  }

  clear(): void {
    this.metrics.clear();
  }
}

// Global instances
export const logger = new Logger(
  process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG'
);

export const performanceMonitor = new PerformanceMonitor();

// Application metrics tracking
export interface AppMetrics {
  userRegistrations: number;
  ordersCreated: number;
  paymentsProcessed: number;
  emailsSent: number;
  errors: number;
  activeUsers: number;
}

class MetricsCollector {
  private metrics: AppMetrics = {
    userRegistrations: 0,
    ordersCreated: 0,
    paymentsProcessed: 0,
    emailsSent: 0,
    errors: 0,
    activeUsers: 0,
  };

  private startTime = Date.now();

  increment(metric: keyof AppMetrics, value: number = 1): void {
    this.metrics[metric] += value;
    logger.debug('Metric incremented', { metric, value, newTotal: this.metrics[metric] });
  }

  set(metric: keyof AppMetrics, value: number): void {
    this.metrics[metric] = value;
    logger.debug('Metric set', { metric, value });
  }

  getMetrics(): AppMetrics & { uptime: number } {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
    };
  }

  reset(): void {
    this.metrics = {
      userRegistrations: 0,
      ordersCreated: 0,
      paymentsProcessed: 0,
      emailsSent: 0,
      errors: 0,
      activeUsers: 0,
    };
    this.startTime = Date.now();
  }
}

export const metricsCollector = new MetricsCollector();

// Error boundary utility for React components
export function createErrorHandler(componentName: string) {
  return (error: Error, errorInfo: { componentStack?: string }) => {
    logger.error(`Error in ${componentName}`, {
      component: componentName,
      errorInfo,
    }, error);
    
    metricsCollector.increment('errors');
  };
}

// API request logging middleware
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
): void {
  logger.info('API Request', {
    method,
    path,
    statusCode,
    duration,
    userId,
  });

  performanceMonitor.recordMetric(`api.${method}.${path}`, duration);
  
  if (statusCode >= 400) {
    metricsCollector.increment('errors');
  }
}

// Health check function
export async function getSystemHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, { status: string; responseTime?: number; error?: string }>;
  metrics: AppMetrics & { uptime: number };
  performance: Record<string, { avg: number; min: number; max: number; count: number }>;
}> {
  const checks: Record<string, { status: string; responseTime?: number; error?: string }> = {};
  
  // Database check
  try {
    const start = performance.now();
    // This would be replaced with actual database ping
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate DB check
    checks.database = {
      status: 'healthy',
      responseTime: performance.now() - start,
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // External services check
  checks.stripe = {
    status: process.env.STRIPE_SECRET_KEY ? 'configured' : 'missing',
  };

  checks.email = {
    status: process.env.SMTP_HOST ? 'configured' : 'missing',
  };

  // Determine overall status
  const hasUnhealthy = Object.values(checks).some(check => check.status === 'unhealthy');
  const hasMissing = Object.values(checks).some(check => check.status === 'missing');
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (hasUnhealthy) {
    status = 'unhealthy';
  } else if (hasMissing) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  return {
    status,
    checks,
    metrics: metricsCollector.getMetrics(),
    performance: performanceMonitor.getAllMetrics(),
  };
}