// src\components\layout\AppHeader.tsx
// src/components/layout/AppHeader.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { LayoutDashboard, LogOut, Music, PlusCircle, Ticket, Star } from 'lucide-react';

export function AppHeader() {
  const [credits, setCredits] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchCredits() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (user && session?.access_token) {
          // Use the API endpoint to fetch profile (bypasses RLS)
          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });

          if (response.ok) {
            const profileData = await response.json();
            if (profileData.success) {
              setCredits(profileData.profile.credits);
              return;
            }
          }
          
          // Fallback: set to 0 if API fails
          logger.error('Failed to fetch credits for header', { userId: user.id });
          setCredits(0);
        }
      } catch (err) {
        logger.error('Unexpected error fetching credits for header', { error: String(err) });
        setCredits(0);
      }
    }
    fetchCredits();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="Turuturu Logo" 
              width={160} 
              height={40} 
              className="h-10 w-auto" 
              priority
              quality={95}
            />
          </Link>
        </div>

        {/* Navegação e Ações do Usuário */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Painel
            </Link>
            <Link href="/criar-musica" className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Criar Música
            </Link>
            <Link href="/exemplos" className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2">
              <Star className="w-4 h-4" />
              Exemplos
            </Link>
          </nav>
          
          <div className="flex items-center gap-3">
            {credits !== null && (
              <Link 
                href="/comprar-creditos" 
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
              >
                <Ticket className="w-5 h-5 text-purple-500" />
                <span className="font-bold text-purple-700">{credits}</span>
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}