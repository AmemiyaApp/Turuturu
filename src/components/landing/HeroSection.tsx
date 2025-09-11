'use client';

import Link from 'next/link';
import { PlayCircle, Heart, Star } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useToast } from '@/lib/utils/useToast';

export function HeroSection() {
  const { toast } = useToast();
  const handleCTAClick = (action: string) => {
    logger.info('Hero CTA clicked', { action });
  };
  const handleTestToast = () => {
    toast({ title: 'Teste', description: 'Toast funcionando!' });
    logger.info('Test toast triggered');
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
                href="#beneficios"
                onClick={() => handleCTAClick('Ver Exemplos')}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 border border-gray-300 rounded-lg hover:bg-white/30"
              >
                <Heart className="w-5 h-5" />
                Ver Exemplos
              </Link>
              <button
                onClick={handleTestToast}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg"
              >
                Testar Toast
              </button>
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
            <svg className="w-full max-w-md mx-auto h-auto" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="80" fill="url(#grad)" />
              <path d="M100 60c-22 0-40 18-40 40s18 40 40 40 40-18 40-40-18-40-40-40zm0 10c16.6 0 30 13.4 30 30s-13.4 30-30 30-30-13.4-30-30 13.4-30 30-30z" fill="#FFF" />
              <defs>
                <linearGradient id="grad" x1="0" x2="1">
                  <stop offset="0" stopColor="#c7f9ff" />
                  <stop offset="1" stopColor="#ffd1dc" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-200/20 rounded-full blur-lg"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-pink-200/20 rounded-full blur-lg"></div>
          </div>
        </div>
      </div>
    </section>
  );
}