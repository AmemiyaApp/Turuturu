// src\components\layout\AppHeader.tsx
// src/components/layout/AppHeader.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { LayoutDashboard, LogOut, Music, PlusCircle, Ticket } from 'lucide-react';

export function AppHeader() {
  const [credits, setCredits] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchCredits() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile, error } = await supabase
            .from('Profile')
            .select('credits')
            .eq('id', user.id)
            .single();

          if (error) {
            logger.error('Failed to fetch credits for header', { error: error.message });
            setCredits(0);
          } else {
            setCredits(profile.credits);
          }
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
        {/* Logo e Navegação Principal */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <h1 className="hidden sm:block text-xl font-bold text-gray-900">Turuturu</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Painel
            </Link>
            <Link href="/criar-musica" className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Criar Música
            </Link>
          </nav>
        </div>

        {/* Ações do Usuário e Créditos */}
        <div className="flex items-center gap-3">
          {credits !== null && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full border border-purple-200">
              <Ticket className="w-5 h-5 text-purple-500" />
              <span className="font-bold text-purple-700">{credits}</span>
              <Link href="/comprar-creditos" className="ml-1 text-xs text-purple-600 hover:underline">
                +
              </Link>
            </div>
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
    </header>
  );
}