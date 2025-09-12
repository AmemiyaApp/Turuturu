// src\app\api\auth\profile\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { user } = await request.json();

    if (!user || !user.id || !user.email) {
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 400 }
      );
    }

    // Try to create or update profile using Prisma (bypasses RLS)
    const profile = await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        isAdmin: false,
        credits: 0,
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        credits: profile.credits,
        isAdmin: profile.isAdmin,
      },
    });

  } catch (error) {
    console.error('Error creating/updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}

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

    // Get profile using Prisma (bypasses RLS)
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        credits: true,
        isAdmin: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}