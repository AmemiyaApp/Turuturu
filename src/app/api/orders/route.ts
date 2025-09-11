// src\app\api\orders\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/lib/supabase/client';
import { emailService } from '@/lib/email';
import { getCachedData, CacheKeys, invalidateCache } from '@/lib/cache';
import { sanitizeInput, validateUUID } from '@/lib/security';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, customerId } = body;

    // Validate required fields
    if (!prompt || !customerId) {
      return NextResponse.json(
        { error: 'Prompt and customer ID are required' },
        { status: 400 }
      );
    }

    // Validate customer ID format
    if (!validateUUID(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customer ID format' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedPrompt = sanitizeInput(prompt);

    // Verify customer exists and has sufficient credits
    const customer = await prisma.profile.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if customer has sufficient credits (assuming 1 credit per music creation)
    const requiredCredits = 1;
    if (customer.credits < requiredCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits.' },
        { status: 400 }
      );
    }

    // Create the order
    const order = await prisma.order.create({
      data: {
        prompt: sanitizedPrompt,
        customerId,
        status: 'PENDING',
        paymentStatus: 'PAID', // Using credits, so payment is already handled
      },
    });

    // Deduct credits from customer
    await prisma.profile.update({
      where: { id: customerId },
      data: {
        credits: {
          decrement: requiredCredits,
        },
      },
    });

    // Send order confirmation email
    try {
      await emailService.sendOrderConfirmation({
        customerName: customer.name || 'Cliente',
        customerEmail: customer.email,
        orderId: order.id,
        prompt: sanitizedPrompt,
        createdAt: order.createdAt.toISOString(),
      });

      // Send admin notification
      await emailService.sendAdminNotification({
        customerName: customer.name || 'Cliente',
        customerEmail: customer.email,
        orderId: order.id,
        prompt: sanitizedPrompt,
        createdAt: order.createdAt.toISOString(),
      }, 'new_order');
    } catch (emailError) {
      console.error('Failed to send email notifications:', emailError);
      // Continue execution - don't fail order creation
    }

    // Invalidate relevant caches
    invalidateCache('order');
    invalidateCache('profile');
    invalidateCache('stats');

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        createdAt: order.createdAt,
      },
      remainingCredits: customer.credits - requiredCredits,
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const isAdmin = searchParams.get('isAdmin') === 'true';

    let orders;

    if (isAdmin) {
      // Admin can see all orders - use caching
      orders = await getCachedData(
        CacheKeys.adminOrders(),
        async () => {
          return await prisma.order.findMany({
            include: {
              customer: {
                select: {
                  email: true,
                  name: true,
                },
              },
              musicFile: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          });
        },
        { ttl: 60 } // Cache for 1 minute for admin
      );
    } else if (customerId) {
      // Customer can only see their own orders - use caching
      orders = await getCachedData(
        CacheKeys.userOrders(customerId),
        async () => {
          return await prisma.order.findMany({
            where: { customerId },
            include: {
              musicFile: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          });
        },
        { ttl: 300 } // Cache for 5 minutes for users
      );
    } else {
      return NextResponse.json(
        { error: 'Customer ID is required for non-admin requests' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orders,
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}