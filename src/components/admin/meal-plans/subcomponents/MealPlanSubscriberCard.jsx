import React from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Navigation,
  MinusCircle,
  PlusCircle,
  RotateCcw,
  Send,
  Copy,
  Check,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatCOP } from '../../../../utils/money';
import { getPlanSoupMode } from '../../../../utils/mealPlans';
import {
  buildVipUrl,
  buildWhatsAppShareMessage,
  calculateCustomerInitials,
  calculateRemainingPercentage
} from '../helpers/mealPlansAdminHelpers';

export default function MealPlanSubscriberCard({
  plan,
  usage,
  programConfig,
  activeTiers = [],
  brandSlug,
  saving = false,
  copiedCode = null,
  onQuickTemplateChange,
  onTogglePaymentStatus,
  onQuickSoupChange,
  onAdjustUsedCredit,
  onRenewPlan,
  onCopyVipLink,
  onEdit,
  onDelete
}) {
  const vipUrl = buildVipUrl(brandSlug, plan.code);
  const { waPhone, message: waMessage } = buildWhatsAppShareMessage({
    plan,
    usage,
    programConfig,
    vipUrl
  });

  const initials = calculateCustomerInitials(plan.customer_name);
  const remainingCredits = usage?.remainingCredits ?? (Number(plan.total_credits) || 0);
  const totalCredits = usage?.totalCredits ?? (Number(plan.total_credits) || 5);
  const pctRemaining = calculateRemainingPercentage(remainingCredits, totalCredits);

  const hasGpsPin = Boolean(plan.default_coords?.lat && plan.default_coords?.lng);
  const isPaid = plan.payment_status !== 'pending';
  const soupMode = getPlanSoupMode(plan, programConfig);

  return (
    <div className="rounded-2xl bg-white border border-stone-200/90 hover:border-emerald-300/80 p-4 sm:p-5 shadow-xs transition-all grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
      {/* ZONA 1 (Izquierda - 4 cols): Identidad del Cliente + Plan Activo + Estado de Pago */}
      <div className="lg:col-span-4 flex items-start gap-3.5 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
          {initials}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-black text-stone-900 truncate">
              {plan.customer_name}
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-stone-900 text-emerald-300 font-mono text-[11px] font-black tracking-wide">
              {plan.code}
            </span>
            <button
              type="button"
              onClick={() => onTogglePaymentStatus(plan)}
              title="Clic para cambiar estado de pago del plan"
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase cursor-pointer transition-all ${
                isPaid
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {isPaid ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Pagado
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Pendiente Pago
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-500 font-semibold">
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3 h-3 text-stone-400" />
              {plan.customer_phone}
            </span>
            {plan.customer_email && (
              <span className="inline-flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 text-stone-400" />
                {plan.customer_email}
              </span>
            )}
          </div>

          {/* Selector Limpio de Modalidad y Sopa */}
          <div className="pt-0.5 flex flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-200/90 rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-black uppercase text-emerald-800">
                Plan:
              </span>
              <select
                value={plan.template_id || ''}
                disabled={saving}
                onChange={(e) => onQuickTemplateChange(plan, e.target.value)}
                className="bg-transparent text-xs font-black text-emerald-950 focus:outline-none cursor-pointer pr-1"
              >
                {activeTiers.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.short_label || tpl.label} — {formatCOP(tpl.plan_price)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                onQuickSoupChange(
                  plan,
                  soupMode === 'sin_sopa' ? 'flexible' : 'sin_sopa'
                )
              }
              title="Clic para alternar entre Con Sopa/Fruta y Sin Sopa"
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                soupMode === 'sin_sopa'
                  ? 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {soupMode === 'sin_sopa' ? '🥗 Sin Sopa (Fit)' : '🥣 Con Sopa / Fruta'}
            </button>
          </div>
        </div>
      </div>

      {/* ZONA 2 (Centro - 4 cols): Logística de Entrega + Mapa GPS Exacto para el Domiciliario */}
      <div className="lg:col-span-4 bg-stone-50/90 rounded-2xl p-3.5 border border-stone-200/70 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-stone-800 truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            {plan.default_address || 'Sin dirección asignada'}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100/80 text-amber-900 text-[11px] font-black shrink-0">
            <Clock className="w-3 h-3 text-amber-700" />
            {plan.default_time || '2:30 PM'}
          </span>
        </div>

        {plan.default_delivery_notes && (
          <p className="text-[11px] text-stone-500 font-medium truncate">
            📝 {plan.default_delivery_notes}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-200/70">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
              plan.includes_delivery
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-stone-200 text-stone-700'
            }`}
          >
            {plan.includes_delivery
              ? '🛵 Domicilio Incluido ($0)'
              : `🛵 Envío: ${formatCOP(plan.delivery_fee || 5000)}`}
          </span>

          {hasGpsPin ? (
            <div className="flex items-center gap-1.5">
              <a
                href={`https://www.google.com/maps?q=${plan.default_coords.lat},${plan.default_coords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black shadow-2xs transition-all"
                title="Abrir ubicación exacta para el domiciliario en Google Maps"
              >
                <Navigation className="w-3 h-3" />
                <span>Mapa Domiciliario ↗</span>
              </a>
              <button
                type="button"
                onClick={() => onEdit(plan)}
                className="text-[10px] font-bold text-stone-500 hover:text-stone-900 underline cursor-pointer"
              >
                Mover Pin
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onEdit(plan)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-black transition-all cursor-pointer"
            >
              <MapPin className="w-3 h-3" />
              <span>⚠️ Fijar Pin en Mapa</span>
            </button>
          )}
        </div>
      </div>

      {/* ZONA 3 (Derecha - 4 cols): Progreso Visual de Créditos + Acciones Rápidas */}
      <div className="lg:col-span-4 flex flex-col justify-between gap-3">
        <div className="bg-stone-900 text-white rounded-2xl p-3 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                Créditos Disponibles
              </span>
              <span className="text-base font-black text-white">
                {remainingCredits}{' '}
                <span className="text-xs text-white/50">/ {totalCredits}</span>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/15 mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pctRemaining > 30
                    ? 'bg-emerald-400'
                    : pctRemaining > 0
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${pctRemaining}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-white/15 shrink-0">
            <button
              type="button"
              onClick={() => onAdjustUsedCredit(plan, 1)}
              title="Descontar 1 crédito usado"
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <MinusCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onAdjustUsedCredit(plan, -1)}
              title="Sumar 1 crédito disponible"
              className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-400 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onRenewPlan(plan)}
              title="Renovar ciclo (Reiniciar créditos)"
              className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar Link VIP</span>
          </a>

          <button
            type="button"
            onClick={() => onCopyVipLink(plan)}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all cursor-pointer"
            title="Copiar Link VIP"
          >
            {copiedCode === plan.code ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onEdit(plan)}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            title="Editar suscriptor y ubicación en mapa"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(plan)}
            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
            title="Eliminar tiquetera"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
