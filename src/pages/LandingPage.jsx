import React from 'react';

export default function LandingPage() {
  return (
    <div className="bg-[#F5F5F7] min-h-screen pb-24">
      {/* Temporal Hero */}
      <div className="relative h-[60vh] md:h-[80vh] bg-[#1A1A1A] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-serif leading-tight">
            Comer rico y sano
          </h1>
          <p className="text-lg md:text-xl text-[#F5EFE6] opacity-90">
            Descubre una experiencia única con ingredientes reales.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <a 
              href="#menu"
              className="w-full sm:w-auto px-8 py-3 bg-white text-[#1A1A1A] font-medium rounded-full hover:bg-opacity-90 transition-colors"
            >
              Ver Menú
            </a>
            <button className="w-full sm:w-auto px-8 py-3 border border-white/30 text-white font-medium rounded-full hover:bg-white/10 transition-colors">
              Reservar Mesa
            </button>
          </div>
        </div>
      </div>

      {/* Temporal Attributes Strip */}
      <div className="bg-white py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-2">
            <div className="text-3xl">🐾</div>
            <h3 className="font-medium">Pet Friendly</h3>
            <p className="text-sm text-neutral-500">Conoce a Cocoa</p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl">📶</div>
            <h3 className="font-medium">Free WiFi</h3>
            <p className="text-sm text-neutral-500">Trabaja cómodo</p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl">🥗</div>
            <h3 className="font-medium">Sano & Rico</h3>
            <p className="text-sm text-neutral-500">Ingredientes reales</p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl">✨</div>
            <h3 className="font-medium">Ambiente Único</h3>
            <p className="text-sm text-neutral-500">Diseño y calidez</p>
          </div>
        </div>
      </div>
    </div>
  );
}
