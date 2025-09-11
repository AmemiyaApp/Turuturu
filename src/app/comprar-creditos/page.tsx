// src\app\comprar-creditos\page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase/client';
import { AppHeader } from '@/components/layout/AppHeader';
import { logger } from '@/lib/logger';
import { useToast } from '@/lib/utils/useToast';
import { Check, Star, Zap, CreditCard, Loader, RefreshCw } from 'lucide-react';
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

// Default packages for loading state
const defaultPackages: CreditPackage[] = [
  {
    productId: '',
    priceId: '',
    name: '1 Crédito',
    description: '1 música 100% personalizada',
    credits: 1,
    amount: 9990,
    currency: 'brl',
    formattedPrice: 'R$ 99,90',
  },
  {
    productId: '',
    priceId: '',
    name: '5 Créditos',
    description: '5 músicas personalizadas com desconto',
    credits: 5,
    amount: 39990,
    currency: 'brl',
    formattedPrice: 'R$ 399,90',
  },
  {
    productId: '',
    priceId: '',
    name: '10 Créditos',
    description: '10 músicas personalizadas - melhor valor',
    credits: 10,
    amount: 69990,
    currency: 'brl',
    formattedPrice: 'R$ 699,90',
  },
];

export default function ComprarCreditosPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>(defaultPackages);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth?error=Unauthorized');
        return;
      }
      setUser(user);
      
      // Check for cached pricing first
      const cached = localStorage.getItem('turuturu-pricing');
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          const cacheAge = Date.now() - new Date(cachedData.cachedAt).getTime();
          
          // Use cache if less than 5 minutes old
          if (cacheAge < 300000) {
            setCreditPackages(cachedData.packages);
            setLastUpdated(cachedData.lastUpdated);
            setLoadingPrices(false);
            return; // Don't fetch if cache is fresh
          }
        } catch (e) {
          // Invalid cache, continue with fetch
          console.warn('Invalid pricing cache:', e);
        }
      }
      
      // Fetch fresh pricing
      fetchPricing();
    }
    checkAuth();
  }, [router, fetchPricing]);

  const fetchPricing = useCallback(async () => {
    setLoadingPrices(true);
    try {
      const response = await fetch('/api/stripe/pricing', {
        // Cache for 5 minutes to avoid unnecessary requests
        next: { revalidate: 300 }
      });
      const data = await response.json();
      
      if (data.success && data.packages) {
        setCreditPackages(data.packages);
        setLastUpdated(data.lastUpdated);
        
        // Cache in localStorage for faster loading on next visit
        localStorage.setItem('turuturu-pricing', JSON.stringify({
          packages: data.packages,
          lastUpdated: data.lastUpdated,
          cachedAt: new Date().toISOString()
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch pricing');
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      
      // Try to load from cache if fetch fails
      const cached = localStorage.getItem('turuturu-pricing');
      if (cached) {
        const cachedData = JSON.parse(cached);
        const cacheAge = Date.now() - new Date(cachedData.cachedAt).getTime();
        
        // Use cache if less than 1 hour old
        if (cacheAge < 3600000) {
          setCreditPackages(cachedData.packages);
          setLastUpdated(cachedData.lastUpdated);
          toast({
            title: 'Usando preços em cache',
            description: 'Conecte-se à internet para atualizar os preços.',
          });
          return;
        }
      }
      
      toast({
        title: 'Erro ao carregar preços',
        description: 'Usando preços padrão. Tente recarregar a página.',
      });
    } finally {
      setLoadingPrices(false);
    }
  }, [toast]);



  const handlePurchase = async (pkg: CreditPackage) => {
    if (!user) {
      toast({ title: 'Erro', description: 'Você precisa estar logado.' });
      router.push('/auth');
      return;
    }

    if (!pkg.priceId) {
      toast({ title: 'Erro', description: 'Preço não disponível. Tente recarregar a página.' });
      return;
    }

    setLoading(pkg.name);
    try {
      logger.info('Starting purchase process', { package: pkg.name, amount: pkg.amount / 100 });

      // Create Stripe Checkout session with price ID
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: pkg.priceId,
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
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Adquira mais Créditos
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Cada crédito permite a criação de uma música personalizada e inesquecível. Escolha o pacote ideal para sua família!
          </p>
          {lastUpdated && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <RefreshCw className="w-4 h-4" />
              Preços atualizados em tempo real via Stripe
              <button
                onClick={fetchPricing}
                className="ml-2 text-blue-500 hover:text-blue-700 underline"
                disabled={loadingPrices}
              >
                {loadingPrices ? 'Carregando...' : 'Atualizar'}
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          {creditPackages.map((pkg, index) => {
            const isPopular = pkg.credits === 5; // Middle package is most popular
            const features = [
              `${pkg.credits} música${pkg.credits > 1 ? 's' : ''} 100% personalizada${pkg.credits > 1 ? 's' : ''}`,
              'Entrega em até 48h',
              'Acesso vitalício ao áudio',
            ];
            
            if (pkg.savings) {
              features.push(`Economia de ${pkg.savings.percentage}%`);
            }
            
            if (pkg.credits >= 5) {
              features.push('Suporte prioritário');
            }
            
            if (pkg.credits === 10) {
              features.push('Ideal para presentear');
            }

            return (
              <div
                key={pkg.productId || index}
                className={`relative p-8 bg-white rounded-lg shadow-lg ${
                  isPopular ? 'border-2 border-purple-500' : 'border'
                }`}
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
                    {loadingPrices ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="w-6 h-6 animate-spin" />
                        Carregando...
                      </span>
                    ) : (
                      pkg.formattedPrice
                    )}
                  </p>
                  {pkg.savings && (
                    <p className="text-sm font-medium text-green-600 flex items-center justify-center gap-1">
                      <Zap className="w-4 h-4" /> Economia de {pkg.savings.formattedSavings}
                    </p>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={loading === pkg.name || loadingPrices || !pkg.priceId}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading === pkg.name ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : loadingPrices ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Carregando preços...
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