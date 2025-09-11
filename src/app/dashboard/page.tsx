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

type OrderWithMusicFile = Order & {
  musicFile: MusicFile | null;
};

// Função auxiliar para estilizar os status dos pedidos
const getStatusInfo = (status: Order['status']) => {
  switch (status) {
    case 'COMPLETED':
      return { text: 'Concluída', color: 'bg-green-100 text-green-800', icon: <Sparkles className="w-4 h-4" /> };
    case 'IN_PRODUCTION':
      return { text: 'Em Produção', color: 'bg-blue-100 text-blue-800', icon: <Music className="w-4 h-4" /> };
    case 'PENDING':
      return { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> };
    default:
      return { text: status, color: 'bg-gray-100 text-gray-800', icon: <Clock className="w-4 h-4" /> };
  }
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Pick<Profile, 'name' | 'credits'> | null>(null);
  const [orders, setOrders] = useState<OrderWithMusicFile[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth?error=Unauthorized');
          return;
        }

        const [profileResponse, ordersResponse] = await Promise.all([
          supabase.from('Profile').select('name, credits').eq('id', user.id).single(),
          supabase.from('Order').select('*, musicFile:MusicFile(*)').eq('customerId', user.id).order('createdAt', { ascending: false }),
        ]);

        if (profileResponse.error) {
          logger.error('Failed to fetch profile', { error: profileResponse.error });
          throw profileResponse.error;
        }
        setProfile(profileResponse.data);

        if (ordersResponse.error) {
          logger.error('Failed to fetch orders', { error: ordersResponse.error });
          throw ordersResponse.error;
        }
        const processedOrders = (ordersResponse.data || []).map(order => ({
          ...order,
          // Pega o primeiro item do array 'musicFile' ou define como null se o array estiver vazio.
          musicFile: Array.isArray(order.musicFile) ? order.musicFile[0] || null : order.musicFile,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 animate-pulse">Carregando seu painel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
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
                const statusInfo = getStatusInfo(order.status);
                return (
                  <li key={order.id} className="p-4 border rounded-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">
                        {format(new Date(order.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <p className="font-medium text-gray-800 truncate" title={order.prompt}>
                        {order.prompt.split('\n')[0]}
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