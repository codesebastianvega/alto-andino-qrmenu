import React from 'react';

export default function AdminExperiences() {
  return (
    <div className="p-10">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Experiencias DIY</h1>
        <p className="text-gray-500 font-medium">Gestiona flujos de armado (Pokes, Pizza, etc.) y banners premium.</p>
      </header>

      <div className="bg-white rounded-3xl p-20 border border-gray-100 text-center">
        <div className="text-6xl mb-6">✨</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Próximamente</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Estamos preparando el módulo de experiencias para que puedas configurar tus banners giratorios y flujos de armado personalizados.
        </p>
      </div>
    </div>
  );
}
