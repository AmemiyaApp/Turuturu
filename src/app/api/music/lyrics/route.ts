// src\app\api\music\lyrics\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { musicFileId, lyrics, updatedBy } = body;

    if (!musicFileId || !updatedBy) {
      return NextResponse.json(
        { error: 'Music file ID and updatedBy are required' },
        { status: 400 }
      );
    }

    // Find the music file
    const musicFile = await prisma.musicFile.findUnique({
      where: { id: musicFileId },
      include: { order: true }
    });

    if (!musicFile) {
      return NextResponse.json(
        { error: 'Music file not found' },
        { status: 404 }
      );
    }

    // Update music file with lyrics
    await prisma.musicFile.update({
      where: { id: musicFileId },
      data: { 
        lyrics: lyrics || null,
        updatedBy 
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Lyrics saved successfully'
    });

  } catch (error) {
    console.error('Error saving lyrics:', error);
    return NextResponse.json(
      { error: 'Failed to save lyrics' },
      { status: 500 }
    );
  }
}