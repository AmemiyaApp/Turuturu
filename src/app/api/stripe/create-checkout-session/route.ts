// src\app\api\stripe\create-checkout-session\route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { priceId, credits, customerId, packageName, amount } = body;

    // Support both new priceId format and legacy amount format
    if (!customerId || !packageName || (!priceId && !amount)) {
      return NextResponse.json(
        { error: 'Customer ID, package name, and either priceId or amount are required' },
        { status: 400 }
      );
    }

    // Verify customer exists in our database
    const customer = await prisma.profile.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    let sessionConfig;

    if (priceId) {
      // New approach: Use Stripe Price ID
      sessionConfig = {
        payment_method_types: ['card'] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment' as const,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/comprar-creditos?payment=cancelled`,
        metadata: {
          customerId,
          credits: credits?.toString() || '0',
          packageName,
          orderType: 'credit_purchase',
          customerEmail: customer.email,
          priceId,
        },
      };
    } else {
      // Legacy approach: Use hardcoded amounts (for backward compatibility)
      sessionConfig = {
        payment_method_types: ['card'] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: `Turuturu - ${packageName}`,
                description: `${credits} crédito${credits > 1 ? 's' : ''} para criação de música personalizada`,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment' as const,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/comprar-creditos?payment=cancelled`,
        metadata: {
          customerId,
          credits: credits?.toString() || '0',
          packageName,
          orderType: 'credit_purchase',
          customerEmail: customer.email,
        },
      };
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorType = error instanceof Error ? error.name : 'UnknownError';
    
    console.error('Error creating checkout session:', {
      error: errorMessage,
      errorType,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session', 
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
      },
      { status: 500 }
    );
  }
}