import React from 'react';
import Portal from '../../Portal';
import { formatCOP } from '../../../utils/money';
import { Ticket, X, ShieldCheck, MessageCircle } from 'lucide-react';

export default function MealPlanAuthModal({
  open,
  onClose,
  modalTab,
  setModalTab,
  loginInput,
  setLoginInput,
  onManualLogin,
  onGoogleLogin,
  includeDeliveryInPreview,
  setIncludeDeliveryInPreview,
  displayedTemplates,
  whatsappNumber
}) {
  if (!open) return null;

  return (
    <Portal>
      <div
        data-clarity-unmask="true"
        className="fixed inset-0 z-[250] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-[#FAF7F2] border-b border-stone-200/80 p-4 sm:p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#2f4131]/10 text-[#2f4131] flex items-center justify-center">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#1A1A1A] leading-tight">
                  Club BOKU • Pase de Almuerzos
                </h3>
                <p className="text-[11px] text-stone-500">
                  Almuerzos personalizados con o sin sopa todos los días
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-stone-200/60 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 p-1.5 bg-stone-100 border-b border-stone-200 shrink-0">
            <button
              type="button"
              onClick={() => setModalTab('login')}
              className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                modalTab === 'login'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              🔐 Ingresar a mi Pase Club BOKU
            </button>
            <button
              type="button"
              onClick={() => setModalTab('plans')}
              className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                modalTab === 'plans'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              🥗 Ver Precios de Planes
            </button>
          </div>

          {modalTab === 'login' ? (
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              <p className="text-xs font-bold text-stone-600 leading-relaxed">
                Ingresa tu número de celular o código de miembro para abrir tu tiquetera:
              </p>

              <form onSubmit={onManualLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-stone-500 mb-1">
                    Celular o Código VIP
                  </label>
                  <input
                    type="text"
                    value={loginInput}
                    onChange={e => setLoginInput(e.target.value)}
                    placeholder="Ej: 3125535583 o CHAN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2f4131]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#2f4131] hover:bg-[#233124] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#cba258]" />
                  <span>Ingresar a mi Pase</span>
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200" />
                <span className="flex-shrink mx-3 text-[10px] font-bold uppercase text-stone-400">
                  O con tu cuenta Google
                </span>
                <div className="flex-grow border-t border-stone-200" />
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>Validar con Google</span>
              </button>
            </div>
          ) : (
            <div className="p-4 sm:p-5 space-y-3.5 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between gap-2 bg-stone-100 p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIncludeDeliveryInPreview(false)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                    !includeDeliveryInPreview
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500'
                  }`}
                >
                  Solo Almuerzos
                </button>
                <button
                  type="button"
                  onClick={() => setIncludeDeliveryInPreview(true)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                    includeDeliveryInPreview
                      ? 'bg-[#2f4131] text-white shadow-xs'
                      : 'text-stone-500'
                  }`}
                >
                  🛵 Todo Incluido (+Envío)
                </button>
              </div>

              <div className="space-y-2.5">
                {displayedTemplates.map(t => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl border border-stone-200 hover:border-[#2f4131]/50 bg-[#FAF7F2]/60 flex items-center justify-between gap-3 transition-all"
                  >
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-[#2f4131]/10 text-[#2f4131] text-[10px] font-black">
                        {t.badge}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-stone-900 mt-1">
                        {t.label}
                      </h4>
                      <p className="text-[11px] text-stone-500">{t.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm sm:text-base font-black text-[#2f4131]">
                        {formatCOP(t.plan_price)}
                      </p>
                      <a
                        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                          `¡Hola! Quiero activar el *${t.label}* (${formatCOP(
                            t.plan_price
                          )}) para pedir todos los días 🥗`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2f4131] hover:bg-[#233124] text-white text-[10px] font-black"
                      >
                        <MessageCircle className="w-3 h-3" />
                        Activar Plan
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-stone-500 text-center leading-relaxed">
                ✨ Funciona como <strong>Tiquetera Flexible</strong>: eliges cada día con sopa o sin sopa, y si un día no pides tu crédito se conserva.
              </p>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
