// src\components\landing\PricingSection.tsx
'use client';

import Link from 'next/link';
import { Check, Star, Zap } from 'lucide-react';
import { logger } from '@/lib/logger';

const plans = [
  {
    name: 'Música Individual',
    price: 'R$ 99,90',
    description: 'Perfeito para experimentar',
    features: ['1 música personalizada', 'Entrega em 24h', 'Download ilimitado', 'Suporte por email'],
    buttonText: 'Criar Música',
    popular: false,
  },
  {
    name: 'Pacote Família',
    price: 'R$ 229,90',
    originalPrice: 'R$ 299,70',
    description: 'Mais popular entre as famílias',
    features: ['3 músicas personalizadas', 'Economia de R$ 69,80', 'Entrega em 24h cada', 'Download ilimitado', 'Suporte prioritário'],
    buttonText: 'Escolher Pacote',
    popular: true,
  },
  {
    name: 'Pacote Premium',
    price: 'R$ 449,90',
    originalPrice: 'R$ 599,40',
    description: 'Máximo valor para sua família',
    features: ['6 músicas personalizadas', 'Economia de R$ 149,50', 'Entrega em 24h cada', 'Download ilimitado', 'Suporte VIP', 'Revisões gratuitas'],
    buttonText: 'Escolher Premium',
    popular: false,
  },
];

export function PricingSection() {
  const handlePricingClick = (plan: string) => {
    logger.info('Pricing plan clicked', { plan });
  };

  return (
    <section id="precos" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Escolha seu plano
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pacotes especiais com desconto progressivo. Quanto mais músicas, maior a economia!
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 bg-white rounded-lg shadow ${plan.popular ? 'border-blue-500 scale-105' : 'border-gray-100 hover:shadow-lg'} border`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm">
                  <Star className="w-3 h-3 mr-1 inline" />
                  Mais Popular
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                <div className="mb-4">
                  {plan.originalPrice && (
                    <div className="text-sm text-gray-500 line-through mb-1">{plan.originalPrice}</div>
                  )}
                  <div className="text-3xl font-bold text-gray-900">{plan.price}</div>
                  {index > 0 && (
                    <div className="text-sm text-green-500 font-medium mt-1">
                      <Zap className="w-3 h-3 inline mr-1" />
                      Economia garantida!
                    </div>
                  )}
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth"
                onClick={() => handlePricingClick(plan.name)}
                className="block w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600"
              >
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <p className="text-sm text-gray-600">
            💳 Pagamento 100% seguro via Stripe • 🔒 Garantia de satisfação • 📱 Acesso vitalício
          </p>
        </div>
      </div>
    </section>
  );
}