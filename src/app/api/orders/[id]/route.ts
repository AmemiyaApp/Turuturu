// src\app\api\orders\[id]\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { emailService } from '@/lib/email';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, updatedBy } = body;
    const orderId = params.id;

    // Validate required fields
    if (!status || !updatedBy) {
      return NextResponse.json(
        { error: 'Status and updatedBy are required' },
        { status: 400 }
      );
    }

    // Validate status enum
    const validStatuses = ['AWAITING_PAYMENT', 'PENDING', 'IN_PRODUCTION', 'COMPLETED', 'CANCELED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        updatedBy,
        updatedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    // Send status update email to customer
    try {
      await emailService.sendOrderStatusUpdate({
        customerName: updatedOrder.customer.name || 'Cliente',
        customerEmail: updatedOrder.customer.email,
        orderId: updatedOrder.id,
        prompt: updatedOrder.prompt,
        createdAt: updatedOrder.createdAt.toISOString(),
      }, status);
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Don't fail the status update if email fails
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            email: true,
            name: true,
          },
        },
        musicFile: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}