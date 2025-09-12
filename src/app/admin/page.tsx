// src\app\admin\page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import {
  Clock,
  Music,
  User,
  Mail,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';

type OrderStatus = 'AWAITING_PAYMENT' | 'PENDING' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELED';
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

interface OrderWithDetails {
  id: string;
  createdAt: string;
  updatedAt: string;
  prompt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customer: {
    email: string;
    name: string | null;
  };
  musicFile: {
    id: string;
    url: string;
    createdAt: string;
  } | null;
}

interface Profile {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
}

const getUnifiedStatusInfo = (orderStatus: OrderStatus, paymentStatus: PaymentStatus) => {
  // If payment is not completed, show payment status as priority
  if (paymentStatus === 'PENDING' && orderStatus === 'AWAITING_PAYMENT') {
    return { text: 'Aguardando Pagamento', color: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="w-4 h-4" /> };
  }
  if (paymentStatus === 'FAILED') {
    return { text: 'Pagamento Falhou', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> };
  }
  
  // If payment is completed, show order production status
  switch (orderStatus) {
    case 'COMPLETED':
      return { text: 'Concluída', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> };
    case 'IN_PRODUCTION':
      return { text: 'Em Produção', color: 'bg-blue-100 text-blue-800', icon: <Music className="w-4 h-4" /> };
    case 'PENDING':
      return { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> };
    case 'CANCELED':
      return { text: 'Cancelada', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> };
    default:
      return { text: 'Processando', color: 'bg-gray-100 text-gray-800', icon: <Clock className="w-4 h-4" /> };
  }
};

export default function AdminDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth?error=Unauthorized');
          return;
        }

        // Check if user is admin using API (bypasses RLS)
        const { data: { session } } = await supabase.auth.getSession();
        let profileData = null;
        
        if (session?.access_token) {
          try {
            const profileResponse = await fetch('/api/auth/profile', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
            });

            if (profileResponse.ok) {
              const result = await profileResponse.json();
              if (result.success) {
                profileData = result.profile;
              }
            }
          } catch (profileError) {
            console.error('Failed to fetch profile via API:', profileError);
          }
        }

        if (!profileData?.isAdmin) {
          logger.error('Unauthorized admin access attempt', { userId: user.id, isAdmin: profileData?.isAdmin || false });
          router.push('/dashboard?error=Unauthorized');
          return;
        }

        setProfile(profileData);

        // Fetch all orders with customer details
        const ordersResponse = await fetch('/api/orders?isAdmin=true');
        const ordersData = await ordersResponse.json();

        if (ordersData.success) {
          setOrders(ordersData.orders);
        } else {
          throw new Error('Failed to fetch orders');
        }

        logger.info('Admin dashboard data loaded', { adminEmail: user.email });
      } catch (err) {
        logger.error('Error loading admin dashboard', { error: String(err) });
        router.push('/dashboard?error=Admin+data+fetch+failed');
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
  }, [router]);



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 animate-pulse">Carregando painel administrativo...</p>
      </div>
    );
  }

  if (!profile?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500">Acesso não autorizado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Painel Administrativo</h1>
          <p className="text-gray-500">Gerencie pedidos de música e arquivos</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total de Pedidos</p>
                <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter(o => o.status === 'PENDING').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Em Produção</p>
                <p className="text-2xl font-bold text-blue-600">
                  {orders.filter(o => o.status === 'IN_PRODUCTION').length}
                </p>
              </div>
              <Music className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'COMPLETED').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Pedidos de Música</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => {
                  const unifiedStatus = getUnifiedStatusInfo(order.status, order.paymentStatus);
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/order/${order.id}`)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.customer.name || 'Nome não informado'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {order.customer.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={order.prompt}>
                          {order.prompt}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Clique para ver detalhes
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {format(new Date(order.createdAt), 'dd/MM/yyyy')}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 w-fit ${unifiedStatus.color}`}>
                          {unifiedStatus.icon}
                          {unifiedStatus.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {orders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum pedido encontrado.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}