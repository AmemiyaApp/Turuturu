// src\app\comprar-creditos\page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase/client';
import { AppHeader } from '@/components/layout/AppHeader';
import { logger } from '@/lib/logger';
import { useToast } from '@/lib/utils/useToast';
import { Check, Star, Zap, CreditCard, Loader } from 'lucide-react';
import { User } from '@supabase/supabase-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Debug: Log Stripe key availability (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Stripe key available:', !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

interface CreditPackage {
  productId: string;
  priceId: string;
  name: string;
  description: string;
  credits: number;
  amount: number;
  currency: string;
  formattedPrice: string;
  savings?: {
    amount: number;
    percentage: number;
    formattedSavings: string;
    originalPrice: string;
  };
}

// Default packages with fixed pricing
const creditPackages: CreditPackage[] = [
  {
    productId: 'prod_T1J900XxWttF8k',
    priceId: 'price_T1J900XxWttF8k',
    name: '1 Crédito',
    description: '1 música 100% personalizada',
    credits: 1,
    amount: 3490, // R$ 34,90 in cents
    currency: 'brl',
    formattedPrice: 'R$ 34,90',
  },
  {
    productId: 'prod_T1JAglJxaz4mD8',
    priceId: 'price_T1JAglJxaz4mD8',
    name: '3 Créditos',
    description: '3 músicas personalizadas com desconto',
    credits: 3,
    amount: 8990, // R$ 89,90 in cents
    currency: 'brl',
    formattedPrice: 'R$ 89,90',
    savings: {
      amount: 1480, // R$ 14,80 savings (104,70 - 89,90)
      percentage: 14,
      formattedSavings: 'R$ 14,80',
      originalPrice: 'R$ 104,70', // 3 * 34,90
    },
  },
  {
    productId: 'prod_T1JBkr7OhvkFzQ',
    priceId: 'price_T1JBkr7OhvkFzQ',
    name: '5 Créditos',
    description: '5 músicas personalizadas - melhor valor',
    credits: 5,
    amount: 12990, // R$ 129,90 in cents
    currency: 'brl',
    formattedPrice: 'R$ 129,90',
    savings: {
      amount: 4460, // R$ 44,60 savings (174,50 - 129,90)
      percentage: 26,
      formattedSavings: 'R$ 44,60',
      originalPrice: 'R$ 174,50', // 5 * 34,90
    },
  },
];

export default function ComprarCreditosPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<{
    id: string;
    prompt: string;
    createdAt: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth?error=Unauthorized');
        return;
      }
      setUser(user);
      
      // Check if there's a pending order
      const orderId = searchParams.get('orderId');
      if (orderId) {
        setPendingOrderId(orderId);
        // Optionally fetch order details
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const response = await fetch(`/api/orders/${orderId}`, {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
            });
            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                setOrderDetails(result.order);
              }
            }
          }
        } catch (error) {
          console.log('Could not fetch order details:', error);
        }
      }
    }
    checkAuth();
  }, [router, searchParams]);



  const handlePurchase = async (pkg: CreditPackage) => {
    if (!user) {
      toast({ title: 'Erro', description: 'Você precisa estar logado.' });
      router.push('/auth');
      return;
    }

    setLoading(pkg.name);
    try {
      logger.info('Starting purchase process', { package: pkg.name, amount: pkg.amount / 100 });

      // Create Stripe Checkout session with fixed amount
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: pkg.amount / 100, // Convert cents to reais
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
        throw new Error('Stripe não foi carregado. Verifique sua conexão com a internet.');
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
        amount: pkg.amount / 100,
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
        {/* Show pending order notification */}
        {pendingOrderId && (
          <div className="max-w-3xl mx-auto mb-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Pedido Salvo!
                </h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>
                    Seu pedido de música foi salvo com sucesso (ID: {pendingOrderId.slice(-8)}). 
                    Adquira créditos abaixo para que possamos começar a produção.
                  </p>
                  {orderDetails && (
                    <p className="mt-2 text-xs bg-white/70 p-2 rounded">
                      <strong>Resumo:</strong> {orderDetails.prompt.substring(0, 100)}...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Adquira mais Créditos
          </h1>
          <p className="text-lg text-gray-600">
            Cada crédito permite a criação de uma música personalizada e inesquecível. Escolha o pacote ideal para sua família!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {creditPackages.map((pkg, index) => {
            const isPopular = pkg.credits === 3; // Middle package is most popular
            const features = [
              `${pkg.credits} música${pkg.credits > 1 ? 's' : ''} 100% personalizada${pkg.credits > 1 ? 's' : ''}`,
            ];
            
            if (pkg.savings) {
              features.push(`Economia de ${pkg.savings.percentage}%`);
            }
            
            if (pkg.credits >= 3) {
              features.push('Suporte prioritário');
            }
            
            if (pkg.credits === 5) {
              features.push('Ideal para presentear');
            }

            return (
              <div
                key={pkg.productId || index}
                className={`relative p-8 bg-white rounded-lg shadow-lg ${
                  isPopular ? 'border-2 border-purple-500' : 'border'
                } h-full flex flex-col`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Mais Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                  {pkg.savings && (
                    <p className="text-gray-400 line-through">{pkg.savings.originalPrice}</p>
                  )}
                  <p className="text-4xl font-bold text-gray-900 my-2">
                    {pkg.formattedPrice}
                  </p>
                  {pkg.savings && (
                    <p className="text-sm font-medium text-green-600 flex items-center justify-center gap-1">
                      <Zap className="w-4 h-4" /> Economia de {pkg.savings.formattedSavings}
                    </p>
                  )}
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={loading === pkg.name}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-auto"
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
            );
          })}
        </div>
      </main>
    </div>
  );
}