// src\app\api\music\[id]\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { updatedBy } = body;
    const { id: musicFileId } = await params;

    if (!updatedBy) {
      return NextResponse.json(
        { error: 'updatedBy is required' },
        { status: 400 }
      );
    }

    // Find the music file
    const musicFile = await prisma.musicFile.findUnique({
      where: { id: musicFileId },
    });

    if (!musicFile) {
      return NextResponse.json(
        { error: 'Music file not found' },
        { status: 404 }
      );
    }

    // Delete the physical file
    try {
      const filePath = path.join(process.cwd(), 'public', musicFile.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete the database record
    await prisma.musicFile.delete({
      where: { id: musicFileId },
    });

    return NextResponse.json({
      success: true,
      message: 'Music file deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting music file:', error);
    return NextResponse.json(
      { error: 'Failed to delete music file' },
      { status: 500 }
    );
  }
}