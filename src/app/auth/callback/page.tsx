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
            const user = data.session.user;
            
            // Use the API endpoint to create/ensure profile exists (bypasses RLS)
            try {
              const response = await fetch('/api/auth/profile', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user }),
              });

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              const profileData = await response.json();
              
              if (!profileData.success) {
                throw new Error(profileData.error || 'Failed to create profile');
              }

              logger.info('Profile ensured successfully', { userId: user.id, email: user.email });
              toast({ title: 'Bem-vindo!', description: `Olá, ${profileData.profile.name || 'usuário'}!` });
            } catch (profileError) {
              logger.error('Failed to ensure profile via API', { error: String(profileError), userId: user.id });
              // Don't block login for profile creation issues - continue anyway
              logger.info('Continuing login despite profile error', { userId: user.id });
              toast({ title: 'Aviso', description: 'Login realizado, mas houve um problema com o perfil.' });
            }

            logger.info('Callback session successful', { user: user.email });
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