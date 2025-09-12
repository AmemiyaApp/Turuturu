// src\app\api\orders\user\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    // Extract the token and verify it with Supabase
    const token = authHeader.replace('Bearer ', '');
    
    // Create a temporary client with the user's token
    const tempSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data: { user }, error } = await tempSupabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user's orders using Prisma (bypasses RLS)
    const orders = await prisma.order.findMany({
      where: { customerId: user.id },
      include: {
        musicFiles: {
          select: {
            id: true,
            url: true,
            filename: true,
            title: true,
            createdAt: true,
            lyrics: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      orders,
    });

  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}