// src\app\auth\callback\page.tsx
  'use client';

  import { useEffect } from 'react';
  import { useRouter, useSearchParams } from 'next/navigation';
  import { supabase } from '@/lib/supabase/client';
  import { logger } from '@/lib/logger';
  import { useToast } from '@/lib/utils/useToast';

  export default function AuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    useEffect(() => {
      async function handleCallback() {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            logger.error('Callback session error', { error: error.message });
            toast({ title: 'Erro', description: 'Falha ao autenticar. Tente novamente.' });
            router.push('/auth?error=Callback+failed');
            return;
          }
          if (data.session) {
            logger.info('Callback session successful', { user: data.session.user.email });
            toast({ title: 'Sucesso', description: 'Login realizado com sucesso!' });
            router.push('/dashboard');
          } else {
            logger.error('No session found in callback', { params: searchParams.toString() });
            toast({ title: 'Erro', description: 'Nenhuma sessão encontrada. Tente novamente.' });
            router.push('/auth?error=No+session');
          }
        } catch (err) {
          logger.error('Unexpected callback error', { error: String(err) });
          toast({ title: 'Erro', description: 'Erro inesperado. Tente novamente.' });
          router.push('/auth?error=Unexpected+error');
        }
      }
      handleCallback();
    }, [router, searchParams, toast]);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Autenticando...</p>
      </div>
    );
  }