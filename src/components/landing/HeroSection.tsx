// src\components\landing\HeroSection.tsx
'use client';

import Link from 'next/link';
import { PlayCircle, Heart, Star } from 'lucide-react';
import { logger } from '@/lib/logger';

export function HeroSection() {
  const handleCTAClick = (action: string) => {
    logger.info('Hero CTA clicked', { action });
  };

  return (
    <section className="bg-gradient-to-br from-blue-100 to-purple-100 py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Star className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900">
                Baseado na neurociência infantil
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transforme seu filho no
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"> protagonista </span>
              da música
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-xl lg:max-w-none">
              Crie músicas infantis 100% personalizadas com nome, rotina e gostos. Uma experiência mágica que estimula autoestima, linguagem e criatividade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/auth"
                onClick={() => handleCTAClick('Criar Primeira Música')}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600"
              >
                <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Criar Primeira Música
              </Link>
              <Link
                href="/exemplos"
                onClick={() => handleCTAClick('Ver Exemplos')}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 border border-gray-300 rounded-lg hover:bg-white/30"
              >
                <Heart className="w-5 h-5" />
                Ver Exemplos
              </Link>
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-6 mt-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Entrega em 24h
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Garantia de satisfação
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative w-full max-w-md mx-auto">
              {/* Video container with gradient border effect */}
              <div className="relative p-1 bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 rounded-3xl shadow-2xl">
                <video 
                  className="w-full h-auto rounded-2xl object-cover aspect-[9/16] max-h-[500px]"
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                >
                  <source src="/hero.mp4" type="video/mp4" />
                  {/* Fallback for browsers that don't support video */}
                  <div className="w-full h-[500px] bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                    <p className="text-gray-500">Seu navegador não suporta vídeo</p>
                  </div>
                </video>
              </div>
              
              {/* Decorative floating elements - maintaining original design */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-200/20 rounded-full blur-lg animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-pink-200/20 rounded-full blur-lg animate-pulse delay-1000"></div>
              
              {/* Additional decorative elements for enhanced visual appeal */}
              <div className="absolute top-1/4 -left-2 w-8 h-8 bg-purple-200/30 rounded-full blur-sm animate-bounce delay-500"></div>
              <div className="absolute bottom-1/4 -right-2 w-12 h-12 bg-blue-200/25 rounded-full blur-md animate-pulse delay-700"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}