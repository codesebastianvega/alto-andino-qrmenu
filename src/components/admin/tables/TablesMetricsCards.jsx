import React from 'react';
import { Smartphone, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react';

export default function TablesMetricsCards({ tableMetrics = {} }) {
  const metricsList = Object.values(tableMetrics);
  const totalScans = metricsList.reduce((acc, m) => acc + (m.scans || 0), 0);
  const totalOrders = metricsList.reduce((acc, m) => acc + (m.orders || 0), 0);
  const totalRevenue = metricsList.reduce((acc, m) => acc + (m.revenue || 0), 0);
  const conversionRate = totalScans > 0 ? Math.round((totalOrders / totalScans) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
          <span>Escaneos Reales</span>
        </p>
        <p className="text-2xl font-black text-gray-900 tracking-tight">
          {totalScans}
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pedidos en Mesa</span>
        </p>
        <p className="text-2xl font-black text-gray-900 tracking-tight">
          {totalOrders}
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-amber-600" />
          <span>Facturación QR</span>
        </p>
        <p className="text-2xl font-black text-gray-900 tracking-tight">
          ${totalRevenue.toLocaleString('es-CO')}
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          <span>Conversión QR</span>
        </p>
        <p className="text-2xl font-black text-gray-900 tracking-tight">
          {conversionRate}%
        </p>
      </div>
    </div>
  );
}
