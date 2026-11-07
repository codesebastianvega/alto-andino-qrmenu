import React from 'react';
import { Ticket, Users, Settings, Plus } from 'lucide-react';
import { formatCOP } from '../../../../utils/money';

export default function MealPlansHeader({
  programConfig,
  activeTab,
  setActiveTab,
  subscribersCount = 0,
  tiersCount = 0,
  onOpenCreateModal
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
          <Ticket className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-stone-950 text-[10px] font-black uppercase tracking-wider">
              SaaS Add-on • Tiqueteras
            </span>
            <span className="text-xs text-emerald-200/90 font-semibold">
              Base cubierta: {formatCOP(programConfig.default_unit_value || 17000)} /{' '}
              {programConfig.credit_unit_singular || 'Almuerzo'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black mt-1 tracking-tight">
            {programConfig.program_title || 'Planes & Tiqueteras Digitales'}
          </h2>
          <p className="text-xs text-white/70 mt-0.5 max-w-2xl">
            {programConfig.program_subtitle}
          </p>
        </div>
      </div>

      {/* Botones de Acción & Pestañas */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="inline-flex p-1 rounded-xl bg-black/30 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('subscribers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'subscribers'
                ? 'bg-white text-stone-950 shadow-xs'
                : 'text-white/75 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Suscriptores ({subscribersCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'bg-white text-stone-950 shadow-xs'
                : 'text-white/75 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurar Planes y Precios ({tiersCount})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Suscriptor</span>
        </button>
      </div>
    </div>
  );
}
