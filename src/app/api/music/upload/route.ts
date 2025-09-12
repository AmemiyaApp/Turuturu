// src\app\api\music\upload\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { emailService } from '@/lib/email';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const orderId = formData.get('orderId') as string;
    const file = formData.get('file') as File;
    const updatedBy = formData.get('updatedBy') as string;
    const filename = formData.get('filename') as string;

    // Validate required fields
    if (!orderId || !file || !updatedBy) {
      return NextResponse.json(
        { error: 'Order ID, file, and updatedBy are required' },
        { status: 400 }
      );
    }

    // Validate file type (audio files only)
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only audio files are allowed.' },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // For MVP, we'll store the file in the public directory
    // In production, you should use a proper file storage service like AWS S3
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `music_${orderId}_${timestamp}.${fileExtension}`;
    const filePath = `./public/uploads/${uniqueFilename}`;
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Write file to disk
    fs.writeFileSync(path.join(process.cwd(), 'public', 'uploads', uniqueFilename), buffer);

    // Create music file record (now supports multiple files per order)
    const musicFile = await prisma.musicFile.create({
      data: {
        orderId,
        url: `/uploads/${uniqueFilename}`,
        filename: filename || file.name,
        updatedBy,
      },
    });

    // Update order status to IN_PRODUCTION if it was PENDING
    if (order.status === 'PENDING') {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'IN_PRODUCTION',
          updatedBy,
          updatedAt: new Date(),
        },
      });
    }

    // Get order with customer details for email notification
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            email: true,
            name: true,
          },
        },
        musicFiles: true,
      },
    });

    // Send music delivery email if this is the first file and order becomes completed
    if (updatedOrder?.musicFiles.length === 1) {
      try {
        await emailService.sendMusicDelivery({
          customerName: updatedOrder.customer.name || 'Cliente',
          customerEmail: updatedOrder.customer.email,
          orderId: updatedOrder.id,
          prompt: updatedOrder.prompt,
          createdAt: updatedOrder.createdAt.toISOString(),
          musicFileUrl: `${process.env.NEXTAUTH_URL}/uploads/${uniqueFilename}`,
        });
      } catch (emailError) {
        console.error('Failed to send music delivery email:', emailError);
        // Don't fail the upload if email fails
      }
    }

    return NextResponse.json({
      success: true,
      musicFile,
      message: 'Music file uploaded successfully',
    });

  } catch (error) {
    console.error('Error uploading music file:', error);
    return NextResponse.json(
      { error: 'Failed to upload music file' },
      { status: 500 }
    );
  }
}