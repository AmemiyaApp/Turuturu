// src\components\landing\Footer.tsx
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative p-2 bg-white/40 backdrop-blur-sm rounded-lg border border-white/80 shadow-lg hover:bg-white/55 transition-all duration-300">
                <Image 
                  src="/logo.png" 
                  alt="Turuturu Logo" 
                  width={128} 
                  height={32} 
                  className="h-8 w-auto" 
                  quality={95}
                />
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-6 max-w-md">
              Transformando crianças em protagonistas de suas próprias músicas. Desenvolvimento infantil através da magia da música personalizada.
            </p>
            <div className="text-xs text-gray-400">
              © {new Date().getFullYear()} Turuturu. Todos os direitos reservados.
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#como-funciona" className="hover:text-white">Como Funciona</a></li>
              <li><a href="#precos" className="hover:text-white">Preços</a></li>
              <li><a href="#beneficios" className="hover:text-white">Benefícios</a></li>
              <li><a href="/contact" className="hover:text-white">Contato</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="/contact" className="hover:text-white">Central de Ajuda</a></li>
              <li><a href="/contact" className="hover:text-white">Contato</a></li>
              <li><a href="/terms" className="hover:text-white">Termos de Uso</a></li>
              <li><a href="/privacy" className="hover:text-white">Privacidade</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-12 pt-8 text-center">
          <p className="text-xs text-gray-400">
            Desenvolvido com 💜 para famílias que acreditam no poder da música personalizada
          </p>
        </div>
      </div>
    </footer>
  );
}