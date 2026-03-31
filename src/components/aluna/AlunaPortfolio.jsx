export default function AlunaPortfolio() {
  return (
    <section id="portafolio" className="py-32 px-6 md:px-12 lg:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        
        {/* ENCABEZADO: Título, descripción y botón */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-5xl md:text-6xl text-[#1A1A1A] mb-6 leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Portafolio Destacado
            </h2>
            <p className="text-[#6B7280] text-lg lg:text-xl font-light leading-relaxed">
              Proyectos que redefinen la interacción entre comensales y restaurantes con la tecnología de Aluna.
            </p>
          </div>
          <button className="border border-[#1A1A1A] text-[#1A1A1A] px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide hover:bg-[#1A1A1A] hover:text-white transition-all duration-300">
            Ver todos los proyectos
          </button>
        </div>
        
        {/* BENTO GRID: Cuadrícula principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[300px] gap-6">
          
          {/* TARJETA 1: Ancha (Ocupa 2 columnas de ancho) */}
          <div className="md:col-span-2 relative rounded-[32px] overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200&auto=format&fit=crop" 
              alt="Osteria Francescana" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300"></div>
            
            <div className="absolute bottom-8 left-8 right-8">
              <div className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-4 py-1.5 rounded-full inline-block mb-4 border border-white/20 shadow-sm">
                Menú Interactivo
              </div>
              <h3 className="text-white text-3xl md:text-4xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Osteria Francescana
              </h3>
              <p className="text-gray-300 text-sm md:text-base font-light">
                Rediseño completo de experiencia digital
              </p>
            </div>
          </div>
          
          {/* TARJETA 2: Alta (Ocupa 2 filas de alto) */}
          <div className="md:col-span-1 md:row-span-2 relative rounded-[32px] overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop" 
              alt="Café de la Paz" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 transition-opacity duration-300"></div>
            
            <div className="absolute bottom-8 left-8 right-8">
              <div className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-4 py-1.5 rounded-full inline-block mb-4 border border-white/20 shadow-sm">
                Identidad Visual
              </div>
              <h3 className="text-white text-3xl md:text-4xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Café de la Paz
              </h3>
              <p className="text-gray-300 text-sm md:text-base font-light">
                Branding & Menú QR Dinámico
              </p>
            </div>
          </div>
          
          {/* TARJETA 3: Estándar (Ocupa 1 columna x 1 fila) */}
          <div className="md:col-span-1 relative rounded-[32px] overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=600&auto=format&fit=crop" 
              alt="Pujol" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300"></div>
            
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-4 py-1.5 rounded-full inline-block mb-3 border border-white/20 shadow-sm">
                Sistema POS
              </div>
              <h3 className="text-white text-2xl md:text-3xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Pujol
              </h3>
            </div>
          </div>
          
          {/* TARJETA 4: Estándar (Ocupa 1 columna x 1 fila) */}
          <div className="md:col-span-1 relative rounded-[32px] overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop" 
              alt="Noma" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300"></div>
            
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-4 py-1.5 rounded-full inline-block mb-3 border border-white/20 shadow-sm">
                App de Pedidos
              </div>
              <h3 className="text-white text-2xl md:text-3xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Noma
              </h3>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
