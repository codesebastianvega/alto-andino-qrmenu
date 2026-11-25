import React, { useEffect, useRef, useState } from 'react';
import { HandCoins, X } from 'lucide-react';

const money = n => `$ ${Number(n || 0).toLocaleString('es-CO')}`;

export default function FinanceDebtKpi({ summary, loading, error, onRefresh, onViewLoans }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="flex items-center justify-between gap-3 rounded-3xl border border-indigo-200 bg-white p-5 text-left shadow-xs hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-600">
      <div><span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">Deudas totales</span><strong className="mt-1 block text-2xl font-black text-indigo-800">{loading ? 'Cargando…' : error ? 'Por actualizar' : money(summary.total)}</strong><span className="text-[10px] font-semibold text-gray-500">Ver a quién y cuánto debe el negocio</span></div><HandCoins className="shrink-0 text-indigo-600" size={28} />
    </button>
    {open && <DebtModal summary={summary} loading={loading} error={error} onRefresh={onRefresh} onClose={() => setOpen(false)} onViewLoans={() => { setOpen(false); onViewLoans(); }} />}
  </>;
}

function DebtModal({ summary, loading, error, onRefresh, onClose, onViewLoans }) {
  const panel = useRef(null);
  const close = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    close.current?.focus();
    const keyboard = event => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const items = [...(panel.current?.querySelectorAll('button:not(:disabled),summary,a[href]') || [])];
        if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1]?.focus(); }
        else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0]?.focus(); }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('keydown', keyboard); previous?.focus(); };
  }, []);
  return <div role="dialog" aria-modal="true" aria-labelledby="finance-debt-title" className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 p-3">
    <section ref={panel} className="max-h-[92dvh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
      <header className="flex items-center justify-between gap-3"><h2 id="finance-debt-title" className="text-xl font-bold">Deudas totales del negocio</h2><button ref={close} type="button" onClick={onClose} aria-label="Cerrar detalle de deudas"><X /></button></header>
      <p className="text-sm text-gray-600">Préstamos y cuentas por pagar registradas. Toda la marca y todas las fechas.</p>
      {loading ? <p role="status">Actualizando deudas…</p> : error ? <div role="alert" className="rounded-xl bg-amber-50 p-3 text-amber-900">No se pudieron actualizar los préstamos; el total puede estar incompleto. <button type="button" onClick={onRefresh} className="font-bold underline">Reintentar</button></div> : <>
        <div className="rounded-2xl bg-indigo-50 p-4"><p className="text-sm text-indigo-800">Total pendiente por pagar</p><p className="text-3xl font-black text-indigo-950">{money(summary.total)}</p><p className="mt-1 text-sm">Capital de préstamos: {money(summary.principal)} · Intereses: {money(summary.interest)} · Otras cuentas por pagar: {money(summary.other)}</p></div>
        {summary.creditors.length === 0 && <p className="rounded-xl border border-dashed p-5 text-center text-gray-600">No hay deudas pendientes registradas.</p>}
        {summary.creditors.map(person => <article key={person.key} className="space-y-2 rounded-2xl border border-gray-200 p-4">
          <div className="flex flex-wrap justify-between gap-2"><h3 className="break-words font-bold">{person.name}</h3><strong className="text-indigo-800">{money(person.total)}</strong></div>
          <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-3"><p>Capital: {money(person.principal)}</p><p>Intereses: {money(person.interest)}</p><p>Otras deudas: {money(person.other)}</p></div>
          <details><summary className="cursor-pointer text-sm font-semibold text-indigo-800">Ver {person.entries.length} movimientos pendientes</summary><ul className="mt-2 space-y-2 text-sm">{person.entries.map(entry => <li key={`${entry.label}-${entry.id}`} className="rounded-lg bg-gray-50 p-2">{entry.label}{entry.date ? ` · ${new Date(`${entry.date}T12:00:00-05:00`).toLocaleDateString('es-CO')}` : ''}: <strong>{money(entry.principal + entry.interest + entry.other)}</strong></li>)}</ul></details>
        </article>)}
      </>}
      <footer className="flex flex-wrap gap-3"><button type="button" onClick={onClose} className="rounded-xl border px-4 py-3">Cerrar</button><button type="button" onClick={onViewLoans} className="rounded-xl bg-indigo-700 px-4 py-3 font-bold text-white">Ver préstamos y abonos</button></footer>
    </section>
  </div>;
}
