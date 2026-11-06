import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, DollarSign, Wallet, Users, AlertCircle, Plus, Trash2, ArrowRight } from 'lucide-react';

export default function OpeningBalanceModal({ isOpen, onClose, accounts = [], onSave }) {
  const [step, setStep] = useState(1);
  const [accountBalances, setAccountBalances] = useState(() => {
    const map = {};
    accounts.forEach(a => {
      // Si el balance es 0, dejarlo vacío para que el placeholder muestre 0 y no se concatene al escribir
      map[a.id] = (a.balance && a.balance > 0) ? a.balance : '';
    });
    return map;
  });

  const [initialReceivables, setInitialReceivables] = useState([]);
  const [initialPayables, setInitialPayables] = useState([]);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleAccountChange = (id, val) => {
    const digitsOnly = val.replace(/\D/g, '');
    setAccountBalances(prev => ({
      ...prev,
      [id]: digitsOnly === '' ? '' : Number(digitsOnly)
    }));
  };

  const addReceivable = () => {
    setInitialReceivables(prev => [
      ...prev,
      { customerName: '', phone: '', amount: '', notes: '' }
    ]);
  };

  const updateReceivable = (idx, field, val) => {
    setInitialReceivables(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const removeReceivable = (idx) => {
    setInitialReceivables(prev => prev.filter((_, i) => i !== idx));
  };

  const addPayable = () => {
    setInitialPayables(prev => [
      ...prev,
      { supplierName: '', amount: '', notes: '' }
    ]);
  };

  const updatePayable = (idx, field, val) => {
    setInitialPayables(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const removePayable = (idx) => {
    setInitialPayables(prev => prev.filter((_, i) => i !== idx));
  };

  const totalLiquid = Object.values(accountBalances).reduce((s, v) => s + Number(v || 0), 0);
  const totalRecs = initialReceivables.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalPays = initialPayables.reduce((s, p) => s + Number(p.amount || 0), 0);
  const netWorth = totalLiquid + totalRecs - totalPays;

  const handleComplete = async () => {
    setSaving(true);
    try {
      const sanitizedBalances = {};
      Object.keys(accountBalances).forEach(k => {
        sanitizedBalances[k] = Number(accountBalances[k] || 0);
      });

      const sanitizedReceivables = initialReceivables.map(r => ({
        ...r,
        amount: Number(r.amount || 0)
      }));

      const sanitizedPayables = initialPayables.map(p => ({
        ...p,
        amount: Number(p.amount || 0)
      }));

      await onSave({
        accountsBalances: sanitizedBalances,
        initialReceivables: sanitizedReceivables,
        initialPayables: sanitizedPayables,
        openingDate: new Date().toISOString()
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-emerald-950 via-gray-900 to-black text-white relative">
            <button
              onClick={onClose}
              className="absolute right-5 top-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Wallet size={24} />
              </div>
              <div>
                <span className="text-[11px] font-black tracking-widest uppercase text-emerald-400">Asiento de Apertura (#0001)</span>
                <h2 className="text-xl font-black text-white">¿Con cuánta plata inicia tu negocio?</h2>
                <p className="text-xs text-gray-300 mt-0.5">Configura tu saldo real para no arrancar desde $0.</p>
              </div>
            </div>

            {/* Stepper indicator */}
            <div className="flex items-center gap-2 mt-5">
              <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-emerald-400' : 'bg-white/20'}`} />
              <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-emerald-400' : 'bg-white/20'}`} />
              <div className={`flex-1 h-1.5 rounded-full ${step >= 3 ? 'bg-emerald-400' : 'bg-white/20'}`} />
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
            {step === 1 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-emerald-900">Paso 1: Dinero Disponible en Bolsillos</h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Ingresa el saldo real que tienes hoy en tu gaveta física y en tus billeteras digitales.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {accounts.map(acc => {
                    const rawVal = accountBalances[acc.id];
                    const displayVal = (rawVal === '' || rawVal === undefined || rawVal === null)
                      ? ''
                      : Number(rawVal).toLocaleString('es-CO');

                    return (
                      <div key={acc.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-black text-gray-900">{acc.name}</span>
                          <p className="text-[11px] text-gray-500 uppercase">{acc.type}</p>
                        </div>
                        <div className="relative w-full sm:w-56">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={displayVal}
                            onChange={(e) => handleAccountChange(acc.id, e.target.value)}
                            className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-right font-black text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-2xl bg-gray-900 text-white flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300">Total Dinero Líquido Inicial:</span>
                  <span className="text-base font-black text-emerald-400">$ {totalLiquid.toLocaleString('es-CO')}</span>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                  <Users className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-amber-900">Paso 2: Cartera Inicial (Fiados en la Calle)</h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      ¿Hay clientes que ya te debían dinero de almuerzos o pedidos antes de usar ALUNA? Agrégalos para no perder esa plata.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {initialReceivables.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                      <p className="text-xs text-gray-500">No tienes fiados antiguos pendientes por cobrar.</p>
                      <button
                        onClick={addReceivable}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors"
                      >
                        <Plus size={14} /> Agregar Cliente con Deuda
                      </button>
                    </div>
                  ) : (
                    <>
                      {initialReceivables.map((rec, idx) => {
                        const recDisplay = (rec.amount === '' || rec.amount === undefined || rec.amount === null)
                          ? ''
                          : Number(rec.amount).toLocaleString('es-CO');

                        return (
                          <div key={idx} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                type="text"
                                placeholder="Nombre del Cliente"
                                value={rec.customerName}
                                onChange={(e) => updateReceivable(idx, 'customerName', e.target.value)}
                                className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900"
                              />
                              <input
                                type="text"
                                placeholder="Teléfono / WhatsApp"
                                value={rec.phone}
                                onChange={(e) => updateReceivable(idx, 'phone', e.target.value)}
                                className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono text-gray-900"
                              />
                              <div className="flex items-center gap-2">
                                <div className="relative w-full">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={recDisplay}
                                    onChange={(e) => {
                                      const digits = e.target.value.replace(/\D/g, '');
                                      updateReceivable(idx, 'amount', digits === '' ? '' : Number(digits));
                                    }}
                                    className="w-full pl-6 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-black text-gray-900 text-right"
                                  />
                                </div>
                                <button
                                  onClick={() => removeReceivable(idx)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <button
                        onClick={addReceivable}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition-colors"
                      >
                        <Plus size={14} /> Agregar Otro Cliente
                      </button>
                    </>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-gray-900 text-white flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300">Total Cartera Inicial por Cobrar:</span>
                  <span className="text-base font-black text-amber-400">$ {totalRecs.toLocaleString('es-CO')}</span>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-blue-900">Paso 3: Cuentas por Pagar & Resumen Patrimonial</h4>
                    <p className="text-xs text-blue-800 mt-0.5">
                      Facturas pendientes con proveedores de carne, pollo, verduras o empaques.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {initialPayables.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                      <p className="text-xs text-gray-500">¿Le debes facturas a algún distribuidor?</p>
                      <button
                        onClick={addPayable}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={14} /> Registrar Deuda a Proveedor
                      </button>
                    </div>
                  ) : (
                    <>
                      {initialPayables.map((pay, idx) => {
                        const payDisplay = (pay.amount === '' || pay.amount === undefined || pay.amount === null)
                          ? ''
                          : Number(pay.amount).toLocaleString('es-CO');

                        return (
                          <div key={idx} className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Nombre del Proveedor (Ej: Distribuidora Avícola)"
                              value={pay.supplierName}
                              onChange={(e) => updatePayable(idx, 'supplierName', e.target.value)}
                              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900"
                            />
                            <div className="relative w-36">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={payDisplay}
                                onChange={(e) => {
                                  const digits = e.target.value.replace(/\D/g, '');
                                  updatePayable(idx, 'amount', digits === '' ? '' : Number(digits));
                                }}
                                className="w-full pl-6 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-black text-gray-900 text-right"
                              />
                            </div>
                            <button
                              onClick={() => removePayable(idx)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })}
                      <button
                        onClick={addPayable}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition-colors"
                      >
                        <Plus size={14} /> Agregar Otro Proveedor
                      </button>
                    </>
                  )}
                </div>

                {/* Resumen del Asiento #0001 */}
                <div className="p-5 rounded-3xl bg-gray-950 text-white space-y-3">
                  <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">Resumen Asiento Inicial</span>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-800 text-center">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Dinero Líquido</span>
                      <span className="text-xs font-black text-emerald-400">$ {totalLiquid.toLocaleString('es-CO')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">(+) Cartera</span>
                      <span className="text-xs font-black text-amber-400">$ {totalRecs.toLocaleString('es-CO')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">(-) Deudas Prov.</span>
                      <span className="text-xs font-black text-rose-400">$ {totalPays.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300">Patrimonio Neto Real (Capital Inicial):</span>
                    <span className="text-base font-black text-white">$ {netWorth.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs transition-colors"
              >
                Atrás
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
              >
                Siguiente Paso <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-950/30 transition-all cursor-pointer"
              >
                {saving ? 'Cargando Asiento...' : <><Check size={16} /> Confirmar Asiento de Apertura</>}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
