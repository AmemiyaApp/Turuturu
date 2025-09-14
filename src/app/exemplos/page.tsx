'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';

interface ExemploData {
  id: number;
  nome: string;
  foto: string;
  musica: string;
  testemunhal: string;
  genero: string;
  descricao: string;
  dataPublicacao: string;
}

const exemplos: ExemploData[] = [
  {
    id: 1,
    nome: "Maria Silva",
    foto: "/exemplos/exemplo1.png",
    musica: "/exemplos/exemplo1.mp3",
    testemunhal: "Incrível! A Turuturu AI criou exatamente o que eu estava imaginando. A música ficou com um feeling perfeito para o meu projeto. Recomendo muito!",
    genero: "Pop Eletrônico",
    descricao: "Uma fusão perfeita entre elementos pop e eletrônicos, com melodias cativantes e batidas envolventes.",
    dataPublicacao: "Março 2024"
  },
  {
    id: 2,
    nome: "Carlos Mendes",
    foto: "/exemplos/exemplo2.png",
    musica: "/exemplos/Exemplo2.mp3",
    testemunhal: "Como produtor musical, ficei impressionado com a qualidade e criatividade da AI. Economizou horas de trabalho e o resultado superou minhas expectativas!",
    genero: "Ambient Chill",
    descricao: "Atmosfera relaxante com texturas sonoras suaves, perfeita para momentos de contemplação e relaxamento.",
    dataPublicacao: "Abril 2024"
  }
];

export default function ExemplosPage() {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const handlePlay = (id: number, musicaSrc: string) => {
    // Parar música atual se houver
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    if (playingId === id) {
      // Se estiver tocando a mesma música, parar
      setPlayingId(null);
      setCurrentAudio(null);
    } else {
      // Tocar nova música
      const audio = new Audio(musicaSrc);
      audio.addEventListener('ended', () => {
        setPlayingId(null);
        setCurrentAudio(null);
      });
      audio.play();
      setCurrentAudio(audio);
      setPlayingId(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <div className="py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Histórias de <span className="text-purple-600">Sucesso</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Descubra como nossos clientes transformaram suas ideias em músicas incríveis
          </p>
          <div className="w-24 h-1 bg-purple-600 mx-auto rounded-full"></div>
        </div>
      </div>

      {/* Exemplos Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {exemplos.map((exemplo) => (
            <div key={exemplo.id} className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300">
              {/* Foto do Cliente */}
              <div className="relative h-80 md:h-96 lg:h-[500px]">
                <Image
                  src={exemplo.foto}
                  alt={`Foto de ${exemplo.nome}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-2xl font-bold">{exemplo.nome}</h3>
                  <p className="text-purple-200">{exemplo.genero}</p>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-8">
                {/* Player de Música */}
                <div className="mb-6">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handlePlay(exemplo.id, exemplo.musica)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                          playingId === exemplo.id 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                        }`}
                      >
                        {playingId === exemplo.id ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        )}
                      </button>
                      <div>
                        <p className="font-semibold text-gray-900">Ouvir Exemplo</p>
                        <p className="text-sm text-gray-500">{exemplo.genero}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{exemplo.dataPublicacao}</p>
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Sobre a Música</h4>
                  <p className="text-gray-600">{exemplo.descricao}</p>
                </div>

                {/* Testemunhal */}
                <div className="border-l-4 border-purple-500 pl-6">
                  <svg className="w-8 h-8 text-purple-400 mb-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                  <blockquote className="text-gray-700 italic mb-3">
                    &ldquo;{exemplo.testemunhal}&rdquo;
                  </blockquote>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    <cite className="font-semibold text-purple-600">{exemplo.nome}</cite>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para Criar Sua Própria História?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Junte-se a centenas de criadores que já transformaram suas ideias em música
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/criar-musica"
              className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              Começar Agora
            </Link>
            <Link 
              href="/comprar-creditos"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-purple-600 transition-colors"
            >
              Ver Preços
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            Todas as músicas foram criadas com Turuturu AI. Os exemplos são reais e representam o trabalho de nossos clientes.
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}