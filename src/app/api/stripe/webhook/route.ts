// src\app\api\stripe\webhook\route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';
import { emailService } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const prisma = new PrismaClient();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { customerId, credits, packageName, orderType } = session.metadata || {};
  
  if (orderType === 'credit_purchase' && customerId && credits) {
    // Add credits to customer
    const creditsToAdd = parseInt(credits, 10);
    
    await prisma.profile.update({
      where: { id: customerId },
      data: {
        credits: {
          increment: creditsToAdd,
        },
      },
    });

    // Get customer details for email
    const customer = await prisma.profile.findUnique({
      where: { id: customerId },
    });

    if (customer) {
      try {
        await emailService.sendCreditPurchaseConfirmation({
          customerName: customer.name || 'Cliente',
          customerEmail: customer.email,
          creditsAdded: creditsToAdd,
          packageName: packageName || 'Pacote de Créditos',
          totalCredits: customer.credits + creditsToAdd,
        });
      } catch (emailError) {
        console.error('Failed to send credit purchase confirmation email:', emailError);
      }
    }

    console.log(`Added ${creditsToAdd} credits to customer ${customerId} via checkout`);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { customerId, orderType } = paymentIntent.metadata;
  
  if (orderType === 'credit_purchase') {
    // Handle credit purchase
    const amount = paymentIntent.amount / 100; // Convert from cents
    const credits = calculateCreditsFromAmount(amount);
    
    await prisma.profile.update({
      where: { id: customerId },
      data: {
        credits: {
          increment: credits,
        },
      },
    });

    console.log(`Added ${credits} credits to customer ${customerId}`);
  } else if (orderType === 'music_creation') {
    // Handle music order payment
    const updatedOrders = await prisma.order.updateMany({
      where: {
        customerId,
        paymentStatus: 'PENDING',
      },
      data: {
        paymentStatus: 'PAID',
        status: 'PENDING',
      },
    });

    // Get customer details for email
    const customer = await prisma.profile.findUnique({
      where: { id: customerId },
    });

    // Get the updated order for email notification
    const order = await prisma.order.findFirst({
      where: {
        customerId,
        paymentStatus: 'PAID',
        status: 'PENDING',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (customer && order) {
      try {
        await emailService.sendAdminNotification({
          customerName: customer.name || 'Cliente',
          customerEmail: customer.email,
          orderId: order.id,
          prompt: order.prompt,
          createdAt: order.createdAt.toISOString(),
        }, 'payment_confirmed');
      } catch (emailError) {
        console.error('Failed to send admin payment notification:', emailError);
      }
    }

    console.log(`Payment confirmed for music order by customer ${customerId}`);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { customerId } = paymentIntent.metadata;
  
  await prisma.order.updateMany({
    where: {
      customerId,
      paymentStatus: 'PENDING',
    },
    data: {
      paymentStatus: 'FAILED',
      status: 'CANCELED',
    },
  });

  console.log(`Payment failed for customer ${customerId}`);
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const { customerId } = paymentIntent.metadata;
  
  await prisma.order.updateMany({
    where: {
      customerId,
      paymentStatus: 'PENDING',
    },
    data: {
      paymentStatus: 'FAILED',
      status: 'CANCELED',
    },
  });

  console.log(`Payment canceled for customer ${customerId}`);
}

function calculateCreditsFromAmount(amount: number): number {
  // Calculate credits based on BRL amounts
  // R$99.90 = 1 credit, R$229.90 = 3 credits, R$399.90 = 5 credits
  if (amount >= 399.90) return 5;
  if (amount >= 229.90) return 3;
  if (amount >= 99.90) return 1;
  return Math.floor(amount / 99.90); // fallback calculation
}