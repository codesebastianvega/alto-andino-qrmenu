import React, { useEffect, useRef, useState } from 'react';
import { Plus, X, HandCoins } from 'lucide-react';
import { colombiaToday } from '../../../utils/financeLoans';

const money = amount => `$${Number(amount || 0).toLocaleString('es-CO')}`;
const inputClass = 'w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900';
const dateLabel = value => value ? new Date(`${value}T12:00:00-05:00`).toLocaleDateString('es-CO') : 'Sin fecha acordada';
function Field({ label, children }) { return <label className="block space-y-1 text-sm font-semibold text-gray-700"><span>{label}</span>{children}</label>; }
function Receipt({ url }) { return /^https?:\/\//i.test(url || '') ? <a href={url} target="_blank" rel="noreferrer" className="text-blue-700 underline">Ver comprobante</a> : null; }

export default function FinanceLoansTab({ loans = [], accounts = [], locations = [], activeLocationId, loading, error, onRefresh, onRecord, onRepay }) {
  const [form, setForm] = useState(null);
  const debt = loans.reduce((s, l) => s + l.balanceDue, 0);
  const principal = loans.reduce((s, l) => s + l.principalDue, 0);
  return <section className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="font-bold text-gray-900">Préstamos recibidos y aportes</h3><p className="text-sm text-gray-500">De toda la marca y todas las fechas. El capital recibido y devuelto no es una venta ni un gasto.</p></div>
      <button type="button" disabled={loading || Boolean(error)} onClick={() => setForm({ type: 'new', id: crypto.randomUUID() })} className="flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Plus size={16} /> Registrar préstamo o aporte</button>
    </div>
    {loading && <p role="status">Cargando préstamos y abonos…</p>}
    {error && <div role="alert" className="rounded-xl bg-amber-50 p-4 text-amber-950">No se pudo actualizar la información: {error} <button type="button" onClick={onRefresh} className="ml-2 font-bold underline">Reintentar</button></div>}
    <div className="grid gap-3 sm:grid-cols-3">
      {[['Capital pendiente', principal], ['Intereses pendientes', debt - principal], ['Total por devolver', debt]].map(([label, amount]) => <div key={label} className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">{label}</p><p className="text-2xl font-black text-indigo-900">{money(amount)}</p></div>)}
    </div>
    {!loading && !error && loans.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500"><HandCoins className="mx-auto mb-2" /><p>No tienes préstamos ni aportes registrados.</p><p className="text-sm">Registra quién puso el dinero y cómo llegó al negocio.</p></div>}
    {loans.map(loan => <article key={loan.id} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap justify-between gap-3"><div><h4 className="font-bold text-gray-900">{loan.lender}</h4><p className="text-xs text-gray-500">{loan.kind === 'loan' ? 'Préstamo' : 'Aporte sin devolución'} · {dateLabel(loan.received_on)} · {locations.find(l => l.id === loan.location_id)?.name || 'Toda la marca'}</p></div><span className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${loan.status === 'Vencido' ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-800'}`}>{loan.status}</span></div>
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><div>Recibido<strong className="block">{money(loan.amount)}</strong></div><div>Capital devuelto<strong className="block">{money(loan.principalPaid)}</strong></div><div>Intereses acordados<strong className="block">{money(loan.interest_agreed)}</strong></div><div>Saldo por devolver<strong className="block text-indigo-800">{money(loan.balanceDue)}</strong></div></div>
      <p className="text-sm text-gray-600">{loan.destination === 'pocket' ? `Ingresó a ${loan.account_name}` : 'Compra pagada directamente por el prestamista, sin ingreso a caja.'} {loan.description}</p>
      {loan.kind === 'loan' && <p className="text-xs text-gray-500">Vencimiento: {dateLabel(loan.due_on)} · Intereses pagados: {money(loan.interestPaid)}</p>}
      <Receipt url={loan.receipt_url} />
      {loan.kind === 'loan' && loan.balanceDue > 0 && <button type="button" disabled={loading || Boolean(error)} onClick={() => setForm({ type: 'repay', id: crypto.randomUUID(), loan })} className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Registrar abono / devolución</button>}
      <details className="border-t pt-3 text-sm"><summary className="cursor-pointer font-semibold">Historial de abonos ({loan.payments.length})</summary><div className="mt-3 space-y-2">{loan.payments.length === 0 && <p className="text-gray-500">Sin abonos registrados.</p>}{loan.payments.map(p => <div key={p.id} className="rounded-xl bg-gray-50 p-3"><p className="font-semibold">{dateLabel(p.paid_on)} · {money(Number(p.principal) + Number(p.interest))} desde {p.account_name}</p><p>Capital: {money(p.principal)} · Intereses: {money(p.interest)}</p>{p.notes && <p>{p.notes}</p>}<Receipt url={p.receipt_url} /></div>)}</div></details>
    </article>)}
    {form && <LoanForm key={form.id} form={form} accounts={accounts} locations={locations} activeLocationId={activeLocationId} onClose={() => setForm(null)} onRecord={onRecord} onRepay={onRepay} />}
  </section>;
}

function LoanForm({ form, accounts, locations, activeLocationId, onClose, onRecord, onRepay }) {
  const repayment = form.type === 'repay';
  const [data, setData] = useState({ kind: 'loan', lender: '', amount: '', interest_agreed: '0', destination: 'pocket', account_id: accounts[0]?.id || '', location_id: locations.some(l => l.id === activeLocationId) ? activeLocationId : '', received_on: colombiaToday(), due_on: '', description: '', expense_category: 'Insumos y Materia Prima', receipt_url: '', principal: '', interest: '0', paid_on: colombiaToday(), notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const panel = useRef(null);
  const savingRef = useRef(false);
  savingRef.current = saving;
  useEffect(() => {
    const handleKey = event => {
      if (event.key === 'Escape' && !savingRef.current) { event.preventDefault(); onClose(); }
      if (event.key === 'Tab') {
        const controls = [...(panel.current?.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]') || [])];
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);
  const update = (name, value) => setData(d => ({ ...d, [name]: value }));
  const account = accounts.find(a => a.id === data.account_id);
  const submit = async e => {
    e.preventDefault(); if (saving) return;
    setError('');
    if (repayment && (Number(data.principal) > form.loan.principalDue || Number(data.interest) > form.loan.interestDue || Number(data.principal) + Number(data.interest) <= 0)) { setError('Revisa el abono: no puede superar el capital ni los intereses pendientes.'); return; }
    if (repayment && Number(data.principal) + Number(data.interest) > Number(account?.balance || 0)) { setError('El bolsillo seleccionado no tiene saldo suficiente. Registra primero el ingreso real o selecciona otro bolsillo.'); return; }
    setSaving(true);
    try {
      if (repayment) await onRepay(form.loan.id, form.id, { principal: Number(data.principal || 0), interest: Number(data.interest || 0), account_id: data.account_id, paid_on: data.paid_on, notes: data.notes.trim(), receipt_url: data.receipt_url });
      else await onRecord(form.id, { kind: data.kind, lender: data.lender.trim(), amount: Number(data.amount), interest_agreed: data.kind === 'loan' ? Number(data.interest_agreed || 0) : 0, destination: data.destination, account_id: data.destination === 'pocket' ? data.account_id : null, location_id: data.location_id || null, received_on: data.received_on, due_on: data.kind === 'loan' ? data.due_on : '', description: data.description.trim(), expense_category: data.expense_category.trim(), receipt_url: data.receipt_url });
      onClose();
    } catch (err) { setError(err.message || 'No se pudo guardar. Puedes reintentar sin duplicar el movimiento.'); }
    finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 p-3" role="dialog" aria-modal="true" aria-labelledby="loan-form-title">
    <div ref={panel} className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between"><h3 id="loan-form-title" className="text-lg font-bold">{repayment ? `Abonar a ${form.loan.lender}` : 'Registrar préstamo o aporte'}</h3><button type="button" aria-label="Cerrar" disabled={saving} onClick={onClose}><X /></button></div>
      <form onSubmit={submit} className="space-y-4">
        {repayment ? <>
          <p className="rounded-xl bg-indigo-50 p-3 text-sm">Capital pendiente: {money(form.loan.principalDue)} · Intereses pendientes: {money(form.loan.interestDue)}</p>
          <div className="grid grid-cols-2 gap-3"><Field label="Abono a capital (COP)"><input className={inputClass} type="number" min="0" step="1" max={form.loan.principalDue} value={data.principal} onChange={e => update('principal', e.target.value)} /></Field><Field label="Pago de intereses (COP)"><input className={inputClass} type="number" min="0" step="1" max={form.loan.interestDue} value={data.interest} onChange={e => update('interest', e.target.value)} /></Field></div>
          <Field label="Fecha del abono"><input className={inputClass} type="date" required min={form.loan.received_on} max={colombiaToday()} value={data.paid_on} onChange={e => update('paid_on', e.target.value)} /></Field>
        </> : <>
          <Field label="Tipo de entrada"><select className={inputClass} value={data.kind} onChange={e => update('kind', e.target.value)}><option value="loan">Préstamo que debemos devolver</option><option value="contribution">Aporte sin devolución</option></select></Field>
          <Field label="Persona o entidad que puso el dinero"><input autoFocus className={inputClass} required maxLength="160" value={data.lender} onChange={e => update('lender', e.target.value)} placeholder="Nombre del prestamista o aportante" /></Field>
          <Field label="Monto recibido (COP)"><input className={inputClass} required type="number" min="1" max="1000000000000" step="1" value={data.amount} onChange={e => update('amount', e.target.value)} /></Field>
          <Field label="¿Cómo llegó el dinero?"><select className={inputClass} value={data.destination} onChange={e => update('destination', e.target.value)}><option value="pocket">Entró a un bolsillo del negocio</option><option value="direct_purchase">La persona pagó una compra directamente</option></select></Field>
          {data.destination === 'direct_purchase' && <><p className="text-sm text-amber-900">Se registrará el gasto y la financiación, sin aumentar ni descontar dinero de los bolsillos. No vuelvas a registrar esta misma compra en Gastos. Este registro no añade existencias al inventario.</p><Field label="Categoría de la compra"><input className={inputClass} required value={data.expense_category} onChange={e => update('expense_category', e.target.value)} /></Field></>}
          <Field label="Sede que recibió la financiación"><select className={inputClass} value={data.location_id} onChange={e => update('location_id', e.target.value)}><option value="">Toda la marca</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
          <Field label="Fecha de recepción"><input className={inputClass} type="date" required max={colombiaToday()} value={data.received_on} onChange={e => update('received_on', e.target.value)} /></Field>
          {data.kind === 'loan' && <div className="grid gap-3 sm:grid-cols-2"><Field label="Intereses totales acordados (COP)"><input className={inputClass} type="number" min="0" max="1000000000000" step="1" value={data.interest_agreed} onChange={e => update('interest_agreed', e.target.value)} /><span className="block text-xs font-normal">0 si no tiene intereses. Es un monto total, no una tasa.</span></Field><Field label="Fecha prevista de devolución (opcional)"><input className={inputClass} type="date" min={data.received_on} value={data.due_on} onChange={e => update('due_on', e.target.value)} /></Field></div>}
        </>}
        {(repayment || data.destination === 'pocket') && <Field label={repayment ? 'Bolsillo de donde sale el abono' : 'Bolsillo que recibió el dinero'}><select className={inputClass} required value={data.account_id} onChange={e => update('account_id', e.target.value)}><option value="">Selecciona un bolsillo</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>{account && <span className="block text-xs font-normal">Saldo actual: {money(account.balance)}</span>}</Field>}
        <Field label={repayment ? 'Nota del abono' : 'Motivo o descripción'}><textarea className={inputClass} required={!repayment} maxLength="2000" rows="2" value={repayment ? data.notes : data.description} onChange={e => update(repayment ? 'notes' : 'description', e.target.value)} /></Field>
        <Field label="Enlace al comprobante (opcional)"><input className={inputClass} type="url" placeholder="https://…" value={data.receipt_url} onChange={e => update('receipt_url', e.target.value)} /></Field>
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <div className="flex gap-3"><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border px-4 py-3">Cancelar</button><button type="submit" disabled={saving} className="flex-1 rounded-xl bg-indigo-700 px-4 py-3 font-bold text-white disabled:opacity-50">{saving ? 'Guardando…' : repayment ? 'Guardar abono' : 'Guardar registro'}</button></div>
      </form>
    </div>
  </div>;
}
