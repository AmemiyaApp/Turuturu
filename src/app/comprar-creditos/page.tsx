// src\app\comprar-creditos\page.tsx
// src/app/comprar-creditos/page.tsx
'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { logger } from '@/lib/logger';
import { Check, Star, Zap } from 'lucide-react';

// IMPORTANTE: Substitua pelos IDs de Preço que você criou no seu painel Stripe!
const creditPackages = [
  {
    name: '1 Crédito',
    price: 'R$ 99,90',
    priceId: 'price_SEU_ID_DO_PACOTE_DE_1_CREDITO',
    features: ['1 música 100% personalizada', 'Entrega em até 48h', 'Acesso vitalício ao áudio'],
    popular: false,
  },
  {
    name: '3 Créditos',
    price: 'R$ 229,90',
    originalPrice: 'R$ 299,70',
    priceId: 'price_SEU_ID_DO_PACOTE_DE_3_CREDITOS',
    features: ['3 músicas personalizadas', 'Economia de 23%', 'Suporte prioritário'],
    popular: true,
  },
  {
    name: '5 Créditos',
    price: 'R$ 399,90',
    originalPrice: 'R$ 499,50',
    priceId: 'price_SEU_ID_DO_PACOTE_DE_5_CREDITOS',
    features: ['5 músicas personalizadas', 'Economia de 20%', 'Ideal para presentear'],
    popular: false,
  },
];

export default function ComprarCreditosPage() {
  const handlePurchase = (priceId: string) => {
    logger.info('Attempting to purchase package', { priceId });
    // A lógica de checkout será implementada na próxima etapa
    alert(`Iniciando compra para o Price ID: ${priceId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Adquira mais Créditos
          </h1>
          <p className="text-lg text-gray-600">
            Cada crédito permite a criação de uma música personalizada e inesquecível. Escolha o pacote ideal para sua família!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          {creditPackages.map((pkg) => (
            <div
              key={pkg.name}
              className={`relative p-8 bg-white rounded-lg shadow-lg ${pkg.popular ? 'border-2 border-purple-500' : 'border'}`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  Mais Popular
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                {pkg.originalPrice && (
                  <p className="text-gray-400 line-through">{pkg.originalPrice}</p>
                )}
                <p className="text-4xl font-bold text-gray-900 my-2">{pkg.price}</p>
                {pkg.popular && (
                  <p className="text-sm font-medium text-green-600 flex items-center justify-center gap-1">
                    <Zap className="w-4 h-4" /> Economia Garantida
                  </p>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePurchase(pkg.priceId)}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Comprar Agora
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}