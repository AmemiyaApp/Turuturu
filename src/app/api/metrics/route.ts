// src\app\api\metrics\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector, performanceMonitor } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    // Basic authentication check (you might want to implement proper API key auth)
    const authHeader = request.headers.get('authorization');
    const adminEmail = process.env.ADMIN_EMAIL;
    
    // For MVP, simple check - in production, implement proper API key authentication
    if (!authHeader || !adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metrics = {
      application: metricsCollector.getMetrics(),
      performance: performanceMonitor.getAllMetrics(),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metric, value = 1 } = body;

    if (!metric) {
      return NextResponse.json(
        { error: 'Metric name is required' },
        { status: 400 }
      );
    }

    // Validate metric name
    const validMetrics = [
      'userRegistrations',
      'ordersCreated', 
      'paymentsProcessed',
      'emailsSent',
      'errors',
      'activeUsers'
    ];

    if (!validMetrics.includes(metric)) {
      return NextResponse.json(
        { error: 'Invalid metric name' },
        { status: 400 }
      );
    }

    metricsCollector.increment(metric, value);

    const currentMetrics = metricsCollector.getMetrics();
    const metricValue = currentMetrics[metric as keyof typeof currentMetrics];

    return NextResponse.json({ 
      success: true,
      metric,
      value,
      total: metricValue
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to record metric' },
      { status: 500 }
    );
  }
}