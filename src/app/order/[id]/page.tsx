'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Clock,
  Download,
  Mail,
  Music,
  Upload,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Play,
  Save,
  Edit,
} from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import Link from 'next/link';

type OrderStatus = 'AWAITING_PAYMENT' | 'PENDING' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELED';
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

interface MusicFile {
  id: string;
  url: string;
  createdAt: string;
  filename?: string;
  title?: string;
  lyrics?: string;
}

interface OrderDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  prompt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerId: string;
  customer: {
    email: string;
    name: string | null;
  };
  musicFiles: MusicFile[];
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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editingLyrics, setEditingLyrics] = useState<string | null>(null); // Track which file's lyrics are being edited
  const [lyricsContent, setLyricsContent] = useState<{[key: string]: string}>({});
  const [savingLyrics, setSavingLyrics] = useState<string | null>(null); // Track which file's lyrics are being saved
  const orderId = params.id as string;

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Tamanho máximo é 10MB.');
      }

      // Validate file type
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/aac'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo inválido. Apenas arquivos de áudio são permitidos.');
      }

      const formData = new FormData();
      formData.append('orderId', order!.id);
      formData.append('file', file);
      formData.append('updatedBy', profile!.id);
      formData.append('filename', file.name);

      const response = await fetch('/api/music/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Refresh order data
        window.location.reload();
      } else {
        throw new Error(data.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      const message = error instanceof Error ? error.message : 'Erro ao enviar arquivo. Tente novamente.';
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveLyrics = async (musicFileId: string, lyrics: string) => {
    setSavingLyrics(musicFileId);
    try {
      const response = await fetch('/api/music/lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          musicFileId,
          lyrics,
          updatedBy: profile!.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingLyrics(null);
        // Update the order object with new lyrics
        if (order) {
          setOrder({
            ...order,
            musicFiles: order.musicFiles.map(file => 
              file.id === musicFileId ? { ...file, lyrics } : file
            ),
          });
        }
      } else {
        throw new Error(data.error || 'Failed to save lyrics');
      }
    } catch (error) {
      console.error('Error saving lyrics:', error);
      alert('Erro ao salvar letra. Tente novamente.');
    } finally {
      setSavingLyrics(null);
    }
  };

  const handleDeleteMusicFile = async (musicFileId: string) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo de música?')) {
      return;
    }

    try {
      const response = await fetch(`/api/music/${musicFileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updatedBy: profile!.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove from local state
        if (order) {
          setOrder({
            ...order,
            musicFiles: order.musicFiles.filter(file => file.id !== musicFileId),
          });
        }
      } else {
        throw new Error(data.error || 'Failed to delete music file');
      }
    } catch (error) {
      console.error('Error deleting music file:', error);
      alert('Erro ao excluir arquivo. Tente novamente.');
    }
  };

  const updateOrderStatus = async (newStatus: OrderStatus) => {
    if (!profile?.isAdmin) return;

    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          updatedBy: profile.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setOrder(prev => prev ? {
          ...prev,
          status: newStatus,
          updatedAt: new Date().toISOString()
        } : null);
        logger.info('Order status updated', { orderId, newStatus });
      } else {
        throw new Error(data.error || 'Failed to update order status');
      }
    } catch (error) {
      logger.error('Error updating order status', { error, orderId, newStatus });
      alert('Erro ao atualizar status do pedido');
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    async function fetchOrderDetail() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth?error=Unauthorized');
          return;
        }

        // Get user profile using API (bypasses RLS)
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

        // If profile API failed, redirect to dashboard
        if (!profileData) {
          router.push('/dashboard?error=Profile+not+found');
          return;
        }

        setProfile(profileData);

        // Fetch order details
        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch order');
        }

        const orderData = data.order;

        // Check permissions
        if (!profileData.isAdmin && orderData.customerId !== user.id) {
          router.push('/dashboard?error=Unauthorized');
          return;
        }

        setOrder(orderData);
        
        // Initialize lyrics content state
        const initialLyrics: {[key: string]: string} = {};
        orderData.musicFiles?.forEach((file: MusicFile) => {
          initialLyrics[file.id] = file.lyrics || '';
        });
        setLyricsContent(initialLyrics);

        logger.info('Order detail loaded', { orderId });
      } catch (err) {
        logger.error('Error loading order detail', { error: String(err), orderId });
        router.push('/dashboard?error=Order+not+found');
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 animate-pulse">Carregando detalhes do pedido...</p>
      </div>
    );
  }

  if (!order || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500">Pedido não encontrado</p>
      </div>
    );
  }

  const unifiedStatus = getUnifiedStatusInfo(order.status, order.paymentStatus);
  const isAdmin = profile.isAdmin;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <Link
          href={isAdmin ? '/admin' : '/dashboard'}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {isAdmin ? 'Voltar ao Painel Admin' : 'Voltar ao Dashboard'}
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Detalhes do Pedido
        </h1>
        <p className="text-gray-600 mb-8">Pedido #{order.id.slice(-8)}</p>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Informações do Pedido</h2>
          
          {/* Unified Status */}
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <span className={`px-3 py-1 text-sm rounded-full flex items-center gap-2 w-fit ${unifiedStatus.color}`}>
                {unifiedStatus.icon} {unifiedStatus.text}
              </span>
              
              {/* Status Change (Admin Only) */}
              {isAdmin && order.status !== 'COMPLETED' && order.status !== 'CANCELED' && order.paymentStatus === 'PAID' && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Alterar Status:</label>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(e.target.value as OrderStatus)}
                    disabled={updatingStatus}
                    className="text-sm border border-gray-300 rounded px-3 py-1 bg-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="IN_PRODUCTION">Em Produção</option>
                    <option value="COMPLETED">Concluída</option>
                    <option value="CANCELED">Cancelada</option>
                  </select>
                  {updatingStatus && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Criado: {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            {order.updatedAt !== order.createdAt && (
              <p className="text-sm text-gray-500">
                Última atualização: {format(new Date(order.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>

          {/* Customer Info (Admin only) */}
          {isAdmin && (
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-medium mb-2">Cliente</h3>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">{order.customer.name || 'Nome não informado'}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="w-4 h-4" /> {order.customer.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Prompt */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Prompt da Música</h3>
            <div className="bg-gray-50 p-4 rounded">
              <p className="whitespace-pre-wrap">{order.prompt}</p>
            </div>
          </div>

          {/* Music Files */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Arquivos de Música</h3>
              {isAdmin && (order.status === 'IN_PRODUCTION' || order.status === 'PENDING') && (
                <label className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded text-sm cursor-pointer flex items-center gap-2 disabled:opacity-50">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Enviando...' : 'Adicionar Música'}
                  <input type="file" accept="audio/*,.mp3,.wav,.m4a,.aac" className="hidden" disabled={uploading}
                         onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                </label>
              )}
            </div>
            
            {order.musicFiles && order.musicFiles.length > 0 ? (
              <div className="space-y-4">
                {order.musicFiles.map((musicFile, index) => (
                  <div key={musicFile.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {musicFile.title || musicFile.filename || `Música ${index + 1}`}
                      </h4>
                      <div className="flex gap-2">
                        <a href={musicFile.url} target="_blank" rel="noopener noreferrer"
                           className="bg-green-500 text-white hover:bg-green-600 px-3 py-1 rounded text-sm flex items-center gap-1">
                          <Play className="w-3 h-3" /> Ouvir
                        </a>
                        <a href={musicFile.url} download
                           className="bg-blue-500 text-white hover:bg-blue-600 px-3 py-1 rounded text-sm flex items-center gap-1">
                          <Download className="w-3 h-3" /> Baixar
                        </a>
                        {isAdmin && (
                          <button onClick={() => handleDeleteMusicFile(musicFile.id)}
                                  className="bg-red-500 text-white hover:bg-red-600 px-3 py-1 rounded text-sm flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Remover
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Lyrics for this specific file */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-gray-700">Letra</h5>
                        {isAdmin && (
                          <button onClick={() => {
                              if (editingLyrics === musicFile.id) {
                                setEditingLyrics(null);
                                setLyricsContent(prev => ({ ...prev, [musicFile.id]: musicFile.lyrics || '' }));
                              } else {
                                setEditingLyrics(musicFile.id);
                              }
                            }}
                                  className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1">
                            <Edit className="w-3 h-3" /> {editingLyrics === musicFile.id ? 'Cancelar' : 'Editar'}
                          </button>
                        )}
                      </div>
                      
                      {editingLyrics === musicFile.id && isAdmin ? (
                        <div className="space-y-2">
                          <textarea 
                            value={lyricsContent[musicFile.id] || ''} 
                            onChange={(e) => setLyricsContent(prev => ({ ...prev, [musicFile.id]: e.target.value }))}
                            className="w-full h-32 p-3 border rounded focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                            placeholder="Digite a letra da música..." 
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleSaveLyrics(musicFile.id, lyricsContent[musicFile.id] || '')}
                              disabled={savingLyrics === musicFile.id}
                              className="bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 px-3 py-1 rounded text-sm flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" /> {savingLyrics === musicFile.id ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button 
                              onClick={() => {
                                setEditingLyrics(null);
                                setLyricsContent(prev => ({ ...prev, [musicFile.id]: musicFile.lyrics || '' }));
                              }}
                              className="bg-gray-500 text-white hover:bg-gray-600 px-3 py-1 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          {musicFile.lyrics ? (
                            <p className="whitespace-pre-wrap">{musicFile.lyrics}</p>
                          ) : (
                            <p className="text-gray-500 italic">
                              {isAdmin ? 'Nenhuma letra adicionada ainda.' : 'A letra será disponibilizada quando estiver pronta.'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {isAdmin ? 'Nenhuma música enviada ainda.' : 'Músicas em produção.'}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}