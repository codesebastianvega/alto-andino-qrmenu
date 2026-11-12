import React from 'react';
import { Plus, Edit2, Trash2, Calculator } from 'lucide-react';

export default function FinancePocketsGrid({
  accounts = [],
  cashOnHand = 0,
  onNewPocket,
  onEditPocket,
  onDeletePocket,
  onCountCash,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black uppercase text-gray-800 tracking-wider">
            Balances por Bolsillo & Cuentas
          </h2>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {accounts.length} cuentas
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-xs text-gray-500 font-medium hidden sm:inline">
            Suma real disponible: $ {cashOnHand.toLocaleString('es-CO')}
          </span>
          {onCountCash && (
            <button
              onClick={onCountCash}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-colors cursor-pointer"
              title="Contar billetes y monedas de Colombia para cuadre o arqueo"
            >
              <Calculator size={14} /> Contar Efectivo (Billetes/Monedas)
            </button>
          )}
          <button
            onClick={onNewPocket}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-black text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} /> Nuevo Bolsillo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map(acc => {
          const isCash = acc.type === 'cash';
          const isNequi = acc.name.toLowerCase().includes('nequi');
          const isDaviplata = acc.name.toLowerCase().includes('daviplata');

          let cardBg = 'bg-white';
          let badgeBg = 'bg-gray-100 text-gray-700';

          if (isCash) {
            cardBg = 'bg-emerald-50/50 border-emerald-200/80';
            badgeBg = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
          } else if (isNequi) {
            cardBg = 'bg-purple-50/50 border-purple-200/80';
            badgeBg = 'bg-purple-100 text-purple-800 border border-purple-300';
          } else if (isDaviplata) {
            cardBg = 'bg-rose-50/50 border-rose-200/80';
            badgeBg = 'bg-rose-100 text-rose-800 border border-rose-300';
          }

          return (
            <div key={acc.id} className={`p-5 rounded-3xl border shadow-xs flex flex-col justify-between ${cardBg}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${badgeBg}`}>
                  {acc.type === 'cash' ? 'Efectivo' : acc.type === 'bank' ? 'Banco / Datáfono' : 'Billetera Digital'}
                </span>

                <div className="flex items-center gap-1">
                  {isCash && onCountCash && (
                    <button
                      onClick={() => onCountCash(acc)}
                      title="Contar billetes y monedas de este bolsillo"
                      className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Calculator size={13} />
                      <span>Contar Caja</span>
                    </button>
                  )}
                  <button
                    onClick={() => onEditPocket(acc)}
                    title="Editar cuenta"
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-colors cursor-pointer"
                  >
                    <Edit2 size={13} />
                  </button>
                  {accounts.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Deseas eliminar el bolsillo "${acc.name}"?`)) {
                          onDeletePocket(acc.id);
                        }
                      }}
                      title="Eliminar bolsillo"
                      className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-black text-gray-800">{acc.name}</h3>
                <div className="text-xl font-black text-gray-900 mt-1">
                  $ {Number(acc.balance || 0).toLocaleString('es-CO')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
