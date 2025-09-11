// src\components\landing\HowItWorksSection.tsx
import { UserPlus, Edit3, Music2, Download, Link } from 'lucide-react';

const steps = [
  { icon: UserPlus, title: '1. Cadastre-se', description: 'Crie sua conta gratuita em poucos segundos' },
  { icon: Edit3, title: '2. Personalize', description: 'Preencha o formulário com nome, gostos e rotina da criança' },
  { icon: Music2, title: '3. Criamos', description: 'Nossa equipe produz a música personalizada em até 24h' },
  { icon: Download, title: '4. Aproveite', description: 'Baixe e ouça quantas vezes quiser na sua biblioteca' },
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
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="order-2 lg:order-1">
            <svg className="w-full max-w-md mx-auto h-auto" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 40c-33.2 0-60 26.8-60 60s26.8 60 60 60 60-26.8 60-60-26.8-60-60-60zm0 20c22.1 0 40 17.9 40 40s-17.9 40-40 40-40-17.9-40-40 17.9-40 40-40z" fill="url(#grad)" />
              <defs>
                <linearGradient id="grad" x1="0" x2="1">
                  <stop offset="0" stopColor="#ffd1dc" />
                  <stop offset="1" stopColor="#c7f9ff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="order-1 lg:order-2 grid sm:grid-cols-2 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="p-6 bg-white rounded-lg shadow border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="text-center">
          <Link
            href="/auth"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600"
          >
            Começar Agora
          </Link>
        </div>
      </div>
    </section>
  );
}