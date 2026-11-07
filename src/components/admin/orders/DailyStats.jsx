import React from 'react';

export const DailyStats = ({
  orders,
  range,
  onCancelledClick,
  onDeliveredClick,
  onFiadosClick,
  fiadosCount = 0,
  totalCartera = 0
}) => {
  const rangeLabels = {
    today: 'Hoy',
    '7d': '7 Días',
    '30d': '30 Días',
    all: 'Total Histórico'
  };

  const delivered = orders.filter(o => o.status === 'delivered');
  const revenue = delivered.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const paidOrders = orders.filter(o => o.status !== 'cancelled' && o.payment_status === 'paid');
  const totalPaidRevenue = paidOrders.reduce((sum, o) => sum + Number(o.paid_amount || o.total_amount || 0), 0);
  const cancelled = orders.filter(o => o.status === 'cancelled');

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4 mb-4 md:mb-8">
      <div className="bg-white p-2.5 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm transition-transform active:scale-95 cursor-default">
        <p className="text-[9px] md:text-xs text-gray-500 font-black uppercase tracking-wider mb-0.5 md:mb-1">
          Ventas {rangeLabels[range]}
        </p>
        <p className="text-lg md:text-2xl font-black text-[#2f4131] leading-none">${revenue.toLocaleString()}</p>
        <span className="text-[9px] font-bold text-gray-400 mt-1 block">Total Facturado</span>
      </div>

      <div className="bg-white p-2.5 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm transition-transform active:scale-95 cursor-default">
        <p className="text-[9px] md:text-xs text-gray-500 font-black uppercase tracking-wider mb-0.5 md:mb-1">
          Recaudado en Caja/Bancos
        </p>
        <p className="text-lg md:text-2xl font-black text-emerald-700 leading-none">${totalPaidRevenue.toLocaleString()}</p>
        <span className="text-[9px] font-bold text-emerald-600 mt-1 block">Dinero en mano/banco</span>
      </div>

      <button
        type="button"
        onClick={onFiadosClick}
        className={`p-2.5 md:p-4 rounded-xl md:rounded-2xl border transition-all text-left shadow-sm active:scale-95 cursor-pointer ${
          fiadosCount > 0 ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/70' : 'bg-white border-gray-100'
        }`}
      >
        <p className={`text-[9px] md:text-xs font-black uppercase tracking-wider mb-0.5 md:mb-1 ${fiadosCount > 0 ? 'text-amber-800' : 'text-gray-500'}`}>
          Cartera / Fiados
        </p>
        <p className={`text-lg md:text-2xl font-black leading-none ${fiadosCount > 0 ? 'text-amber-900' : 'text-gray-800'}`}>
          ${totalCartera.toLocaleString()}
        </p>
        <span className={`text-[9px] font-bold mt-1 block ${fiadosCount > 0 ? 'text-amber-700 font-black' : 'text-gray-400'}`}>
          {fiadosCount} por cobrar • Ver cartera
        </span>
      </button>

      <button 
        type="button"
        onClick={onDeliveredClick}
        className="bg-white p-2.5 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm transition-all active:scale-95 hover:bg-emerald-50 hover:border-emerald-100 group text-left w-full relative overflow-hidden"
      >
        <p className="text-[9px] md:text-xs text-gray-500 font-black uppercase tracking-wider mb-0.5 md:mb-1 group-hover:text-emerald-600 transition-colors">
          Finalizados
        </p>
        <div className="flex items-center justify-between gap-1">
          <p className="text-lg md:text-2xl font-black text-emerald-600 leading-none">{delivered.length}</p>
          <span className="text-[8px] md:text-[9px] font-black bg-emerald-50 text-emerald-600 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all whitespace-nowrap">
            VER TODO
          </span>
        </div>
      </button>

      <button 
        type="button"
        onClick={onCancelledClick}
        className="bg-white p-2.5 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm transition-all active:scale-95 hover:bg-red-50 hover:border-red-100 group text-left w-full relative overflow-hidden"
      >
        <p className="text-[9px] md:text-xs text-gray-500 font-black uppercase tracking-wider mb-0.5 md:mb-1 group-hover:text-red-600 transition-colors">
          Cancelados
        </p>
        <div className="flex items-center justify-between gap-1">
          <p className="text-lg md:text-2xl font-black text-red-600 leading-none">{cancelled.length}</p>
          <span className="text-[8px] md:text-[9px] font-black bg-red-50 text-red-600 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-all whitespace-nowrap">
            VER TODO
          </span>
        </div>
      </button>
    </div>
  );
};

export default DailyStats;
