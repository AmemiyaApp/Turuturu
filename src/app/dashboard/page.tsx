// src\app\dashboard\page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Clock,
  Download,
  Music,
  PlusCircle,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { Database } from '@/types/supabase';
import { AppHeader } from '@/components/layout/AppHeader';


// Tipos para os dados que vamos buscar
type Order = Database['public']['Tables']['Order']['Row'];
type MusicFile = Database['public']['Tables']['MusicFile']['Row'];
type Profile = Database['public']['Tables']['Profile']['Row'];

type OrderWithMusicFiles = Order & {
  musicFiles?: MusicFile[];
};

type OrderWithMusicFile = Order & {
  musicFile: MusicFile | null;
};

// Função auxiliar para estilizar os status dos pedidos de forma unificada
const getUnifiedStatusInfo = (orderStatus: Order['status'], paymentStatus: string) => {
  // Se o pagamento não está completo, mostrar status de pagamento como prioridade
  if (paymentStatus === 'PENDING' && orderStatus === 'AWAITING_PAYMENT') {
    return { text: 'Aguardando Pagamento', color: 'bg-orange-100 text-orange-800', icon: <Clock className="w-4 h-4" /> };
  }
  if (paymentStatus === 'FAILED') {
    return { text: 'Pagamento Falhou', color: 'bg-red-100 text-red-800', icon: <Clock className="w-4 h-4" /> };
  }
  
  // Se o pagamento está completo, mostrar status de produção
  switch (orderStatus) {
    case 'COMPLETED':
      return { text: 'Concluída', color: 'bg-green-100 text-green-800', icon: <Sparkles className="w-4 h-4" /> };
    case 'IN_PRODUCTION':
      return { text: 'Em Produção', color: 'bg-blue-100 text-blue-800', icon: <Music className="w-4 h-4" /> };
    case 'PENDING':
      return { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> };
    case 'CANCELED':
      return { text: 'Cancelada', color: 'bg-red-100 text-red-800', icon: <Clock className="w-4 h-4" /> };
    default:
      return { text: 'Processando', color: 'bg-gray-100 text-gray-800', icon: <Clock className="w-4 h-4" /> };
  }
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Pick<Profile, 'name' | 'credits'> | null>(null);
  const [orders, setOrders] = useState<OrderWithMusicFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth?error=Unauthorized');
          return;
        }

        // Use API to get profile (bypasses RLS issues)
        const { data: { session } } = await supabase.auth.getSession();
        let profile = null;
        
        if (session?.access_token) {
          try {
            const profileResponse = await fetch('/api/auth/profile', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
            });

            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              if (profileData.success) {
                profile = profileData.profile;
              }
            }
          } catch (profileError) {
            logger.error('Failed to fetch profile via API', { error: String(profileError), userId: user.id });
          }
        }

        // If profile API failed, try to create profile
        if (!profile) {
          try {
            const createResponse = await fetch('/api/auth/profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ user }),
            });

            if (createResponse.ok) {
              const createData = await createResponse.json();
              if (createData.success) {
                profile = createData.profile;
              }
            }
          } catch (createError) {
            logger.error('Failed to create profile via API', { error: String(createError), userId: user.id });
          }
        }

        // If both API calls failed, use fallback profile
        if (!profile) {
          logger.error('Using fallback profile data', { userId: user.id });
          profile = {
            id: user.id,
            name: user.user_metadata?.full_name || user.user_metadata?.name || 'Usuário',
            credits: 0,
            isAdmin: false,
          };
        }
        
        setProfile(profile);

        // Auto-redirect admin users to admin dashboard
        if (profile?.isAdmin) {
          logger.info('Admin user detected, redirecting to admin dashboard', { userId: user.id, email: user.email });
          setRedirecting(true);
          
          // Preserve any query parameters (like success/error messages)
          const currentUrl = new URL(window.location.href);
          const searchParams = currentUrl.searchParams.toString();
          const redirectUrl = searchParams ? `/admin?${searchParams}` : '/admin';
          
          router.push(redirectUrl);
          return;
        }

        // Fetch orders using API (bypasses RLS issues)
        let ordersData = [];
        if (session?.access_token) {
          try {
            const ordersResponse = await fetch('/api/orders/user', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
            });

            if (ordersResponse.ok) {
              const ordersResult = await ordersResponse.json();
              if (ordersResult.success) {
                ordersData = ordersResult.orders || [];
              }
            }
          } catch (ordersError) {
            logger.error('Failed to fetch orders via API', { error: String(ordersError), userId: user.id });
          }
        }

        // If API failed, try direct Supabase query as fallback
        if (ordersData.length === 0) {
          try {
            const ordersResponse = await supabase
              .from('Order')
              .select('*, musicFiles:MusicFile(*)')
              .eq('customerId', user.id)
              .order('createdAt', { ascending: false });

            if (!ordersResponse.error) {
              ordersData = ordersResponse.data || [];
            }
          } catch (fallbackError) {
            logger.error('Failed to fetch orders via fallback', { error: String(fallbackError), userId: user.id });
          }
        }

        // Process orders for backwards compatibility
        const processedOrders = ordersData.map((order: OrderWithMusicFiles) => ({
          ...order,
          // For backwards compatibility, create a musicFile property from the first musicFiles item
          musicFile: Array.isArray(order.musicFiles) && order.musicFiles.length > 0 ? order.musicFiles[0] : null,
        }));
        
        setOrders(processedOrders);

        logger.info('Dashboard data loaded', { email: user.email });
      } catch (err) {
        logger.error('Unexpected error in dashboard', { error: String(err) });
        // Em caso de erro, podemos redirecionar ou mostrar uma mensagem
        await supabase.auth.signOut();
        router.push('/auth?error=Data+fetch+failed');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [router]);

  if (loading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 animate-pulse">
            {redirecting ? 'Redirecionando para painel administrativo...' : 'Carregando seu painel...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Admin Notice - shown if redirect didn't work */}
        {profile?.isAdmin && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Você é um administrador. 
                  <Link href="/admin" className="font-medium underline hover:text-blue-600">
                    Clique aqui para acessar o painel administrativo
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-8">
          <h2 className="text-xl text-gray-700">
            Olá, <span className="font-bold">{profile?.name || 'usuário'}</span>!
          </h2>
          <p className="text-gray-500">Aqui você gerencia suas músicas personalizadas.</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Wallet className="w-4 h-4" /> Créditos Disponíveis</p>
              <p className="text-3xl font-bold text-gray-800">{profile?.credits}</p>
            </div>
            <Link href="/comprar-creditos" className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-md text-sm font-medium">
              Comprar Créditos
            </Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Music className="w-4 h-4" /> Músicas Criadas</p>
              <p className="text-3xl font-bold text-gray-800">{orders.length}</p>
            </div>
            <Link href="/criar-musica" className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Criar Nova Música
            </Link>
          </div>
        </div>

        {/* Lista de Músicas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Minhas Músicas</h3>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Você ainda não criou nenhuma música.</p>
              <Link href="/criar-musica" className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-md font-medium">
                Criar sua primeira música
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {orders.map((order) => {
                const statusInfo = getUnifiedStatusInfo(order.status, order.paymentStatus || 'PENDING');
                return (
                  <li key={order.id} className="p-4 border rounded-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/order/${order.id}`)}>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">
                        {format(new Date(order.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <p className="font-medium text-gray-800 truncate" title={order.prompt}>
                        {order.prompt.split('\n')[0]}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Clique para ver detalhes completos
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.text}
                      </span>
                      {order.status === 'COMPLETED' && order.musicFile?.url ? (
                        <a href={order.musicFile.url} download target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white hover:bg-green-600 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                          <Download className="w-4 h-4" /> Ouvir / Baixar
                        </a>
                      ) : (
                        <button disabled className="bg-gray-200 text-gray-500 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed">
                          Processando
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}