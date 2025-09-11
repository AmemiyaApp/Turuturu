// src\components\landing\Header.tsx
'use client';

import Link from 'next/link';
import { Music } from 'lucide-react';
import { logger } from '@/lib/logger';

export function Header() {
  const handleNavClick = (section: string) => {
    logger.info('Header nav clicked', { section });
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Turuturu</h1>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#como-funciona" onClick={() => handleNavClick('Como Funciona')} className="text-gray-600 hover:text-gray-900">
            Como Funciona
          </Link>
          <Link href="#precos" onClick={() => handleNavClick('Preços')} className="text-gray-600 hover:text-gray-900">
            Preços
          </Link>
          <Link href="#beneficios" onClick={() => handleNavClick('Benefícios')} className="text-gray-600 hover:text-gray-900">
            Benefícios
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/auth" className="hidden sm:inline-flex px-4 py-2 text-gray-600 hover:text-gray-900">
            Entrar
          </Link>
          <Link
            href="/auth"
            onClick={() => handleNavClick('Criar Música')}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600"
          >
            Criar Música
          </Link>
        </div>
      </div>
    </header>
  );
}