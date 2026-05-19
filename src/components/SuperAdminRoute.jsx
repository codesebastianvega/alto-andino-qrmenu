import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Crown, Loader2, ShieldX } from 'lucide-react';

/**
 * Route guard for /superadmin/* routes.
 * Only allows users with role === 'superadmin' in their profile.
 * Shows a premium loading skeleton while auth is resolving,
 * and a denied screen for non-superadmin users.
 */
export default function SuperAdminRoute({ children }) {
  const { user, profile, loading } = useAuth();

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
            <Crown className="w-8 h-8 text-amber-400" />
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium tracking-wide">Verificando acceso…</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Not Authenticated ──────────────────────────────────────────────────────
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ── Not Superadmin ─────────────────────────────────────────────────────────
  if (profile?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-white/50 mb-8 leading-relaxed">
            No tienes permisos de Superadmin para acceder a esta sección.
            Si crees que esto es un error, contacta al administrador.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all text-sm font-medium"
          >
            ← Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  // ── Authorized ─────────────────────────────────────────────────────────────
  return children;
}
