import React from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Database, Users, Flame } from 'lucide-react';
import { TabButton } from './AnalyticsCommon';

export default function AnalyticsHeader({
  dateRange,
  setDateRange,
  activeTab,
  setActiveTab
}) {
  return (
    <>
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">PREMIUM</span>
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Vision Intelligence OS</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter leading-none">
            Estrategia de Crecimiento
          </h1>
          <p className="text-gray-500 mt-4 font-semibold text-lg max-w-xl leading-relaxed">
            Analiza el rendimiento operativo y gestiona el flujo de clientes desde un centro de mando unificado.
          </p>
        </motion.div>

        <div className="flex flex-row overflow-x-auto no-scrollbar flex-nowrap bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 shadow-xl shadow-black/[0.03] w-full md:w-auto">
          {['today', '7d', '30d', 'all'].map(t => (
            <button
              key={t}
              onClick={() => setDateRange(t)}
              className={`px-6 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shrink-0 ${
                dateRange === t ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'today' ? 'Hoy' : t === '7d' ? '7 Días' : t === '30d' ? '30 Días' : 'Total'}
            </button>
          ))}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex flex-row overflow-x-auto no-scrollbar flex-nowrap gap-3 mb-8 md:mb-12 pb-4 md:pb-6 border-b border-gray-100">
        <TabButton active={activeTab === 'resumen'} onClick={() => setActiveTab('resumen')} icon={Zap} label="Resumen" />
        <TabButton active={activeTab === 'analitica'} onClick={() => setActiveTab('analitica')} icon={TrendingUp} label="Analítica" />
        <TabButton active={activeTab === 'operaciones'} onClick={() => setActiveTab('operaciones')} icon={Database} label="Pedidos (Log)" />
        <TabButton active={activeTab === 'crm'} onClick={() => setActiveTab('crm')} icon={Users} label="Clientes (CRM)" />
        <TabButton active={activeTab === 'heatmaps'} onClick={() => setActiveTab('heatmaps')} icon={Flame} label="Comportamiento & Heatmaps" badge="VIP" />
      </div>
    </>
  );
}
