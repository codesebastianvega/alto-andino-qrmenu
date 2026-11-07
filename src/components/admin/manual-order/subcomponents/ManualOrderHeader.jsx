import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function ManualOrderHeader({
  entryFlow,
  setEntryFlow,
  setPrintKitchenTicket,
  setIsPaid,
  onClose
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-900 text-white shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold text-lg shadow-md shadow-amber-500/20">
          <Icon icon="heroicons:bolt" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black tracking-tight">Nuevo Pedido Rápido</h3>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-neutral-950 px-2 py-0.5 rounded-full">
              POS / WhatsApp
            </span>
          </div>
          <p className="text-xs text-neutral-400">Registra pedidos de mostrador o WhatsApp en 15 segundos</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex bg-neutral-800 p-1 rounded-xl text-xs font-bold gap-1 border border-neutral-700">
          <button
            type="button"
            onClick={() => {
              setEntryFlow('kitchen');
              setPrintKitchenTicket(true);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              entryFlow === 'kitchen'
                ? 'bg-amber-400 text-neutral-950 font-black shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Icon icon="heroicons:fire" />
            <span>Mandar a Cocina</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEntryFlow('completed');
              setPrintKitchenTicket(false);
              setIsPaid(true);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              entryFlow === 'completed'
                ? 'bg-emerald-500 text-white font-black shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Para pedidos que ya despachaste o entregaste. Suma a ventas de hoy y descuenta insumos de inventario sin sonar en cocina."
          >
            <Icon icon="heroicons:check-badge" />
            <span>Ya Entregado (Histórico)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
        >
          <Icon icon="heroicons:x-mark" className="text-xl" />
        </button>
      </div>
    </div>
  );
}
