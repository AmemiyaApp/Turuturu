// src\app\criar-musica\page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/lib/utils/useToast';
import { Music, Heart, Sparkles, Volume2, Star, Ticket } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/landing/Footer';
import { Database } from '@/types/supabase';

const formSchema = z.object({
  childName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  childNamePronunciation: z.string().optional(),
  theme: z.string().min(10, 'Descreva o tema com pelo menos 10 caracteres'),
  musicStyle: z.string().min(1, 'Selecione um estilo musical'),
  instruments: z.array(z.string()).min(1, 'Selecione pelo menos um instrumento'),
  effects: z.array(z.string()).min(1, 'Selecione pelo menos um efeito'),
  childAge: z.string().min(1, 'Selecione a idade da criança'),
  additionalInfo: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const musicStyles = [
  { value: 'aventura', label: '🏰 Aventura', color: 'bg-blue-500' },
  { value: 'ninar', label: '🌙 Ninar', color: 'bg-purple-500' },
  { value: 'escola', label: '🎒 Escola', color: 'bg-green-500' },
  { value: 'princesa', label: '👑 Princesa', color: 'bg-pink-500' },
  { value: 'super-heroi', label: '🦸 Super-Herói', color: 'bg-blue-500' },
  { value: 'natureza', label: '🌳 Natureza', color: 'bg-green-500' },
  { value: 'familia', label: '👨‍👩‍👧‍👦 Família', color: 'bg-purple-500' },
];

const instruments = [
  '🎹 Piano', '🎸 Violão', '🥁 Bateria', '🎺 Trompete',
  '🎻 Violino', '🪘 Xilofone', '🥄 Colheres', '🔔 Sinos',
  '🎷 Saxofone', '🪗 Sanfona', '🎤 Vocal', '🎵 Stillpan'
];

const soundEffects = [
  '😄 Risadas', '👏 Palmas', '🎵 Lálálá', '🤫 Shhhh',
  '🐦 Passarinhos', '🌊 Água', '🚗 Carrinhos', '🐱 Miados',
  '🐶 Latidos', '⭐ Efeitos Mágicos', '🎪 Circo', '🌈 Arco-íris'
];

export default function CreateMusic() {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      childName: '',
      childNamePronunciation: '',
      theme: '',
      musicStyle: '',
      instruments: [],
      effects: [],
      childAge: '',
      additionalInfo: '',
    },
  });

  useEffect(() => {
    async function checkUserAndCredits() {
      try {
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({ title: 'Acesso Negado', description: 'Você precisa estar logado.' });
          router.push('/auth?error=Unauthorized');
          return;
        }

        // Get session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          toast({ title: 'Erro de Sessão', description: 'Sessão inválida. Faça login novamente.' });
          router.push('/auth');
          return;
        }

        // Try to get profile via API
        let profileData = null;
        try {
          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              profileData = result.profile;
              console.log('Profile loaded successfully, credits:', profileData.credits);
              setCredits(profileData.credits || 0);
              return;
            } else {
              console.log('Profile API returned unsuccessful response:', result);
            }
          } else {
            console.log('Profile API response not ok:', response.status, response.statusText);
          }
        } catch (error) {
          // Log error but continue to try creating profile
          console.warn('Failed to fetch profile:', error);
        }

        // If profile fetch failed, try to create it
        try {
          console.log('Profile not found, attempting to create...');
          const createResponse = await fetch('/api/auth/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user }),
          });

          if (createResponse.ok) {
            const result = await createResponse.json();
            if (result.success) {
              console.log('Profile created successfully, credits:', result.profile.credits);
              setCredits(result.profile.credits || 0);
              return;
            } else {
              console.log('Profile creation returned unsuccessful response:', result);
            }
          } else {
            console.log('Profile creation API response not ok:', createResponse.status, createResponse.statusText);
          }
        } catch (error) {
          console.warn('Failed to create profile:', error);
        }

        // Fallback: set credits to 0
        console.log('All profile operations failed, setting credits to 0');
        setCredits(0);
        
      } catch (error) {
        console.error('Error in checkUserAndCredits:', error);
        toast({ title: 'Erro Inesperado', description: 'Ocorreu um erro. Tente recarregar a página.' });
        setCredits(0);
      }
    }
    
    checkUserAndCredits();
  }, [router, toast]);

  const toggleInstrument = (instrument: string) => {
    const updated = selectedInstruments.includes(instrument)
      ? selectedInstruments.filter((i) => i !== instrument)
      : [...selectedInstruments, instrument];
    setSelectedInstruments(updated);
    form.setValue('instruments', updated);
  };

  const toggleEffect = (effect: string) => {
    const updated = selectedEffects.includes(effect)
      ? selectedEffects.filter((e) => e !== effect)
      : [...selectedEffects, effect];
    setSelectedEffects(updated);
    form.setValue('effects', updated);
  };

  const onSubmit = async (data: FormData) => {
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('Form already submitting, ignoring duplicate click');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Debug: Log current credits value
      console.log('Current credits before submission:', credits);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({ title: 'Erro', description: 'Você precisa estar logado.' });
        router.push('/auth');
        return;
      }

      const prompt = `Nome: ${data.childName} (pronúncia: ${data.childNamePronunciation || 'não especificado'})
Tema: ${data.theme}
Instrumentos: ${data.instruments.join(', ')}
Efeitos: ${data.effects.join(', ')}
Estilo: ${data.musicStyle}
Idade: ${data.childAge}
Observação: ${data.additionalInfo || 'nenhuma'}`;

      // Always create order via API (regardless of credits)
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          customerId: user.id,
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create order');
      }

      // Update credits
      setCredits(result.remainingCredits);
      
      // Check if payment is needed
      if (result.needsPayment) {
        toast({ 
          title: 'Pedido Salvo!', 
          description: 'Seu pedido foi salvo. Você será redirecionado para completar o pagamento.' 
        });
        // Redirect to purchase credits with order context
        router.push(`/comprar-creditos?orderId=${result.order.id}`);
      } else {
        toast({ 
          title: 'Sucesso!', 
          description: 'Música encomendada! Você será redirecionado.' 
        });
        router.push('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error creating music order:', errorMessage);
      toast({ title: 'Erro', description: 'Erro inesperado. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100">
       <AppHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Music className="w-8 h-8 text-blue-500" />
              <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
              <Heart className="w-6 h-6 text-pink-500 animate-bounce" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Crie uma Música Especial
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transforme seu pequeno no protagonista de uma canção única e inesquecível
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 mt-6 bg-white/80 backdrop-blur-sm rounded-full border border-purple-200 shadow-sm">
              <Ticket className="w-5 h-5 text-purple-500" />
              <span className="font-medium text-purple-700">
                Créditos Disponíveis: {credits}
              </span>
              {/* Debug button to refresh credits */}
              <button 
                type="button"
                onClick={async () => {
                  console.log('Manual refresh clicked');
                  const { data: { user } } = await supabase.auth.getUser();
                  const { data: { session } } = await supabase.auth.getSession();
                  if (user && session?.access_token) {
                    try {
                      const response = await fetch('/api/auth/profile', {
                        headers: {
                          'Authorization': `Bearer ${session.access_token}`,
                        },
                      });
                      if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                          console.log('Manual refresh - found credits:', result.profile.credits);
                          setCredits(result.profile.credits);
                        }
                      }
                    } catch (error) {
                      console.error('Manual refresh failed:', error);
                    }
                  }
                }}
                className="ml-2 text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                ⟳
              </button>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border-0">
            <div className="p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <Star className="w-6 h-6 text-purple-500" />
                Formulário de Criação
              </h2>
              <p className="text-gray-600">Preencha os dados abaixo para criarmos uma música personalizada</p>
            </div>
            <div className="p-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b-2 border-purple-200 pb-2">
                    📝 Informações da Criança
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome da Criança</label>
                      <input
                        {...form.register('childName')}
                        className="mt-2 w-full rounded-md border border-gray-300 p-3 focus:border-blue-500"
                        placeholder="Ex: Ana Clara, João Pedro..."
                      />
                      {form.formState.errors.childName && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.childName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Como se Pronuncia?</label>
                      <input
                        {...form.register('childNamePronunciation')}
                        className="mt-2 w-full rounded-md border border-gray-300 p-3 focus:border-blue-500"
                        placeholder="Ex: Zion → Záion, Liv → Líve"
                      />
                      <p className="text-sm text-gray-500 mt-1">Opcional: Ajude-nos com a pronúncia correta</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Idade da Criança</label>
                    <select
                      {...form.register('childAge')}
                      className="mt-2 w-full rounded-md border border-gray-300 p-3 focus:border-blue-500"
                    >
                      <option value="">Selecione a idade</option>
                      <option value="0-1">0-1 anos</option>
                      <option value="2-3">2-3 anos</option>
                      <option value="4-5">4-5 anos</option>
                      <option value="6-7">6-7 anos</option>
                    </select>
                    {form.formState.errors.childAge && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.childAge.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b-2 border-purple-200 pb-2">
                    🎭 Tema da Música
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descreva o Tema</label>
                    <textarea
                      {...form.register('theme')}
                      className="mt-2 w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 min-h-[100px]"
                      placeholder="Ex: Uma aventura no espaço onde a criança é uma astronauta corajosa que explora planetas coloridos..."
                    />
                    <p className="text-sm text-gray-500 mt-1">Seja criativo! Conte-nos sobre a história que você imagina</p>
                    {form.formState.errors.theme && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.theme.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b-2 border-purple-200 pb-2">
                    🎨 Estilo Musical
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {musicStyles.map((style) => (
                      <div
                        key={style.value}
                        className={`cursor-pointer p-4 rounded-lg border-2 ${form.watch('musicStyle') === style.value ? `${style.color} text-white` : 'border-gray-200 hover:border-blue-300'}`}
                        onClick={() => form.setValue('musicStyle', style.value)}
                      >
                        <div className="text-lg font-medium text-center">{style.label}</div>
                      </div>
                    ))}
                  </div>
                  {form.formState.errors.musicStyle && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.musicStyle.message}</p>
                  )}
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b-2 border-purple-200 pb-2">
                    🎼 Instrumentos Musicais
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {instruments.map((instrument) => (
                      <div
                        key={instrument}
                        className={`cursor-pointer p-3 rounded-lg border-2 text-center ${selectedInstruments.includes(instrument) ? 'bg-blue-500 text-white' : 'border-gray-200 hover:bg-blue-50'}`}
                        onClick={() => toggleInstrument(instrument)}
                      >
                        {instrument}
                      </div>
                    ))}
                  </div>
                  {form.formState.errors.instruments && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.instruments.message}</p>
                  )}
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b-2 border-purple-200 pb-2">
                    🔊 Efeitos Sonoros
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {soundEffects.map((effect) => (
                      <div
                        key={effect}
                        className={`cursor-pointer p-3 rounded-lg border-2 text-center ${selectedEffects.includes(effect) ? 'bg-green-500 text-white' : 'border-gray-200 hover:bg-green-50'}`}
                        onClick={() => toggleEffect(effect)}
                      >
                        {effect}
                      </div>
                    ))}
                  </div>
                  {form.formState.errors.effects && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.effects.message}</p>
                  )}
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b-2 border-purple-200 pb-2">
                    💭 Informações Extras
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Algo Mais?</label>
                    <textarea
                      {...form.register('additionalInfo')}
                      className="mt-2 w-full rounded-md border border-gray-300 p-3 focus:border-blue-500"
                      placeholder="Ex: A criança adora dinossauros, tem um cachorrinho chamado Rex, gosta de brincar no parque..."
                    />
                    <p className="text-sm text-gray-500 mt-1">Opcional: Conte-nos mais sobre os gostos e rotina da criança</p>
                  </div>
                </div>
                <div className="pt-6 border-t-2 border-gray-200">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full md:w-auto mx-auto flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                      isSubmitting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Criando Música...
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-5 h-5" />
                        Criar Minha Música Personalizada
                        <Sparkles className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-gray-600 mt-4">
                    {isSubmitting 
                      ? '⏳ Processando seu pedido...' 
                      : '🎁 Sua música será criada com carinho e enviada em até 48 horas'
                    }
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}