import React from 'react';
import { Database, Users, TrendingUp } from 'lucide-react';
import { GlassCard } from './AnalyticsCommon';

export default function DataIntegrityCard({ integrityStats, allProducts = [], onOpenBulkEditor }) {
  const missingCostsPct = allProducts?.length > 0 
    ? (integrityStats.missingCosts / allProducts.length) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <GlassCard noHover className="p-6 border-l-4 border-l-orange-500 bg-orange-50/10">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 uppercase">Integridad de Costos</h4>
              <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                El <strong>{missingCostsPct.toFixed(1)}% ({integrityStats.missingCosts} productos)</strong> de tu catálogo no tiene costo asignado.
              </p>
              
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-orange-100 rounded-full overflow-hidden w-32">
                  <div className="h-full bg-orange-500" style={{ width: `${missingCostsPct}%` }} />
                </div>
                <span className="text-[10px] font-black text-orange-600">{Math.round(missingCostsPct)}%</span>
              </div>
              
              <div className="mt-3">
                <button 
                  onClick={onOpenBulkEditor}
                  className="text-[10px] font-black text-white uppercase bg-orange-500 px-4 py-2 rounded-xl shadow-md hover:bg-orange-600 hover:scale-105 transition-all"
                >
                  Corregir Ahora
                </button>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-orange-600">{integrityStats.missingCosts}</span>
            <span className="block text-[8px] font-black text-gray-400 uppercase">Alertas</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard noHover className="p-6 border-l-4 border-l-blue-500 bg-blue-50/10">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 uppercase">Identidad de Clientes</h4>
              <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                Solo el <strong>{integrityStats.identifiedPct.toFixed(1)}%</strong> de tus pedidos tienen cliente identificado.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${integrityStats.identifiedPct}%` }} />
                </div>
                <span className="text-[10px] font-black text-blue-600">{Math.round(integrityStats.identifiedPct)}%</span>
              </div>
            </div>
          </div>
          <div className="bg-blue-600 text-white p-1 rounded-md">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
