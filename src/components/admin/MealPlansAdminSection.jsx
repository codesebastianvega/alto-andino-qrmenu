import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../config/supabase';
import { formatCOP } from '../../utils/money';
import { toast } from '../Toast';
import {
  MEAL_PLAN_TEMPLATES,
  getConfiguredMealPlans,
  fetchPlanUsage
} from '../../utils/mealPlans';
import {
  Ticket,
  Plus,
  Send,
  RefreshCw,
  Copy,
  Check,
  MapPin,
  Clock,
  Phone,
  Mail,
  Trash2,
  Edit3,
  Sparkles,
  MinusCircle,
  PlusCircle,
  RotateCcw
} from 'lucide-react';

export default function MealPlansAdminSection({ brandId, brandSlug = 'boku-bento' }) {
  const [plans, setPlans] = useState([]);
  const [usageMap, setUsageMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    code: '',
    template_id: 'semanal_full',
    total_credits: 5,
    bowl_value: 17000,
    includes_delivery: true,
    delivery_fee: 0,
    default_address: '',
    default_time: '2:30 PM',
    dietary_notes: 'Sin sopa • Proteína + 5 Verduras/Toppings + 1 Base Carbohidrato + Semillas + Salsa'
  });

  const loadPlansAndUsage = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    try {
      const { data: rsRows } = await supabase
        .from('restaurant_settings')
        .select('id, location_id, brand_concepts')
        .eq('brand_id', brandId);

      const brandRow = (rsRows || []).find(r => !r.location_id) || (rsRows || [])[0] || null;
      const configured = getConfiguredMealPlans(brandRow);
      setPlans(configured);

      // Consultar créditos reales usados por cada suscriptor
      const map = {};
      await Promise.all(
        configured.map(async p => {
          const res = await fetchPlanUsage(supabase, brandId, p);
          map[p.id || p.code] = res;
        })
      );
      setUsageMap(map);
    } catch (err) {
      console.error('Error cargando tiqueteras:', err);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    loadPlansAndUsage();
  }, [loadPlansAndUsage]);

  const persistPlansToDatabase = async (updatedPlans) => {
    if (!brandId) return false;
    setSaving(true);
    try {
      const { data: rsRows, error: fetchErr } = await supabase
        .from('restaurant_settings')
        .select('id, brand_concepts')
        .eq('brand_id', brandId);

      if (fetchErr) throw fetchErr;

      const conceptPayload = {
        id: 'meal_plans_config',
        exclude_default_erika: true,
        updated_at: new Date().toISOString(),
        plans: updatedPlans
      };

      await Promise.all(
        (rsRows || []).map(row => {
          const existingConcepts = Array.isArray(row.brand_concepts) ? row.brand_concepts : [];
          const nextConcepts = [
            ...existingConcepts.filter(c => c && c.id !== 'meal_plans_config'),
            conceptPayload
          ];
          return supabase
            .from('restaurant_settings')
            .update({ brand_concepts: nextConcepts })
            .eq('id', row.id);
        })
      );

      setPlans(updatedPlans);
      return true;
    } catch (err) {
      console.error('Error guardando planes tiquetera:', err);
      toast.error('No se pudo guardar el cambio en la base de datos.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleQuickTemplateChange = async (plan, newTemplateId) => {
    const tpl = MEAL_PLAN_TEMPLATES.find(t => t.id === newTemplateId);
    if (!tpl) return;

    const updated = plans.map(p => {
      if ((p.id || p.code) !== (plan.id || plan.code)) return p;
      return {
        ...p,
        template_id: tpl.id,
        plan_label: tpl.label,
        total_credits: tpl.total_credits,
        bowl_value: tpl.bowl_value,
        includes_delivery: tpl.includes_delivery,
        delivery_fee: tpl.delivery_fee
      };
    });

    const ok = await persistPlansToDatabase(updated);
    if (ok) {
      toast.success(`✅ Plan de ${plan.customer_name} actualizado a: ${tpl.short_label}`);
      loadPlansAndUsage();
    }
  };

  const handleAdjustUsedCredit = async (plan, delta) => {
    const updated = plans.map(p => {
      if ((p.id || p.code) !== (plan.id || plan.code)) return p;
      const currentAdj = Number(p.manual_used_adjustment) || 0;
      return {
        ...p,
        manual_used_adjustment: currentAdj + delta
      };
    });

    const ok = await persistPlansToDatabase(updated);
    if (ok) {
      toast.success(
        delta > 0
          ? `Se descontó 1 almuerzo manual a ${plan.customer_name}`
          : `Se devolvió 1 almuerzo disponible a ${plan.customer_name}`
      );
      loadPlansAndUsage();
    }
  };

  const handleRenewPlan = async (plan) => {
    const updated = plans.map(p => {
      if ((p.id || p.code) !== (plan.id || plan.code)) return p;
      return {
        ...p,
        manual_used_adjustment: 0,
        cycle_start_at: new Date().toISOString()
      };
    });

    const ok = await persistPlansToDatabase(updated);
    if (ok) {
      toast.success(`🔄 ¡Tiquetera de ${plan.customer_name} renovada con ${plan.total_credits} créditos completos!`);
      loadPlansAndUsage();
    }
  };

  const handleDeletePlan = async (plan) => {
    const updated = plans.filter(p => (p.id || p.code) !== (plan.id || plan.code));
    const ok = await persistPlansToDatabase(updated);
    if (ok) {
      toast.success(`Tiquetera de ${plan.customer_name} eliminada`);
    }
  };

  const openCreateModal = () => {
    setEditingPlanId(null);
    setForm({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      code: '',
      template_id: 'semanal_full',
      total_credits: 5,
      bowl_value: 17000,
      includes_delivery: true,
      delivery_fee: 0,
      default_address: '',
      default_time: '12:30 PM',
      dietary_notes: 'Sin sopa • Proteína + 5 Verduras/Toppings + 1 Base Carbohidrato + Semillas + Salsa'
    });
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setEditingPlanId(plan.id || plan.code);
    setForm({
      customer_name: plan.customer_name || '',
      customer_phone: plan.customer_phone || '',
      customer_email: plan.customer_email || '',
      code: plan.code || '',
      template_id: plan.template_id || 'mensual_full',
      total_credits: Number(plan.total_credits) || 10,
      bowl_value: Number(plan.bowl_value) || 17000,
      includes_delivery: Boolean(plan.includes_delivery),
      delivery_fee: Number(plan.delivery_fee) || 0,
      default_address: plan.default_address || '',
      default_time: plan.default_time || '2:30 PM',
      dietary_notes: plan.dietary_notes || ''
    });
    setShowModal(true);
  };

  const handleFormTemplateSelect = (templateId) => {
    const tpl = MEAL_PLAN_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    setForm(prev => ({
      ...prev,
      template_id: tpl.id,
      total_credits: tpl.total_credits,
      bowl_value: tpl.bowl_value,
      includes_delivery: tpl.includes_delivery,
      delivery_fee: tpl.delivery_fee
    }));
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.customer_phone.trim()) {
      toast.error('Ingresa el nombre y celular del suscriptor');
      return;
    }

    const generatedCode =
      (form.code || '').trim().toUpperCase() ||
      `${form.customer_name.trim().split(' ')[0].toUpperCase()}-BOKU`;

    const tpl = MEAL_PLAN_TEMPLATES.find(t => t.id === form.template_id);

    const newPlanObj = {
      id: editingPlanId || `plan-${Date.now()}`,
      code: generatedCode,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      customer_email: form.customer_email.trim(),
      template_id: form.template_id,
      plan_label: tpl?.label || 'Plan BOKU Fit',
      total_credits: Number(form.total_credits) || 5,
      manual_used_adjustment: editingPlanId
        ? Number(plans.find(p => (p.id || p.code) === editingPlanId)?.manual_used_adjustment) || 0
        : 0,
      bowl_value: Number(form.bowl_value) || 17000,
      includes_delivery: Boolean(form.includes_delivery),
      delivery_fee: form.includes_delivery ? 0 : (Number(form.delivery_fee) || 5000),
      default_address: form.default_address.trim(),
      default_time: form.default_time.trim(),
      dietary_notes: form.dietary_notes.trim(),
      status: 'active',
      cycle_start_at: editingPlanId
        ? plans.find(p => (p.id || p.code) === editingPlanId)?.cycle_start_at || new Date().toISOString()
        : new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const nextPlans = editingPlanId
      ? plans.map(p => ((p.id || p.code) === editingPlanId ? newPlanObj : p))
      : [newPlanObj, ...plans];

    const ok = await persistPlansToDatabase(nextPlans);
    if (ok) {
      toast.success(
        editingPlanId
          ? `✅ Tiquetera de ${newPlanObj.customer_name} actualizada`
          : `🎉 Tiquetera de ${newPlanObj.customer_name} (${newPlanObj.code}) creada`
      );
      setShowModal(false);
      loadPlansAndUsage();
    }
  };

  const buildVipUrl = (plan) => {
    const origin = window.location.origin || 'https://aluna-qrmenu.vercel.app';
    return `${origin}/${brandSlug}/?vip=${encodeURIComponent(plan.code)}`;
  };

  const handleCopyVipLink = (plan) => {
    const url = buildVipUrl(plan);
    navigator.clipboard?.writeText(url);
    setCopiedCode(plan.code);
    toast.success(`Link VIP de ${plan.customer_name} copiado`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="mb-8 rounded-3xl bg-white border border-emerald-200 shadow-sm overflow-hidden">
      {/* Cabecera de Sección */}
      <div className="bg-gradient-to-r from-[#132A21] via-[#1B3B2E] to-stone-900 p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-stone-950 text-[10px] font-black uppercase tracking-wider">
                Nuevo Add-on BOKU
              </span>
              <span className="text-xs text-emerald-200 font-bold">
                DIY Bowl ($17.000 base) • Semanal / Quincenal / Mensual
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black mt-1">
              🥗 Planes & Tiqueteras Digitales (Club BOKU Fit)
            </h2>
            <p className="text-xs text-white/75 mt-0.5 max-w-2xl">
              Activa planes prepagados por celular o Google. El cliente entra con su Link VIP, instala la App y arma su Bowl diario (1 Base + 1 Proteína + 5 Toppings + Semillas + Salsa) descontando 1 crédito automático.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadPlansAndUsage}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Actualizar créditos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Suscriptor / Tiquetera</span>
          </button>
        </div>
      </div>

      {/* Lista de Suscriptores Activos */}
      <div className="p-5 sm:p-6 space-y-4 bg-stone-50/50">
        {plans.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-sm">
            No tienes tiqueteras activas todavía. Crea la primera con el botón superior.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {plans.map(plan => {
              const u = usageMap[plan.id || plan.code] || {
                totalCredits: Number(plan.total_credits) || 5,
                usedCredits: Number(plan.manual_used_adjustment) || 0,
                remainingCredits: Math.max(
                  0,
                  (Number(plan.total_credits) || 5) - (Number(plan.manual_used_adjustment) || 0)
                ),
                ordersHistory: []
              };
              const vipUrl = buildVipUrl(plan);
              const cleanPhone = String(plan.customer_phone || '').replace(/\D/g, '');
              const waPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
              const waMessage = `¡Hola ${plan.customer_name}! 🥗✨ Ya quedó activa tu *Tiquetera Digital BOKU Fit* con *${u.remainingCredits} almuerzos disponibles*.\n\n📲 *Tu Link VIP directo (tócalo para entrar a armar tu Bowl cada día e instalar la App):*\n${vipUrl}\n\n🔑 *Tu Código de Miembro:* ${plan.code}\n📍 *Entrega:* ${plan.default_address || 'Domicilio'} (${plan.default_time || '2:30 PM'})`;

              return (
                <div
                  key={plan.id || plan.code}
                  className="rounded-2xl bg-white border border-stone-200 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Columna 1: Datos del Cliente + Selector Rápido de Plan */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-mono text-xs font-black">
                        {plan.code}
                      </span>
                      <h3 className="text-base font-black text-stone-900">
                        {plan.customer_name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-stone-500">
                        <Phone className="w-3 h-3" />
                        {plan.customer_phone}
                      </span>
                      {plan.customer_email && (
                        <span className="inline-flex items-center gap-1 text-xs text-stone-400">
                          <Mail className="w-3 h-3" />
                          {plan.customer_email}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                      {plan.default_address && (
                        <span className="inline-flex items-center gap-1 font-semibold text-stone-700">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          {plan.default_address}
                        </span>
                      )}
                      {plan.default_time && (
                        <span className="inline-flex items-center gap-1 font-semibold text-stone-700">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          {plan.default_time}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          plan.includes_delivery
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {plan.includes_delivery
                          ? '🛵 Todo Incluido (Envío $0)'
                          : `🛵 Envío aparte (${formatCOP(plan.delivery_fee || 5000)})`}
                      </span>
                    </div>

                    {/* Cambio rápido de plan en 1 clic (Semanal / Quincenal / Mensual) */}
                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-stone-400 mr-1">
                        Cambiar modalidad en 1 clic:
                      </span>
                      {MEAL_PLAN_TEMPLATES.map(tpl => {
                        const isCurrent = plan.template_id === tpl.id;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            disabled={saving}
                            onClick={() => handleQuickTemplateChange(plan, tpl.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-stone-900 text-white shadow-xs'
                                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                            }`}
                          >
                            {tpl.short_label} ({formatCOP(tpl.plan_price)})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Columna 2: Contador de Créditos + Ajuste Manual */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-100 shrink-0">
                    <div className="flex items-center gap-3 bg-stone-50 px-3.5 py-2 rounded-2xl border border-stone-200">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                          Almuerzos Disponibles
                        </p>
                        <p className="text-lg font-black text-emerald-700 leading-tight">
                          {u.remainingCredits} <span className="text-xs text-stone-400 font-bold">/ {u.totalCredits}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 pl-2 border-l border-stone-200">
                        <button
                          type="button"
                          onClick={() => handleAdjustUsedCredit(plan, 1)}
                          title="Descontar 1 almuerzo manualmente"
                          className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustUsedCredit(plan, -1)}
                          title="Sumar 1 almuerzo disponible"
                          className="p-1.5 rounded-lg hover:bg-stone-200 text-emerald-600 transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRenewPlan(plan)}
                          title="Renovar ciclo (Reiniciar todos los créditos)"
                          className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Acciones: Enviar Link VIP por WhatsApp / Copiar Link / Editar */}
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <a
                        href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Link VIP WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyVipLink(plan)}
                        className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copiedCode === plan.code ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Link</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(plan)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                        title="Editar suscriptor"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        title="Eliminar tiquetera"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Suscriptor */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                {editingPlanId ? 'Editar Tiquetera de Suscriptor' : 'Crear Nueva Tiquetera BOKU Fit'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.customer_name}
                    onChange={e => setForm(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="Ej: Erika"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    WhatsApp / Celular *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.customer_phone}
                    onChange={e => setForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                    placeholder="Ej: 3125535583"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    Código VIP (Opcional)
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="Ej: ERIKA-BOKU"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    Correo Google (Opcional)
                  </label>
                  <input
                    type="email"
                    value={form.customer_email}
                    onChange={e => setForm(prev => ({ ...prev, customer_email: e.target.value }))}
                    placeholder="cliente@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                  Seleccionar Paquete Preconfigurado
                </label>
                <select
                  value={form.template_id}
                  onChange={e => handleFormTemplateSelect(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm font-bold bg-stone-50"
                >
                  {MEAL_PLAN_TEMPLATES.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.label} — {formatCOP(tpl.plan_price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    Total Almuerzos
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={form.total_credits}
                    onChange={e => setForm(prev => ({ ...prev, total_credits: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    Valor Cubierto/Bowl
                  </label>
                  <input
                    type="number"
                    value={form.bowl_value}
                    onChange={e => setForm(prev => ({ ...prev, bowl_value: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    ¿Domicilio Incluido?
                  </label>
                  <select
                    value={form.includes_delivery ? 'yes' : 'no'}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        includes_delivery: e.target.value === 'yes',
                        delivery_fee: e.target.value === 'yes' ? 0 : 5000
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
                  >
                    <option value="yes">Sí (Todo Incluido $0)</option>
                    <option value="no">No (Se cobra por envío)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    Dirección Fija de Entrega
                  </label>
                  <input
                    type="text"
                    value={form.default_address}
                    onChange={e => setForm(prev => ({ ...prev, default_address: e.target.value }))}
                    placeholder="Ej: Paso Ancho"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    Hora Programada Diaria
                  </label>
                  <input
                    type="text"
                    value={form.default_time}
                    onChange={e => setForm(prev => ({ ...prev, default_time: e.target.value }))}
                    placeholder="Ej: 2:30 PM"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  {saving ? 'Guardando...' : 'Guardar Tiquetera'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
