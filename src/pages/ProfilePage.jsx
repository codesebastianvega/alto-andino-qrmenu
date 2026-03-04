import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const isAdmin = user && user.accountType === 'admin';

  return (
    <div className="bg-[#F5F5F7] min-h-screen pb-24 lg:pb-8">
      <div className="max-w-xl mx-auto px-5 pt-12 sm:px-6">
        
        {/* Header Profile / Linktree */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-white rounded-full shadow-sm mx-auto mb-4 flex items-center justify-center overflow-hidden border border-neutral-100">
            <img 
              src="/pwa-192x192.png" 
              alt="Alto Andino Logo" 
              className="w-16 h-16 object-contain"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
            />
            <span className="hidden text-3xl">☕</span>
          </div>
          <h1 className="text-2xl font-serif text-alto-text">Alto Andino</h1>
          <p className="text-neutral-500 mt-1">Comer rico y sano</p>
        </div>

        {/* Links Container */}
        <div className="space-y-3">
          
          <ActionCard 
            icon="🛍️" 
            title="Mis Pedidos" 
            desc="Sigue el estado de tu orden actual"
            onClick={() => alert('Próximamente: Historial de pedidos')}
          />
          
          <ActionCard 
            icon="🤝" 
            title="Ser Aliados" 
            desc="Trabajemos juntos (B2B)"
            onClick={() => window.open('https://wa.me/573000000000', '_blank')}
          />

          <ActionCard 
            icon="⭐" 
            title="Reseñas" 
            desc="Déjanos tu opinión en Google"
            onClick={() => alert('Próximamente: Link a Google Reviews')}
          />

          <ActionCard 
            icon="📸" 
            title="Instagram" 
            desc="@altoandino.co"
            onClick={() => window.open('https://instagram.com/altoandino', '_blank')}
          />

          {/* Admin Section (conditional) */}
          {isAdmin && (
            <div className="mt-8 pt-6 border-t border-neutral-200">
              <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4 px-2">Administración</h3>
              <ActionCard 
                icon="⚙️" 
                title="Panel de Admin" 
                desc="Gestión de menú y órdenes"
                onClick={() => window.location.hash = 'admin'}
                className="border-alto-green/30 bg-alto-green/5"
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick, className = '' }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center p-4 bg-white rounded-2xl shadow-sm border border-neutral-100 hover:shadow-md transition-all active:scale-[0.98] text-left ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center text-2xl shrink-0">
        {icon}
      </div>
      <div className="ml-4 flex-1">
        <h3 className="font-medium text-alto-text">{title}</h3>
        <p className="text-sm text-neutral-500">{desc}</p>
      </div>
      <div className="text-neutral-300 px-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </button>
  );
}
