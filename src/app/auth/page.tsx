// src\app\auth\page.tsx
import { AuthForm } from '@/components/auth/AuthForm';
import Image from 'next/image';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image 
              src="/logo.png" 
              alt="Turuturu Logo" 
              width={192} 
              height={48} 
              className="h-12 w-auto" 
              priority
              quality={95}
            />
          </div>
          <p className="text-gray-600 mt-2">Acesse sua conta</p>
        </div>
        
        <AuthForm />
      </div>
    </div>
  );
}