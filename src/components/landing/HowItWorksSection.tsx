// src\components\landing\HowItWorksSection.tsx
import Link from 'next/link';
import { UserPlus, CreditCard, Music2, PlayCircle, ArrowRight } from 'lucide-react';

const steps = [
  { icon: UserPlus, title: '1. Cadastre-se', description: 'Crie sua conta gratuita em poucos segundos' },
  { icon: CreditCard, title: '2. Adquira Créditos', description: 'Compre créditos para criar suas músicas personalizadas' },
  { icon: Music2, title: '3. Crie sua música', description: 'Use nossos créditos para gerar músicas únicas e personalizadas' },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-20 px-4 bg-gray-100/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Como funciona?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Um processo simples e mágico para criar a música personalizada perfeita para seu filho
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-12 items-stretch mb-16">
          <div className="order-2 lg:order-1">
            <div className="relative mb-8 h-full flex items-center">
              <div className="relative w-full max-w-md mx-auto">
                {/* Video container with gradient border effect */}
                <div className="relative p-1 bg-gradient-to-br from-green-200 via-blue-200 to-purple-200 rounded-3xl shadow-2xl">
                  <video 
                    className="w-full h-auto rounded-2xl object-cover aspect-[9/16] max-h-[450px]"
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                  >
                    <source src="/video3.mp4" type="video/mp4" />
                    {/* Fallback for browsers that don't support video */}
                    <div className="w-full h-[450px] bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl flex items-center justify-center">
                      <p className="text-gray-500">Seu navegador não suporta vídeo</p>
                    </div>
                  </video>
                </div>
                
                {/* Decorative floating elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-green-200/20 rounded-full blur-lg animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-200/20 rounded-full blur-lg animate-pulse delay-1000"></div>
                
                {/* Additional decorative elements */}
                <div className="absolute top-1/3 -left-2 w-6 h-6 bg-purple-200/30 rounded-full blur-sm animate-bounce delay-500"></div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 flex flex-col justify-center">
            {/* Layout Desktop com setas */}
            <div className="hidden md:flex flex-row items-center gap-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className="p-6 bg-white rounded-lg shadow border border-gray-100 flex-1 min-w-[200px]">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex items-center justify-center mx-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Layout Mobile sem setas */}
            <div className="md:hidden space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="p-6 bg-white rounded-lg shadow border border-gray-100">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <step.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  </div>
                  {/* Linha conectora vertical no mobile */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <div className="w-0.5 h-6 bg-gradient-to-b from-blue-500 to-purple-500 opacity-50"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="text-center">
          <Link
            href="/criar-musica"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <PlayCircle className="w-5 h-5" />
            Criar Minha Primeira Música
          </Link>
        </div>
      </div>
    </section>
  );
}