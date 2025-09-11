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
              <svg className="w-full max-w-md mx-auto h-auto" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50c-27.6 0-50 22.4-50 50s22.4 50 50 50 50-22.4 50-50-22.4-50-50-50zm0 20c16.6 0 30 13.4 30 30s-13.4 30-30 30-30-13.4-30-30 13.4-30 30-30z" fill="url(#grad)" />
                <defs>
                  <linearGradient id="grad" x1="0" x2="1">
                    <stop offset="0" stopColor="#c7f9ff" />
                    <stop offset="1" stopColor="#ffd1dc" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-200/20 rounded-full blur-lg"></div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-pink-200/20 rounded-full blur-lg"></div>
            </div>
            <div className="text-center lg:text-left">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                &quot;A música personalizada cria conexões neurais únicas&quot;
              </h3>
              <p className="text-gray-600">
                Pesquisas mostram que quando a criança ouve seu próprio nome e elementos familiares em uma música, múltiplas áreas do cérebro são ativadas, potencializando aprendizado e desenvolvimento emocional.
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
              🧠 <strong>Pesquisa comprova:</strong> Crianças expostas a músicas personalizadas apresentam
              <span className="text-blue-500 font-semibold"> 40% mais desenvolvimento </span>
              na linguagem comparado a músicas genéricas
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}