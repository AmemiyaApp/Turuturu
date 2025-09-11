// src\app\comprar-creditos\page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase/client';
import { AppHeader } from '@/components/layout/AppHeader';
import { logger } from '@/lib/logger';
import { useToast } from '@/lib/utils/useToast';
import { Check, Star, Zap, CreditCard, Loader } from 'lucide-react';
import { User } from '@supabase/supabase-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const creditPackages = [
  {
    name: '1 Crédito',
    price: 'R$ 99,90',
    amount: 99.90,
    credits: 1,
    features: ['1 música 100% personalizada', 'Entrega em até 48h', 'Acesso vitalício ao áudio'],
    popular: false,
  },
  {
    name: '3 Créditos',
    price: 'R$ 229,90',
    originalPrice: 'R$ 299,70',
    amount: 229.90,
    credits: 3,
    features: ['3 músicas personalizadas', 'Economia de 23%', 'Suporte prioritário'],
    popular: true,
  },
  {
    name: '5 Créditos',
    price: 'R$ 399,90',
    originalPrice: 'R$ 499,50',
    amount: 399.90,
    credits: 5,
    features: ['5 músicas personalizadas', 'Economia de 20%', 'Ideal para presentear'],
    popular: false,
  },
];

export default function ComprarCreditosPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth?error=Unauthorized');
        return;
      }
      setUser(user);
    }
    checkAuth();
  }, [router]);

  const handlePurchase = async (pkg: typeof creditPackages[0]) => {
    if (!user) {
      toast({ title: 'Erro', description: 'Você precisa estar logado.' });
      router.push('/auth');
      return;
    }

    setLoading(pkg.name);
    try {
      logger.info('Starting purchase process', { package: pkg.name, amount: pkg.amount });

      // Create Stripe Checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: pkg.amount,
          credits: pkg.credits,
          customerId: user.id,
          packageName: pkg.name,
        }),
      });

      const result = await response.json();
      if (!result.success || result.error) {
        throw new Error(result.error || result.details || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe não foi carregado');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: result.sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Erro ao redirecionar para pagamento');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Purchase error:', error);
      logger.error('Purchase failed', { 
        error: errorMessage,
        errorType: error instanceof Error ? error.name : 'Unknown',
        package: pkg.name,
        amount: pkg.amount,
        userId: user?.id,
        userEmail: user?.email,
        action: 'credit_purchase_attempt'
      });
      toast({ 
        title: 'Erro na Compra', 
        description: `Ocorreu um erro de processamento: ${errorMessage}` 
      });
    } finally {
      setLoading(null);
    }
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
                onClick={() => handlePurchase(pkg)}
                disabled={loading === pkg.name}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading === pkg.name ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Comprar Agora
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}