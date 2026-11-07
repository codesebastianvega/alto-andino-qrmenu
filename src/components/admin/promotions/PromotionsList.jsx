import { Icon } from '@iconify-icon/react';
import { formatCOP } from '../../../utils/money';
import { toast } from '../../Toast';

export default function PromotionsList({
  promotions,
  loading,
  onRefresh,
  onToggleActive,
  onEditPromo,
  onDeletePromo,
  getPromoStatus
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
          Listado de Campañas ({promotions.length})
        </h3>
        <button 
          onClick={onRefresh}
          className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer"
        >
          <Icon icon="heroicons:arrow-path" />
          <span>Actualizar</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-neutral-400">
          <Icon icon="line-md:loading-loop" className="text-3xl mb-2 text-emerald-600" />
          <p className="text-xs font-medium">Cargando campañas promocionales...</p>
        </div>
      ) : promotions.length === 0 ? (
        <div className="p-12 text-center text-neutral-400 space-y-3">
          <Icon icon="solar:tag-price-bold" className="text-4xl text-neutral-300" />
          <p className="text-sm font-bold text-neutral-700">No hay campañas configuradas todavía</p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Utiliza una plantilla rápida arriba para activar tu primera campaña de Domicilio Gratis o Descuento.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {promotions.map((promo) => {
            const status = getPromoStatus(promo);
            return (
              <div key={promo.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 text-xl flex items-center justify-center shrink-0 border border-neutral-200">
                    {promo.type === 'free_delivery' ? '🚚' : promo.code ? '🎟️' : '🏷️'}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-neutral-900 leading-tight">
                        {promo.name}
                      </h4>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                      {promo.code && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          <span>CUPÓN: {promo.code}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(promo.code);
                              toast.success(`Código ${promo.code} copiado`);
                            }}
                            className="text-amber-600 hover:text-amber-900 underline font-sans font-bold cursor-pointer"
                            title="Copiar código"
                          >
                            Copiar
                          </button>
                        </span>
                      )}
                      {promo.code && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          🔒 1 uso por Dispositivo / Teléfono
                        </span>
                      )}
                      {(promo.code === 'VOLVER10' || promo.coupon_scope === 'pause_only') && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100/80 text-amber-900 border border-amber-300">
                          🛡️ Exclusivo Pausa de Cocina (Huella Digital)
                        </span>
                      )}
                      {(promo.code === 'DISCULPABOKU' || promo.coupon_scope === 'crm_recovery') && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                          💛 Exclusivo Recuperación CRM
                        </span>
                      )}
                    </div>

                    {promo.banner_message && promo.show_banner && (
                      <div 
                        className="text-xs px-2.5 py-1 rounded-lg font-medium inline-block max-w-full truncate shadow-2xs"
                        style={{ backgroundColor: promo.banner_bg_color || '#047857', color: promo.banner_text_color || '#ffffff' }}
                      >
                        {promo.banner_message}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap pt-0.5">
                      <span>
                        <strong>Beneficio:</strong> {promo.type === 'free_delivery' ? 'Domicilio $0 COP' : `${promo.value}% OFF`}
                      </span>
                      <span>•</span>
                      <span>
                        <strong>Vigencia:</strong> {promo.end_date ? new Date(promo.end_date).toLocaleDateString('es-CO') : 'Sin vencimiento'}
                      </span>
                      {promo.min_order_amount > 0 && (
                        <>
                          <span>•</span>
                          <span><strong>Mínimo:</strong> {formatCOP(promo.min_order_amount)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions & Switch */}
                <div className="flex items-center gap-3 justify-end self-end md:self-center shrink-0">
                  {/* Switch On/Off */}
                  <button
                    type="button"
                    onClick={() => onToggleActive(promo)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      promo.is_active ? 'bg-emerald-600' : 'bg-neutral-300'
                    }`}
                    title={promo.is_active ? 'Desactivar campaña' : 'Activar campaña'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        promo.is_active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => onEditPromo(promo)}
                    className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-200/60 transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Icon icon="heroicons:pencil-square" className="text-base" />
                  </button>

                  <button
                    onClick={() => onDeletePromo(promo.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Icon icon="heroicons:trash" className="text-base" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
