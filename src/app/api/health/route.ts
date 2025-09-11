// src\app\api\health\route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSystemHealth } from '@/lib/monitoring';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const dbResponseTime = Date.now() - startTime;
    
    // Get comprehensive system health
    const systemHealth = await getSystemHealth();
    
    // Add database timing to the health check
    systemHealth.checks.database = {
      status: 'healthy',
      responseTime: dbResponseTime,
    };
    
    const health = {
      ...systemHealth,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
    
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
    
  } catch (error) {
    const errorHealth = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        status: 'disconnected',
      },
    };
    
    return NextResponse.json(errorHealth, { status: 503 });
  }
}