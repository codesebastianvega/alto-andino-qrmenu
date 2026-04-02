import React from 'react';

export default function SuperAdminSettings() {
  return (
    <div className="p-8">
      <h1 className="text-3xl text-[#1A1A1A] font-bold mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>
        Configuración de Plataforma
      </h1>
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
        <p className="text-gray-600">
          En esta sección podrás configurar opciones globales de la plataforma Aluna Próximamente (como claves de pasarelas de pago genéricas, configuraciones de correos del sistema, tokens, etc).
        </p>
        <div className="mt-8 p-4 bg-emerald-50 text-emerald-800 rounded-xl inline-flex font-medium">
          Módulo en construcción (Bloque 4)
        </div>
      </div>
    </div>
  );
}
