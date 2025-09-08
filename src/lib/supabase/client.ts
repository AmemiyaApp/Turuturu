// src\lib\supabase\client.ts
    import { createBrowserClient } from '@supabase/ssr';
    
    /**
     * Cria um client do Supabase para ser usado no lado do navegador (Browser).
     * Utiliza as variáveis de ambiente NEXT_PUBLIC para se conectar com segurança.
     * * @returns Uma instância do client do Supabase.
     */
    export function createSupabaseBrowserClient() {
      return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    
