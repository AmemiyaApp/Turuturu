import { AuthForm } from '@/components/auth/AuthForm';
import { Music } from 'lucide-react';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <div className="text-center mb-8">
          <Music className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">Turuturu</h1>
          <p className="text-gray-600 mt-2">Acesse sua conta</p>
        </div>
        
        <AuthForm />
      </div>
    </div>
  );
}