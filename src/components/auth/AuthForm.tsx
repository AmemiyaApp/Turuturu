// src/components/auth/AuthForm.tsx
'use client';

import { useState } from 'react';
import { signUp, signIn, signInWithGoogle } from '@/lib/auth';
import { logger } from '@/lib/logger';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { user, error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password, name);

      if (error) {
        setError(error);
        logger.error(`${isLogin ? 'Login' : 'Signup'} failed`, { email, error });
      } else if (user) {
        logger.info(`${isLogin ? 'Login' : 'Signup'} successful`, { email });
        window.location.href = '/dashboard';
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado. Tente novamente.';
      setError(errorMsg);
      logger.error('Unexpected auth error', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error);
        logger.error('Google sign-in failed', { error });
      }
    } catch (err) {
      const errorMsg = 'Erro ao logar com Google. Tente novamente.';
      setError(errorMsg);
      logger.error('Unexpected Google auth error', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Tabs Login/Cadastro */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            isLogin 
              ? 'bg-white text-purple-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setIsLogin(true)}
        >
          Entrar
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            !isLogin 
              ? 'bg-white text-purple-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setIsLogin(false)}
        >
          Cadastrar
        </button>
      </div>

      {/* Formulário */}
      <div className="space-y-4">
        {!isLogin && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              placeholder="Seu nome completo"
              required={!isLogin}
            />
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            placeholder="seu@email.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}
        </button>
      </div>

      {/* Divisor */}
      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-gray-200"></div>
        <span className="px-3 text-sm text-gray-500">ou</span>
        <div className="flex-1 border-t border-gray-200"></div>
      </div>

      {/* Login com Google */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
          />
        </svg>
        {loading ? 'Carregando...' : 'Continuar com Google'}
      </button>
    </div>
  );
}