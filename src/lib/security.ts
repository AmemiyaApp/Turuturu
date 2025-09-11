// src\lib\security.ts
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/monitoring';

// Helper function to extract client IP from NextRequest
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP.trim();
  }
  return 'unknown';
}

// Type definitions for better type safety
interface UserProfile {
  id: string;
  email?: string; // Made optional to match Supabase User type
  name?: string;
  isAdmin?: boolean;
}

interface AuthenticatedRequest extends NextRequest {
  user?: UserProfile | null;
  isAdmin?: boolean;
  validatedBody?: Record<string, unknown>;
}

interface ValidationResult {
  user: UserProfile | null;
  isValid: boolean;
  isAdmin: boolean;
}

interface ApiContext {
  params?: Record<string, string>;
}

// Rate limiting configuration
const RATE_LIMITS = {
  api: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
  auth: { requests: 5, window: 60 * 1000 }, // 5 auth attempts per minute
  payment: { requests: 10, window: 60 * 1000 }, // 10 payment attempts per minute
} as const;

// Simple in-memory rate limiter (in production, use Redis)
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  isAllowed(
    identifier: string,
    limit: { requests: number; window: number }
  ): boolean {
    const now = Date.now();
    const key = identifier;
    const entry = this.requests.get(key);

    if (!entry || now > entry.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + limit.window });
      return true;
    }

    if (entry.count >= limit.requests) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(
    identifier: string,
    limit: { requests: number; window: number }
  ): number {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return limit.requests;
    }
    return Math.max(0, limit.requests - entry.count);
  }
}

export const rateLimiter = new RateLimiter();

// Input validation utilities
export function sanitizeInput(input: string): string {
  // Basic XSS prevention
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function validateAmount(amount: number): boolean {
  return amount > 0 && amount <= 10000 && Number.isFinite(amount);
}

// Content Security Policy
export const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.stripe.com *.vercel.com",
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  "font-src 'self' fonts.gstatic.com",
  "img-src 'self' data: blob: *.stripe.com *.supabase.co",
  "connect-src 'self' *.stripe.com *.supabase.co *.vercel.com",
  "frame-src 'self' *.stripe.com",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

// Security headers
export const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP_HEADER,
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
} as const;

// Authentication utilities
export async function verifyUserSession(request: NextRequest): Promise<ValidationResult> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, isValid: false, isAdmin: false };
    }

    const token = authHeader.substring(7);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { user: null, isValid: false, isAdmin: false };
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('Profile')
      .select('isAdmin')
      .eq('id', user.id)
      .single();

    return {
      user,
      isValid: true,
      isAdmin: profile?.isAdmin || false,
    };
  } catch (error) {
    logger.error('Session verification failed', { error });
    return { user: null, isValid: false, isAdmin: false };
  }
}

// API route security middleware
export function createSecureApiHandler(
  handler: (request: NextRequest, context: ApiContext) => Promise<Response>,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    rateLimit?: keyof typeof RATE_LIMITS;
    validateInput?: (body: Record<string, unknown>) => boolean;
  } = {}
) {
  return async (request: NextRequest, context: ApiContext) => {
    try {
      // Rate limiting
      if (options.rateLimit) {
        const clientIp = getClientIP(request);
        const limit = RATE_LIMITS[options.rateLimit];
        
        if (!rateLimiter.isAllowed(clientIp, limit)) {
          logger.warn('Rate limit exceeded', { ip: clientIp, endpoint: request.url });
          return new Response(
            JSON.stringify({ error: 'Too many requests' }),
            { 
              status: 429,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }

      // Authentication check
      if (options.requireAuth || options.requireAdmin) {
        const { user, isValid, isAdmin } = await verifyUserSession(request);
        
        if (!isValid) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { 
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        if (options.requireAdmin && !isAdmin) {
          logger.warn('Admin access denied', { userId: user?.id });
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        // Add user to request context
        (request as AuthenticatedRequest).user = user;
        (request as AuthenticatedRequest).isAdmin = isAdmin;
      }

      // Input validation
      if (options.validateInput && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.json();
          if (!options.validateInput(body)) {
            return new Response(
              JSON.stringify({ error: 'Invalid input data' }),
              { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
          // Re-create request with validated body
          (request as AuthenticatedRequest).validatedBody = body;
        } catch (error) {
          return new Response(
            JSON.stringify({ error: 'Invalid JSON' }),
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }

      // Call the actual handler
      const response = await handler(request, context);
      
      // Add security headers to response
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      logger.error('API handler error', { error, url: request.url });
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

// File upload security
export function validateFileUpload(file: File): {
  isValid: boolean;
  error?: string;
} {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a'];

  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File too large' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type' };
  }

  // Check file extension
  const validExtensions = ['.mp3', '.wav', '.m4a'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  if (!validExtensions.includes(fileExtension)) {
    return { isValid: false, error: 'Invalid file extension' };
  }

  return { isValid: true };
}

// Environment validation
export function validateEnvironment(): {
  isValid: boolean;
  missingVars: string[];
  warnings: string[];
} {
  const requiredVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXTAUTH_SECRET',
  ];

  const optionalVars = [
    'SMTP_HOST',
    'SMTP_USER', 
    'SMTP_PASS',
    'ADMIN_EMAIL',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  const missingOptional = optionalVars.filter(varName => !process.env[varName]);

  const warnings: string[] = [];
  
  if (missingOptional.length > 0) {
    warnings.push(`Optional environment variables missing: ${missingOptional.join(', ')}`);
  }

  if (process.env.NODE_ENV === 'production') {
    if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      warnings.push('Using test Stripe keys in production');
    }
    if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
      warnings.push('NextAuth secret is too short for production');
    }
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings,
  };
}

// Security audit report
export function generateSecurityReport(): {
  timestamp: string;
  environment: string;
  checks: Record<string, { status: 'pass' | 'warn' | 'fail'; message: string }>;
  recommendations: string[];
} {
  const envValidation = validateEnvironment();
  
  const checks: Record<string, { status: 'pass' | 'warn' | 'fail'; message: string }> = {
    environment: {
      status: envValidation.isValid ? 'pass' : 'fail',
      message: envValidation.isValid 
        ? 'All required environment variables are set'
        : `Missing variables: ${envValidation.missingVars.join(', ')}`
    },
    csp: {
      status: 'pass',
      message: 'Content Security Policy configured'
    },
    headers: {
      status: 'pass',
      message: 'Security headers configured'
    },
    rateLimiting: {
      status: 'pass',
      message: 'Rate limiting implemented'
    },
    inputValidation: {
      status: 'pass',
      message: 'Input validation utilities available'
    },
    fileUpload: {
      status: 'pass',
      message: 'File upload validation implemented'
    }
  };

  const recommendations = [
    'Regularly rotate API keys and secrets',
    'Monitor rate limiting logs for potential attacks',
    'Implement additional API authentication for sensitive endpoints',
    'Regular security audits and dependency updates',
    'Set up automated security scanning',
    'Implement proper logging and alerting for security events'
  ];

  if (envValidation.warnings.length > 0) {
    recommendations.unshift(...envValidation.warnings);
  }

  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks,
    recommendations
  };
}