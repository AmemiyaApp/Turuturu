// src\components\landing\BenefitsSection.tsx
import { Brain, Heart, Mic, Users } from 'lucide-react';

const benefits = [
  {
    icon: Brain,
    title: 'Desenvolvimento Cognitivo',
    description: 'Estimula áreas do cérebro responsáveis pela linguagem, memória e criatividade através da personalização musical.',
  },
  {
    icon: Heart,
    title: 'Fortalece Autoestima',
    description: 'Ser protagonista da própria música aumenta a confiança e o senso de identidade da criança.',
  },
  {
    icon: Mic,
    title: 'Estímulo à Linguagem',
    description: 'Músicas personalizadas aceleram o desenvolvimento da fala e vocabulário de forma natural e divertida.',
  },
  {
    icon: Users,
    title: 'Vínculo Familiar',
    description: 'Momentos de escuta compartilhada fortalecem os laços afetivos entre pais e filhos.',
  },
];

export function BenefitsSection() {
  return (
    <section id="beneficios" className="py-20 px-4 bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Por que funciona?
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Baseado em estudos de neurociência infantil, o protagonismo musical acelera o desenvolvimento cognitivo e emocional das crianças de 0 a 7 anos
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="relative mb-8">
              <div className="relative w-full max-w-md mx-auto">
                {/* Video container with gradient border effect */}
                <div className="relative p-1 bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 rounded-3xl shadow-2xl">
                  <video 
                    className="w-full h-auto rounded-2xl object-cover aspect-[9/16] max-h-[450px]"
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                  >
                    <source src="/video2.mp4" type="video/mp4" />
                    {/* Fallback for browsers that don't support video */}
                    <div className="w-full h-[450px] bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                      <p className="text-gray-500">Seu navegador não suporta vídeo</p>
                    </div>
                  </video>
                </div>
                
                {/* Decorative floating elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-200/20 rounded-full blur-lg animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-pink-200/20 rounded-full blur-lg animate-pulse delay-1000"></div>
                
                {/* Additional decorative elements */}
                <div className="absolute top-1/3 -left-2 w-6 h-6 bg-purple-200/30 rounded-full blur-sm animate-bounce delay-500"></div>
              </div>
            </div>
            <div className="text-center lg:text-left">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                &quot;A música personalizada cria conexões neurais únicas&quot;
              </h3>
              <p className="text-gray-600">
                Observamos que quando a criança escuta seu próprio nome em uma canção, ela demonstra maior atenção, sorri mais e tenta cantar junto, sinais claros de engajamento e prazer na atividade musical.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="p-6 bg-white rounded-lg shadow border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="text-center mt-16">
          <div className="inline-block p-6 bg-white border border-blue-200/20 rounded-lg">
            <p className="text-sm text-gray-900 font-medium">
              🎵 <strong>Experiência real:</strong> Crianças que escutam músicas com seus nomes
              <span className="text-blue-500 font-semibold"> repetem palavras com mais facilidade </span>
              e demonstram maior interesse em atividades musicais
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}