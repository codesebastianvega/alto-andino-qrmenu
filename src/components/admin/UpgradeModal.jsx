import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, X, Zap, ArrowRight, Clock, Users, Star } from 'lucide-react';
import { PLAN_LABELS } from '../../config/plans';

const WHATSAPP_SUPPORT = '573222285900';
const openWhatsApp = (msg) => {
  window.open(`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
};


/* ── Global styles injected once ─────────────────────────────────── */
const STYLES = `
@keyframes aurora {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.aurora-green {
  background: linear-gradient(135deg,#061a10 0%,#0a2818 20%,#071020 40%,#0d1a2a 60%,#0a2010 80%,#061a10 100%);
  background-size: 400% 400%;
  animation: aurora 8s ease infinite;
  position:relative; overflow:hidden;
}
.aurora-green::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background: radial-gradient(ellipse at 25% 40%, rgba(0,255,128,.13) 0%, transparent 55%),
              radial-gradient(ellipse at 75% 20%, rgba(100,60,255,.16) 0%, transparent 55%),
              radial-gradient(ellipse at 55% 80%, rgba(0,200,255,.1) 0%, transparent 55%);
  background-size:300% 300%; animation: aurora 6s ease infinite reverse;
}
.aurora-gold {
  background: linear-gradient(135deg,#1a1000 0%,#2a1a00 20%,#1a1020 40%,#201000 60%,#2a1800 80%,#1a1000 100%);
  background-size: 400% 400%;
  animation: aurora 9s ease infinite;
  position:relative; overflow:hidden;
}
.aurora-gold::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background: radial-gradient(ellipse at 30% 40%, rgba(245,158,11,.14) 0%, transparent 55%),
              radial-gradient(ellipse at 70% 25%, rgba(180,100,20,.18) 0%, transparent 55%),
              radial-gradient(ellipse at 50% 75%, rgba(120,50,200,.1) 0%, transparent 55%);
  background-size:300% 300%; animation: aurora 7s ease infinite reverse;
}
`;

/* ── Feature data ─────────────────────────────────────────────────── */
const PLAN_KEYS = ['emprendedor', 'esencial', 'profesional', 'premium'];

const PLAN_UI_CONFIG = {
  emprendedor: { border: 'border-amber-500/20', highlight: false, limits: '60 pedidos · 20 productos' },
  esencial: { border: 'border-blue-500/20', highlight: false, limits: '250 pedidos · 50 productos' },
  profesional: { border: 'border-brand-primary/40', highlight: true, badge: 'Popular', limits: 'Pedidos y Productos ilimitados' },
  premium: { border: 'border-purple-500/20', highlight: false, limits: 'Pedidos y Productos ilimitados' },
};

const PLANS = PLAN_KEYS.map(id => ({
  id,
  name: PLAN_LABELS[id].name,
  price: PLAN_LABELS[id].price,
  tagline: PLAN_LABELS[id].desc,
  limits: PLAN_UI_CONFIG[id].limits,
  border: PLAN_UI_CONFIG[id].border,
  badge: PLAN_UI_CONFIG[id].badge,
  highlight: PLAN_UI_CONFIG[id].highlight,
  includes: PLAN_LABELS[id].features,
  excludes: [] // we no longer use excludes as UniversalCheckout only uses includes/features
}));

const TRIAL_UNLOCKS = [
  'Landing page propia',
  'Panel de meseros',
  'Analíticas básicas y avanzadas',
  'Mesas QR + sistema KDS cocina',
  'Inventario y control de recetas',
  'Experiencias y fidelización',
  'Múltiples ubicaciones',
  'Marketplace Aluna',
  'Asistente IA',
];


/* ═══════════════════════════════════════════════════════════════════ */
export default function UpgradeModal({ isOpen, onClose, currentPlanSlug, startTrial, isTrialActive }) {
  const navigate = useNavigate();
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialDone, setTrialDone] = useState(false);

  const handlePlan = (id) => { navigate(`?plan=${id}#checkout`); onClose?.(); };

  const handleTrial = async () => {
    if (!startTrial) return;
    setTrialLoading(true);
    const { error } = await startTrial();
    setTrialLoading(false);
    if (!error) { setTrialDone(true); setTimeout(() => onClose?.(), 1800); }
  };

  return (
    <>
      <style>{STYLES}</style>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex overflow-hidden"
            style={{ background: '#07090A' }}
          >
            {/* ══ LEFT PANEL ══════════════════════════════════════ */}
            <div className="hidden lg:flex flex-col w-[340px] shrink-0 border-r border-white/[0.06] overflow-y-auto">
              <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-brand-primary/[0.05] blur-[80px] pointer-events-none" />

              <div className="flex flex-col flex-1 p-7">


                {/* Social proof */}
                <div className="flex items-center gap-2 mb-7 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex -space-x-1.5">
                    {['#4ade80','#60a5fa','#f59e0b','#a78bfa'].map((c,i) => (
                      <div key={i} className="w-5 h-5 rounded-full border border-white/10" style={{ background: c, opacity: 0.7 }} />
                    ))}
                  </div>
                  <p className="text-white/35 text-[11px]">
                    <span className="text-white/60 font-semibold">+240 restaurantes</span> ya usan Aluna
                  </p>
                </div>

                {/* Trial card */}
                {!isTrialActive && !trialDone ? (
                  <div className="rounded-2xl border border-brand-primary/20 bg-brand-primary/[0.04] p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-brand-primary font-black text-sm">21 días gratis</span>
                      <span className="text-[9px] font-black uppercase tracking-widest bg-brand-primary/15 text-brand-primary px-2 py-0.5 rounded-full">
                        Sin tarjeta
                      </span>
                    </div>
                    <p className="text-white/30 text-xs mb-4">Todo desbloqueado desde el primer día.</p>

                    {/* Day dots */}
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {Array.from({ length: 21 }).map((_, i) => (
                        <div key={i} className="w-3 h-3 rounded-sm"
                          style={{ background: i < 7 ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.06)' }}
                        />
                      ))}
                    </div>
                    <p className="text-white/20 text-[10px] mb-5">21 días de acceso completo</p>

                    <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-2">Qué desbloqueas</p>
                    <ul className="space-y-2 flex-1 mb-5">
                      {TRIAL_UNLOCKS.map((f,i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-brand-primary shrink-0" />
                          <span className="text-white/45 text-xs">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button type="button" onClick={handleTrial} disabled={trialLoading}
                      className="w-full h-10 rounded-xl bg-brand-primary text-black font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/10 mb-4">
                      {trialLoading
                        ? <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        : 'Activar prueba gratuita'}
                    </button>

                    {/* Testimonial */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="text-white/40 text-[11px] italic leading-relaxed mb-2">
                        "En el primer mes recuperamos el costo del plan solo con los pedidos de WhatsApp."
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-amber-400/30 flex items-center justify-center text-[9px] font-bold text-amber-400">C</div>
                        <p className="text-white/25 text-[10px]">Carlos · La Leña Parrilla, Bogotá</p>
                      </div>
                    </div>
                  </div>
                ) : trialDone ? (
                  <div className="rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/[0.05] flex flex-col items-center justify-center gap-2 flex-1">
                    <Check className="w-8 h-8 text-emerald-400" />
                    <p className="text-emerald-400 font-bold text-sm">¡Trial activado!</p>
                    <p className="text-white/30 text-xs text-center">Redirigiendo al panel…</p>
                  </div>
                ) : (
                  <div className="rounded-2xl p-4 border border-brand-primary/15 bg-brand-primary/[0.04] flex items-center gap-3">
                    <Clock className="w-4 h-4 text-brand-primary shrink-0" />
                    <p className="text-white/50 text-xs">Trial activo — acceso completo habilitado.</p>
                  </div>
                )}
              </div>

              <div className="px-7 py-4 border-t border-white/[0.04]">
                <p className="text-white/15 text-[10px] text-center">Seguro · Sin contratos · Cancela cuando quieras</p>
              </div>
            </div>

            {/* ══ RIGHT PANEL ═════════════════════════════════════ */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center justify-between px-8 py-4 border-b border-white/[0.05] shrink-0">
                <div className="flex items-center gap-3">
                  <p className="text-white font-semibold text-sm">Elige tu plan</p>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-brand-primary/25 bg-brand-primary/[0.06]">
                    <Zap className="w-2.5 h-2.5 text-brand-primary" />
                    <span className="text-brand-primary text-[10px] font-bold tracking-wide">Aluna</span>
                  </div>
                </div>
                <button type="button" onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/25 hover:text-white hover:bg-white/[0.06] transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 lg:p-8 space-y-6">

                  {/* Landing header */}
                  <div className="text-center pt-2 pb-4">
                    <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight mb-2">
                      El plan correcto para cada restaurante
                    </h1>
                    <p className="text-white/35 text-sm">
                      Sin comisiones por pedido · Sin permanencia · Cambia de plan cuando quieras
                    </p>
                  </div>

                  {/* 4 Plan cards — 4 cols */}
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    {PLANS.map((plan, i) => {
                      const isCurrent = currentPlanSlug === plan.id;
                      return (
                        <motion.div key={plan.id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className={`relative flex flex-col rounded-2xl border transition-all ${
                            plan.highlight
                              ? `${plan.border} bg-brand-primary/[0.05]`
                              : isCurrent
                                ? 'border-white/15 bg-white/[0.03]'
                                : `${plan.border} bg-transparent hover:bg-white/[0.02]`
                          }`}
                        >
                          {plan.badge && (
                            <span className="absolute -top-2.5 left-4 text-[8px] font-black uppercase tracking-widest bg-brand-primary text-black px-2.5 py-0.5 rounded-full">
                              {plan.badge}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="absolute -top-2.5 left-4 text-[8px] font-bold uppercase tracking-widest bg-white/10 text-white/50 px-2.5 py-0.5 rounded-full border border-white/10">
                              Tu plan
                            </span>
                          )}

                          <div className="p-4 pb-0">
                            <h3 className="text-white font-bold text-sm mb-0.5">{plan.name}</h3>
                            <p className="text-white/25 text-[10px] mb-3">{plan.tagline}</p>
                            <div className="flex items-baseline gap-0.5 mb-0.5">
                              <span className="text-[1.4rem] font-black text-white tracking-tight">${plan.price}</span>
                            </div>
                            <p className="text-white/20 text-[9px] mb-4">/mes · {plan.limits}</p>
                          </div>

                          {/* Includes */}
                          <div className="px-4 flex-1">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/25 mb-2">Incluye</p>
                            <ul className="space-y-1.5 mb-4">
                              {plan.includes.map((f, fi) => (
                                <li key={fi} className="flex items-start gap-1.5">
                                  <Check className={`w-3 h-3 shrink-0 mt-0.5 ${plan.highlight ? 'text-brand-primary' : 'text-white/40'}`} />
                                  <span className="text-white/55 text-[10px] leading-tight">{f}</span>
                                </li>
                              ))}
                            </ul>

                            {/* Excludes */}
                            {plan.excludes.length > 0 && (
                              <>
                                <div className="h-px bg-white/[0.06] mb-3" />
                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/15 mb-2">No incluye</p>
                                <ul className="space-y-1.5 mb-4">
                                  {plan.excludes.map((f, fi) => (
                                    <li key={fi} className="flex items-start gap-1.5">
                                      <X className="w-3 h-3 text-white/15 shrink-0 mt-0.5" />
                                      <span className="text-white/20 text-[10px] leading-tight line-through decoration-white/10">{f}</span>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </div>

                          <div className="p-4 pt-2">
                            <button type="button" disabled={isCurrent} onClick={() => handlePlan(plan.id)}
                              className={`w-full h-8 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                                isCurrent
                                  ? 'text-white/20 cursor-default'
                                  : plan.highlight
                                    ? 'bg-brand-primary text-black hover:opacity-90 active:scale-[0.98]'
                                    : 'border border-white/[0.1] text-white/40 hover:text-white hover:border-white/20 hover:bg-white/[0.04] active:scale-[0.98]'
                              }`}
                            >
                              {isCurrent ? 'Plan actual' : <>Seleccionar <ArrowRight className="w-3 h-3" /></>}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Bottom 2-col: Enterprise + AI ────────────── */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

                    {/* Enterprise — gold aurora */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                      className="aurora-gold rounded-2xl border border-amber-500/[0.15] flex flex-col relative">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent rounded-t-2xl" />

                      <div className="relative p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400/60 block mb-1">Enterprise</span>
                            <h4 className="text-white font-bold text-lg tracking-tight">A medida</h4>
                          </div>
                          <div className="w-9 h-9 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] flex items-center justify-center">
                            <Users className="w-4 h-4 text-amber-400/70" />
                          </div>
                        </div>

                        <p className="text-white/35 text-xs leading-relaxed mb-5">
                          Para cadenas y grupos restauranteros. Infraestructura dedicada, SLAs garantizados e integración con tus sistemas actuales.
                        </p>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-5">
                          {['Pedidos ilimitados','Multi-marca y multi-sede','Integración POS / ERP','Gerente de cuenta dedicado','SLA de disponibilidad 99.9%','Onboarding personalizado'].map((f,i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-amber-400/50 text-xs">✦</span>
                              <span className="text-white/40 text-[11px]">{f}</span>
                            </div>
                          ))}
                        </div>

                        <button type="button"
                          onClick={() => openWhatsApp('Hola, estoy interesado en el plan Enterprise de Aluna para mi restaurante. ¿Podrías darme más información?')}
                          className="w-full h-9 rounded-xl border border-amber-500/20 text-amber-400/80 hover:text-amber-300 hover:border-amber-400/30 hover:bg-amber-500/[0.05] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
                          Contactar ventas <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>

                    {/* AI Agent — green aurora */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33 }}
                      className="aurora-green rounded-2xl border border-emerald-500/[0.12] flex flex-col relative">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent rounded-t-2xl" />

                      <div className="relative p-5">
                        {/* Agent header */}
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                          <div className="relative w-8 h-8 rounded-full flex items-center justify-center text-base"
                            style={{ background: 'linear-gradient(135deg,#4ade80,#22d3ee,#818cf8)' }}>
                            🤖
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-white font-bold text-sm">Aluna IA</p>
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-400/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-emerald-400 text-[9px] font-medium">En línea</span>
                              </div>
                            </div>
                            <p className="text-white/30 text-[10px]">Lista para atender tu restaurante</p>
                          </div>
                        </div>

                        {/* Mini chat mock */}
                        <div className="mb-4 space-y-2">
                          <div className="flex gap-2 items-end">
                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px]">👤</div>
                            <div className="px-3 py-1.5 rounded-2xl rounded-bl-sm bg-white/[0.06] border border-white/[0.08]">
                              <p className="text-white/55 text-[11px]">¿Qué me recomiendas hoy?</p>
                            </div>
                          </div>
                          <div className="flex gap-2 items-end justify-end">
                            <div className="px-3 py-1.5 rounded-2xl rounded-br-sm max-w-[75%]"
                              style={{ background: 'linear-gradient(135deg,rgba(74,222,128,0.15),rgba(34,211,238,0.1))' }}>
                              <p className="text-white/70 text-[11px]">🔥 El lomo saltado — muy pedido esta semana. También el tiramisú, que agotó ayer.</p>
                            </div>
                            <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px]"
                              style={{ background: 'linear-gradient(135deg,#4ade80,#22d3ee)' }}>🤖</div>
                          </div>
                        </div>

                        {/* Capabilities */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-5">
                          {[
                            ['🧠','Analiza ventas y sugiere acciones'],
                            ['💬','Mesero IA en WhatsApp 24/7'],
                            ['🎯','Recomienda platos personalizados'],
                            ['📊','Resúmenes diarios automáticos'],
                            ['✨','Aprende de tu carta y clientes'],
                            ['🔔','Alertas de bajo stock en tiempo real'],
                          ].map(([emoji, text], i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <span className="text-xs mt-px shrink-0">{emoji}</span>
                              <span className="text-white/40 text-[10px] leading-tight">{text}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-white/[0.07]">
                          <div>
                            <span className="text-white font-black text-sm">+$49.900</span>
                            <span className="text-white/25 text-[10px]">/mes · a cualquier plan</span>
                          </div>
                          <button type="button"
                             onClick={() => openWhatsApp('Hola, quiero agregar el módulo de Aluna IA (+$49.900/mes) a mi plan actual. ¿Cómo lo activo?')}
                             className="h-8 px-4 rounded-xl text-[11px] font-black text-black flex items-center gap-1.5 transition-all active:scale-[0.97] hover:opacity-90"
                             style={{ background: 'linear-gradient(135deg,#4ade80,#22d3ee)' }}>
                             Agregar ✨
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
