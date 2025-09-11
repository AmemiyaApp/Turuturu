// src\app\api\security\audit\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateSecurityReport } from '@/lib/security';
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

export async function GET(request: NextRequest) {
  try {
    // Basic authentication check - in production, implement proper admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !process.env.ADMIN_EMAIL) {
      logger.warn('Unauthorized security audit access attempt', {
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent')
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const securityReport = generateSecurityReport();
    
    logger.info('Security audit performed', {
      timestamp: securityReport.timestamp,
      environment: securityReport.environment
    });

    return NextResponse.json(securityReport);
  } catch (error) {
    logger.error('Security audit failed', { error });
    return NextResponse.json(
      { error: 'Failed to generate security report' },
      { status: 500 }
    );
  }
}