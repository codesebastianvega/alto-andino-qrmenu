import { Instagram, Facebook, Twitter } from "lucide-react";

export default function AlunaFooter() {
  return (
    <footer className="bg-[#1A1A1A] text-white pt-24 pb-12 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <a href="/" className="text-4xl tracking-tight text-white block mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Aluna
            </a>
            <p className="text-gray-400 max-w-sm leading-relaxed mb-8">
              Transformando la experiencia gastronómica a través de diseño editorial y tecnología de vanguardia.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#2D6A4F] transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#2D6A4F] transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#2D6A4F] transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-6">Compañía</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><a href="#nosotros" className="hover:text-white transition-colors">Sobre Nosotros</a></li>
              <li><a href="#servicios" className="hover:text-white transition-colors">Servicios</a></li>
              <li><a href="#portafolio" className="hover:text-white transition-colors">Portafolio</a></li>
              <li><a href="#contacto" className="hover:text-white transition-colors">Contacto</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-6">Legal</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Aluna. Todos los derechos reservados.</p>
          <p>Diseñado por uxio by sietech</p>
        </div>
      </div>
    </footer>
  );
}
