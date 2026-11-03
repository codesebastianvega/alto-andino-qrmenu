import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { formatCOP } from '../../utils/money';
import { toast } from '../Toast';
import AddressInputWithMap from '../delivery/AddressInputWithMap';
import {
  MEAL_PLAN_TEMPLATES,
  DEFAULT_PROGRAM_CONFIG,
  getConfiguredMealPlans,
  getMealPlanProgramConfig,
  fetchPlanUsage,
  getPlanSoupMode
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
  RotateCcw,
  Settings,
  Users,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Layers,
  Save
} from 'lucide-react';

export default function MealPlansAdminSection({
  brandId,
  brandSlug = 'boku-bento',
  allProducts = [],
  currentLocation = null
}) {
  const [activeTab, setActiveTab] = useState('subscribers'); // 'subscribers' | 'config'
  const [plans, setPlans] = useState([]);
  const [programConfig, setProgramConfig] = useState(DEFAULT_PROGRAM_CONFIG);
  const [usageMap, setUsageMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Modal Suscriptor
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
    soup_preference: 'flexible',
    payment_status: 'paid',
    default_address: '',
    default_delivery_notes: '',
    default_coords: null,
    default_time: '2:30 PM',
    dietary_notes: ''
  });

  // Modal CRUD de Paquete / Nivel (Tier)
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTierId, setEditingTierId] = useState(null);
  const [tierForm, setTierForm] = useState({
    label: '',
    short_label: '',
    total_credits: 5,
    plan_price: 80000,
    bowl_value: 17000,
    validity_days: 15,
    includes_delivery: false,
    delivery_fee: 5000,
    badge: '',
    description: ''
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
      const prog = getMealPlanProgramConfig(brandRow);
      setPlans(configured);
      setProgramConfig(prog);

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

  const persistMealPlansConcept = async (nextPlans, nextProgram = programConfig) => {
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
        program: nextProgram,
        plans: nextPlans
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

      setPlans(nextPlans);
      setProgramConfig(nextProgram);
      return true;
    } catch (err) {
      console.error('Error guardando planes tiquetera:', err);
      toast.error('No se pudo guardar el cambio en la base de datos.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const activeTiers = useMemo(
    () => (Array.isArray(programConfig?.tiers) && programConfig.tiers.length > 0 ? programConfig.tiers : MEAL_PLAN_TEMPLATES),
    [programConfig?.tiers]
  );

  const handleQuickTemplateChange = async (plan, newTemplateId) => {
    const tpl = activeTiers.find(t => t.id === newTemplateId);
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

    const ok = await persistMealPlansConcept(updated, programConfig);
    if (ok) {
      toast.success(`✅ Plan de ${plan.customer_name} cambiado a: ${tpl.short_label || tpl.label}`);
      loadPlansAndUsage();
    }
  };

  const handleTogglePaymentStatus = async (plan) => {
    const nextStatus = plan.payment_status === 'paid' ? 'pending' : 'paid';
    const updated = plans.map(p => {
      if ((p.id || p.code) !== (plan.id || plan.code)) return p;
      return { ...p, payment_status: nextStatus };
    });
    const ok = await persistMealPlansConcept(updated, programConfig);
    if (ok) {
      toast.success(
        nextStatus === 'paid'
          ? `✅ Pago de ${plan.customer_name} marcado como Pagado`
          : `⏳ Plan de ${plan.customer_name} marcado con Pago Pendiente`
      );
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

    const ok = await persistMealPlansConcept(updated, programConfig);
    if (ok) {
      toast.success(
        delta > 0
          ? `Se descontó 1 crédito manual a ${plan.customer_name}`
          : `Se devolvió 1 crédito disponible a ${plan.customer_name}`
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

    const ok = await persistMealPlansConcept(updated, programConfig);
    if (ok) {
      toast.success(`🔄 ¡Tiquetera de ${plan.customer_name} renovada con ${plan.total_credits} créditos completos!`);
      loadPlansAndUsage();
    }
  };

  const handleDeletePlan = async (plan) => {
    const updated = plans.filter(p => (p.id || p.code) !== (plan.id || plan.code));
    const ok = await persistMealPlansConcept(updated, programConfig);
    if (ok) {
      toast.success(`Tiquetera de ${plan.customer_name} eliminada`);
    }
  };

  const handleQuickSoupChange = async (plan, nextSoupPref) => {
    const nextNotes =
      nextSoupPref === 'sin_sopa'
        ? 'Sin sopa • 1 Base + 1 Proteína + 5 Verduras/Toppings + Semillas + Salsa'
        : 'Con Sopa del Día o Fruta • 1 Base + 1 Proteína + 5 Toppings + Semillas + Salsa';

    const updated = plans.map(p => {
      if ((p.id || p.code) !== (plan.id || plan.code)) return p;
      return {
        ...p,
        soup_preference: nextSoupPref,
        dietary_notes: nextNotes
      };
    });

    const ok = await persistMealPlansConcept(updated, programConfig);
    if (ok) {
      toast.success(
        nextSoupPref === 'sin_sopa'
          ? `🥗 ${plan.customer_name} configurado en modalidad Sin Sopa (Bowl Fit)`
          : `🥣 ${plan.customer_name} configurado Con Sopa / Fruta Incluida`
      );
    }
  };

  const openCreateModal = () => {
    const firstTier = activeTiers[1] || activeTiers[0] || MEAL_PLAN_TEMPLATES[0];
    setEditingPlanId(null);
    setForm({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      code: '',
      template_id: firstTier.id,
      total_credits: firstTier.total_credits,
      bowl_value: firstTier.bowl_value || programConfig.default_unit_value || 17000,
      includes_delivery: Boolean(firstTier.includes_delivery),
      delivery_fee: Number(firstTier.delivery_fee) || 0,
      soup_preference: programConfig.default_soup_preference || 'flexible',
      payment_status: 'paid',
      default_address: '',
      default_delivery_notes: '',
      default_coords: null,
      default_time: '12:30 PM',
      dietary_notes: 'Incluye Sopa del Día o Fruta + 1 Base + 1 Proteína + 5 Toppings + Semillas + Salsa'
    });
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setEditingPlanId(plan.id || plan.code);
    const detectedSoup = getPlanSoupMode(plan, programConfig);
    setForm({
      customer_name: plan.customer_name || '',
      customer_phone: plan.customer_phone || '',
      customer_email: plan.customer_email || '',
      code: plan.code || '',
      template_id: plan.template_id || activeTiers[0]?.id || 'semanal_full',
      total_credits: Number(plan.total_credits) || 5,
      bowl_value: Number(plan.bowl_value) || 17000,
      includes_delivery: Boolean(plan.includes_delivery),
      delivery_fee: Number(plan.delivery_fee) || 0,
      soup_preference: detectedSoup,
      payment_status: plan.payment_status || 'paid',
      default_address: plan.default_address || '',
      default_delivery_notes: plan.default_delivery_notes || '',
      default_coords: plan.default_coords || null,
      default_time: plan.default_time || '2:30 PM',
      dietary_notes: plan.dietary_notes || ''
    });
    setShowModal(true);
  };

  const handleFormTemplateSelect = (templateId) => {
    const tpl = activeTiers.find(t => t.id === templateId);
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

    const suffix = (programConfig.code_suffix || 'VIP').trim().toUpperCase();
    const generatedCode =
      (form.code || '').trim().toUpperCase() ||
      `${form.customer_name.trim().split(' ')[0].toUpperCase()}-${suffix}`;

    const tpl = activeTiers.find(t => t.id === form.template_id);
    const soupPref = form.soup_preference || 'flexible';
    const autoNotes =
      soupPref === 'sin_sopa'
        ? 'Sin sopa • 1 Base + 1 Proteína + 5 Verduras/Toppings + Semillas + Salsa'
        : 'Con Sopa del Día o Fruta • 1 Base + 1 Proteína + 5 Toppings + Semillas + Salsa';

    const newPlanObj = {
      id: editingPlanId || `plan-${Date.now()}`,
      code: generatedCode,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      customer_email: form.customer_email.trim(),
      template_id: form.template_id,
      plan_label: tpl?.label || programConfig.program_title || 'Plan Tiquetera',
      total_credits: Number(form.total_credits) || 5,
      manual_used_adjustment: editingPlanId
        ? Number(plans.find(p => (p.id || p.code) === editingPlanId)?.manual_used_adjustment) || 0
        : 0,
      bowl_value: Number(form.bowl_value) || 17000,
      includes_delivery: Boolean(form.includes_delivery),
      delivery_fee: form.includes_delivery ? 0 : (Number(form.delivery_fee) || 5000),
      soup_preference: soupPref,
      payment_status: form.payment_status || 'paid',
      default_address: form.default_address.trim(),
      default_delivery_notes: form.default_delivery_notes.trim(),
      default_coords: form.default_coords || null,
      default_time: form.default_time.trim(),
      dietary_notes: form.dietary_notes.trim() || autoNotes,
      status: 'active',
      cycle_start_at: editingPlanId
        ? plans.find(p => (p.id || p.code) === editingPlanId)?.cycle_start_at || new Date().toISOString()
        : new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const nextPlans = editingPlanId
      ? plans.map(p => ((p.id || p.code) === editingPlanId ? newPlanObj : p))
      : [newPlanObj, ...plans];

    const ok = await persistMealPlansConcept(nextPlans, programConfig);
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

  // --- CRUD de Configuración del Programa & Paquetes (Tiers) ---
  const handleSaveProgramSettings = async (e) => {
    e?.preventDefault();
    const ok = await persistMealPlansConcept(plans, programConfig);
    if (ok) {
      toast.success('✅ Configuración del programa y paquetes guardada para tu negocio');
    }
  };

  const openCreateTierModal = () => {
    setEditingTierId(null);
    setTierForm({
      label: 'Plan Quincenal Ejecutivo (10 Almuerzos)',
      short_label: 'Quincenal (10)',
      total_credits: 10,
      plan_price: 155000,
      bowl_value: programConfig.default_unit_value || 17000,
      validity_days: 20,
      includes_delivery: false,
      delivery_fee: programConfig.default_delivery_fee || 5000,
      badge: '10 Almuerzos ($15.500 c/u)',
      description: programConfig.default_dietary_rules || 'Incluye plato fuerte + bebida'
    });
    setShowTierModal(true);
  };

  const openEditTierModal = (tier) => {
    setEditingTierId(tier.id);
    setTierForm({
      label: tier.label || '',
      short_label: tier.short_label || '',
      total_credits: Number(tier.total_credits) || 5,
      plan_price: Number(tier.plan_price) || 80000,
      bowl_value: Number(tier.bowl_value) || 17000,
      validity_days: Number(tier.validity_days) || 15,
      includes_delivery: Boolean(tier.includes_delivery),
      delivery_fee: Number(tier.delivery_fee) || 0,
      badge: tier.badge || '',
      description: tier.description || ''
    });
    setShowTierModal(true);
  };

  const handleSaveTier = async (e) => {
    e.preventDefault();
    if (!tierForm.label.trim()) {
      toast.error('Escribe el nombre del plan');
      return;
    }
    const newTier = {
      id: editingTierId || `tier-${Date.now()}`,
      label: tierForm.label.trim(),
      short_label: tierForm.short_label.trim() || tierForm.label.trim().slice(0, 18),
      total_credits: Number(tierForm.total_credits) || 5,
      plan_price: Number(tierForm.plan_price) || 0,
      bowl_value: Number(tierForm.bowl_value) || 17000,
      validity_days: Number(tierForm.validity_days) || 15,
      includes_delivery: Boolean(tierForm.includes_delivery),
      delivery_fee: tierForm.includes_delivery ? 0 : (Number(tierForm.delivery_fee) || 5000),
      badge:
        tierForm.badge.trim() ||
        `${tierForm.total_credits} ${programConfig.credit_unit_plural || 'Créditos'}`,
      description: tierForm.description.trim()
    };

    const nextTiers = editingTierId
      ? activeTiers.map(t => (t.id === editingTierId ? newTier : t))
      : [...activeTiers, newTier];

    const nextProg = { ...programConfig, tiers: nextTiers };
    const ok = await persistMealPlansConcept(plans, nextProg);
    if (ok) {
      toast.success(editingTierId ? '✅ Paquete actualizado' : '🎉 Nuevo paquete agregado al catálogo');
      setShowTierModal(false);
    }
  };

  const handleDeleteTier = async (tierId) => {
    const nextTiers = activeTiers.filter(t => t.id !== tierId);
    const nextProg = { ...programConfig, tiers: nextTiers };
    const ok = await persistMealPlansConcept(plans, nextProg);
    if (ok) {
      toast.success('Paquete eliminado');
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

  // Métricas Resumen
  const totalRemainingCredits = useMemo(() => {
    return plans.reduce((acc, p) => {
      const u = usageMap[p.id || p.code];
      return acc + (u ? u.remainingCredits : Number(p.total_credits) || 0);
    }, 0);
  }, [plans, usageMap]);

  const gpsVerifiedCount = useMemo(() => {
    return plans.filter(p => p.default_coords?.lat && p.default_coords?.lng).length;
  }, [plans]);

  return (
    <div className="mb-8 rounded-3xl bg-white border border-stone-200/90 shadow-sm overflow-hidden">
      {/* Cabecera Multi-Tenant con Selector de Pestañas (CRM Suscriptores vs Configurador del Add-on) */}
      <div className="bg-gradient-to-r from-[#11241C] via-[#183328] to-stone-900 p-5 sm:p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-stone-950 text-[10px] font-black uppercase tracking-wider">
                  SaaS Add-on • Tiqueteras
                </span>
                <span className="text-xs text-emerald-200/90 font-semibold">
                  Base cubierta: {formatCOP(programConfig.default_unit_value || 17000)} / {programConfig.credit_unit_singular || 'Almuerzo'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black mt-1 tracking-tight">
                {programConfig.program_title || 'Planes & Tiqueteras Digitales'}
              </h2>
              <p className="text-xs text-white/70 mt-0.5 max-w-2xl">
                {programConfig.program_subtitle}
              </p>
            </div>
          </div>

          {/* Botones de Acción & Pestañas */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex p-1 rounded-xl bg-black/30 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('subscribers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'subscribers'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Suscriptores ({plans.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('config')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'config'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configurar Planes y Precios ({activeTiers.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Suscriptor</span>
            </button>
          </div>
        </div>

        {/* Franja de KPIs Operativos */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl px-3.5 py-2.5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80 block">
              Suscriptores Activos
            </span>
            <span className="text-lg sm:text-xl font-black text-white">
              {plans.length} <span className="text-xs font-semibold text-white/60">clientes</span>
            </span>
          </div>
          <div className="bg-white/5 rounded-xl px-3.5 py-2.5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80 block">
              {programConfig.credit_unit_plural || 'Almuerzos'} por Entregar
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-300">
              {totalRemainingCredits} <span className="text-xs font-semibold text-white/60">disponibles</span>
            </span>
          </div>
          <div className="bg-white/5 rounded-xl px-3.5 py-2.5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80 block">
              Pin GPS para Domiciliario
            </span>
            <span className="text-lg sm:text-xl font-black text-white">
              {gpsVerifiedCount}/{plans.length} <span className="text-xs font-semibold text-white/60">ubicados en mapa</span>
            </span>
          </div>
        </div>
      </div>

      {/* PESTAÑA 1: TARJETAS CRM DE SUSCRIPTORES (CON JERARQUÍA VISUAL Y PIN GPS) */}
      {activeTab === 'subscribers' ? (
        <div className="p-5 sm:p-6 space-y-4 bg-stone-50/60">
          {plans.length === 0 ? (
            <div className="text-center py-10 text-stone-500 text-sm">
              No tienes suscriptores activos todavía. Crea el primero con el botón <strong>+ Nuevo Suscriptor</strong>.
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
                const waMessage = `¡Hola ${plan.customer_name}! 🥗✨ Ya quedó activa tu *Tiquetera Digital* con *${u.remainingCredits} ${programConfig.credit_unit_plural?.toLowerCase() || 'almuerzos'} disponibles*.\n\n📲 *Tu Link VIP directo (tócalo para armar tu pedido cada día, marcar tu casa en el mapa e instalar la App):*\n${vipUrl}\n\n🔑 *Tu Código VIP:* ${plan.code}\n📍 *Entrega:* ${plan.default_address || 'Domicilio'} (${plan.default_time || '2:30 PM'})`;

                const initials = String(plan.customer_name || 'VIP')
                  .split(' ')
                  .map(w => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                const pctRemaining = Math.min(
                  100,
                  Math.max(0, Math.round((u.remainingCredits / Math.max(1, u.totalCredits)) * 100))
                );
                const hasGpsPin = Boolean(plan.default_coords?.lat && plan.default_coords?.lng);
                const currentTier = activeTiers.find(t => t.id === plan.template_id);
                const isPaid = plan.payment_status !== 'pending';

                return (
                  <div
                    key={plan.id || plan.code}
                    className="rounded-2xl bg-white border border-stone-200/90 hover:border-emerald-300/80 p-4 sm:p-5 shadow-xs transition-all grid grid-cols-1 lg:grid-cols-12 gap-4 items-center"
                  >
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
                            onClick={() => handleTogglePaymentStatus(plan)}
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

                        {/* Selector Limpio de Modalidad y Sopa (Reemplaza los 6 chips grises) */}
                        <div className="pt-0.5 flex flex-wrap items-center gap-1.5">
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-200/90 rounded-xl px-2.5 py-1">
                            <span className="text-[10px] font-black uppercase text-emerald-800">
                              Plan:
                            </span>
                            <select
                              value={plan.template_id || ''}
                              disabled={saving}
                              onChange={e => handleQuickTemplateChange(plan, e.target.value)}
                              className="bg-transparent text-xs font-black text-emerald-950 focus:outline-none cursor-pointer pr-1"
                            >
                              {activeTiers.map(tpl => (
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
                              handleQuickSoupChange(
                                plan,
                                getPlanSoupMode(plan, programConfig) === 'sin_sopa'
                                  ? 'flexible'
                                  : 'sin_sopa'
                              )
                            }
                            title="Clic para alternar entre Con Sopa/Fruta y Sin Sopa"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                              getPlanSoupMode(plan, programConfig) === 'sin_sopa'
                                ? 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {getPlanSoupMode(plan, programConfig) === 'sin_sopa'
                              ? '🥗 Sin Sopa (Fit)'
                              : '🥣 Con Sopa / Fruta'}
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
                              onClick={() => openEditModal(plan)}
                              className="text-[10px] font-bold text-stone-500 hover:text-stone-900 underline cursor-pointer"
                            >
                              Mover Pin
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openEditModal(plan)}
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
                              {u.remainingCredits} <span className="text-xs text-white/50">/ {u.totalCredits}</span>
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-white/15 mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                pctRemaining > 30 ? 'bg-emerald-400' : pctRemaining > 0 ? 'bg-amber-400' : 'bg-rose-500'
                              }`}
                              style={{ width: `${pctRemaining}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1 pl-2 border-l border-white/15 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAdjustUsedCredit(plan, 1)}
                            title="Descontar 1 crédito usado"
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustUsedCredit(plan, -1)}
                            title="Sumar 1 crédito disponible"
                            className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-400 transition-colors cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRenewPlan(plan)}
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
                          onClick={() => handleCopyVipLink(plan)}
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
                          onClick={() => openEditModal(plan)}
                          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                          title="Editar suscriptor y ubicación en mapa"
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
      ) : (
        /* PESTAÑA 2: CONFIGURADOR MULTI-NEGOCIO DEL ADD-ON Y CRUD DE PLANES/PRECIOS */
        <div className="p-5 sm:p-6 space-y-6 bg-stone-50/50">
          {/* Bloque 1: Identidad del Programa y Plato Vinculado */}
          <form onSubmit={handleSaveProgramSettings} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-600" />
                  1. Identidad del Programa y Plato Base del Negocio
                </h3>
                <p className="text-xs text-stone-500">
                  Personaliza cómo ven tus clientes el programa de tiqueteras en el menú público y qué plato/DIY se abre al canjear.
                </p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Guardando...' : 'Guardar Ajustes'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                  Título del Programa / Club
                </label>
                <input
                  type="text"
                  value={programConfig.program_title || ''}
                  onChange={e => setProgramConfig(prev => ({ ...prev, program_title: e.target.value }))}
                  placeholder="Ej: Planes & Tiqueteras Digitales (Club BOKU Fit)"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                  Sufijo de Códigos VIP
                </label>
                <input
                  type="text"
                  value={programConfig.code_suffix || ''}
                  onChange={e => setProgramConfig(prev => ({ ...prev, code_suffix: e.target.value.toUpperCase() }))}
                  placeholder="Ej: BOKU"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono font-bold uppercase"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                  Subtítulo / Descripción en el Menú Público
                </label>
                <input
                  type="text"
                  value={programConfig.program_subtitle || ''}
                  onChange={e => setProgramConfig(prev => ({ ...prev, program_subtitle: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                  Plato / Armador DIY Vinculado
                </label>
                <select
                  value={programConfig.linked_product_id || ''}
                  onChange={e => setProgramConfig(prev => ({ ...prev, linked_product_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold bg-stone-50"
                >
                  {(allProducts || []).map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.config_options?.is_diy ? '✨ [DIY] ' : ''}
                      {prod.name} ({formatCOP(prod.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                  Valor Base Cubierto por Crédito ($)
                </label>
                <input
                  type="number"
                  value={programConfig.default_unit_value || 17000}
                  onChange={e => setProgramConfig(prev => ({ ...prev, default_unit_value: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                  Toppings / Verduras Gratis Incluidos
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={programConfig.included_toppings_count ?? 5}
                  onChange={e => setProgramConfig(prev => ({ ...prev, included_toppings_count: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
                />
              </div>
            </div>
          </form>

          {/* Bloque 2: CRUD de Planes / Paquetes del Negocio */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  2. Catálogo de Planes y Precios de tu Negocio ({activeTiers.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Crea, edita o elimina los paquetes (Semanal, Quincenal, Mensual) que tu restaurante ofrece a sus clientes.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateTierModal}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Crear Nuevo Paquete / Plan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {activeTiers.map(tier => (
                <div
                  key={tier.id}
                  className="rounded-2xl border border-stone-200 p-4 flex flex-col justify-between gap-3 hover:border-emerald-400 transition-all bg-stone-50/40"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          tier.includes_delivery
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {tier.includes_delivery ? '🛵 Todo Incluido' : '🥗 Solo Platos'}
                      </span>
                      <span className="text-xs font-bold text-stone-500">
                        {tier.total_credits} créditos
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-stone-900 leading-snug">
                      {tier.label}
                    </h4>
                    <p className="text-lg font-black text-emerald-700">
                      {formatCOP(tier.plan_price)}
                      <span className="text-[11px] font-semibold text-stone-400 ml-1">
                        ({formatCOP(Math.round(tier.plan_price / Math.max(1, tier.total_credits)))}/día)
                      </span>
                    </p>
                    <p className="text-[11px] text-stone-500 line-clamp-2">
                      {tier.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/70">
                    <button
                      type="button"
                      onClick={() => openEditTierModal(tier)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar Precio / Plan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTier(tier.id)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                      title="Eliminar paquete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR SUSCRIPTOR (CON MAPA INTERACTIVO Y PIN EXACTO) */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  {editingPlanId ? 'Editar Tiquetera y Punto GPS de Entrega' : 'Crear Nueva Tiquetera de Suscriptor'}
                </h3>
                <p className="text-xs text-stone-500">
                  Configura los créditos, el paquete y marca en el mapa el punto exacto para el domiciliario.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-500 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Datos del Suscriptor */}
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    Código VIP
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
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    Estado del Pago
                  </label>
                  <select
                    value={form.payment_status}
                    onChange={e => setForm(prev => ({ ...prev, payment_status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
                  >
                    <option value="paid">✅ Pagado Completo</option>
                    <option value="pending">⏳ Pendiente / Abono 50%</option>
                  </select>
                </div>
              </div>

              {/* Selección de Plan y Créditos */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    Paquete / Modalidad Elegida
                  </label>
                  <select
                    value={form.template_id}
                    onChange={e => handleFormTemplateSelect(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm font-black bg-white text-stone-900"
                  >
                    {activeTiers.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.label} — {formatCOP(tpl.plan_price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                      Total Almuerzos
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={form.total_credits}
                      onChange={e => setForm(prev => ({ ...prev, total_credits: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                      Valor Cubierto/Plato
                    </label>
                    <input
                      type="number"
                      value={form.bowl_value}
                      onChange={e => setForm(prev => ({ ...prev, bowl_value: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                      Modalidad Envío
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
                      className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold"
                    >
                      <option value="yes">Incluido ($0)</option>
                      <option value="no">Aparte ($5.000)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-1 border-t border-stone-200/70">
                  <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                    Modalidad de Entrada / Sopa del Suscriptor
                  </label>
                  <select
                    value={form.soup_preference || 'flexible'}
                    onChange={e => {
                      const val = e.target.value;
                      setForm(prev => ({
                        ...prev,
                        soup_preference: val,
                        dietary_notes:
                          val === 'sin_sopa'
                            ? 'Sin sopa • 1 Base + 1 Proteína + 5 Verduras/Toppings + Semillas + Salsa'
                            : 'Con Sopa del Día o Fruta • 1 Base + 1 Proteína + 5 Toppings + Semillas + Salsa'
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-black text-stone-900"
                  >
                    <option value="flexible">
                      🥣 Flexible: Con Sopa del Día / Fruta o Solo Bowl (El cliente elige cada día)
                    </option>
                    <option value="con_sopa">
                      🍲 Almuerzo Completo (Siempre incluye Sopa del Día o Fruta)
                    </option>
                    <option value="sin_sopa">
                      🥗 Línea Fit Sin Sopa (Solo Bowl: Base + Proteína + 5 Verduras/Toppings)
                    </option>
                  </select>
                </div>
              </div>

              {/* Dirección con Mapa Interactivo y Pin Exacto */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase text-emerald-950 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Ubicación Exacta de Entrega (Pin en Mapa para el Domiciliario)
                  </label>
                </div>

                <AddressInputWithMap
                  value={form.default_address}
                  onChange={addr => setForm(prev => ({ ...prev, default_address: addr }))}
                  currentLocation={currentLocation}
                  initialCoords={form.default_coords}
                  onLocationSelect={locInfo => {
                    if (locInfo?.coords) {
                      setForm(prev => ({
                        ...prev,
                        default_coords: locInfo.coords
                      }));
                    }
                  }}
                  placeholder="Escribe el barrio/dirección o toca 'Mapa' para poner el pin exacto"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                      Detalles Casa / Apto / Referencia
                    </label>
                    <input
                      type="text"
                      value={form.default_delivery_notes}
                      onChange={e => setForm(prev => ({ ...prev, default_delivery_notes: e.target.value }))}
                      placeholder="Ej: Casa portón blanco, timbre 2"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-stone-500 mb-1">
                      Hora Programada Diaria
                    </label>
                    <input
                      type="text"
                      value={form.default_time}
                      onChange={e => setForm(prev => ({ ...prev, default_time: e.target.value }))}
                      placeholder="Ej: 2:30 PM"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold"
                    />
                  </div>
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
                  {saving ? 'Guardando...' : 'Guardar Tiquetera y Ubicación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR PAQUETE DEL CATÁLOGO (TIER CRUD) */}
      {showTierModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black text-stone-900">
                {editingTierId ? 'Editar Paquete / Plan' : 'Nuevo Paquete / Plan'}
              </h3>
              <button
                type="button"
                onClick={() => setShowTierModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                  Nombre Completo del Plan *
                </label>
                <input
                  type="text"
                  required
                  value={tierForm.label}
                  onChange={e => setTierForm(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Ej: Plan Semanal Todo Incluido (5 Bowls + Domicilio)"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    Nombre Corto
                  </label>
                  <input
                    type="text"
                    value={tierForm.short_label}
                    onChange={e => setTierForm(prev => ({ ...prev, short_label: e.target.value }))}
                    placeholder="Ej: Semanal Todo Incluido (5)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    Cantidad de Almuerzos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tierForm.total_credits}
                    onChange={e => setTierForm(prev => ({ ...prev, total_credits: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    Precio Total del Plan ($)
                  </label>
                  <input
                    type="number"
                    value={tierForm.plan_price}
                    onChange={e => setTierForm(prev => ({ ...prev, plan_price: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    Valor Cubierto/Plato ($)
                  </label>
                  <input
                    type="number"
                    value={tierForm.bowl_value}
                    onChange={e => setTierForm(prev => ({ ...prev, bowl_value: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                    ¿Incluye Domicilio?
                  </label>
                  <select
                    value={tierForm.includes_delivery ? 'yes' : 'no'}
                    onChange={e =>
                      setTierForm(prev => ({
                        ...prev,
                        includes_delivery: e.target.value === 'yes',
                        delivery_fee: e.target.value === 'yes' ? 0 : 5000
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                  >
                    <option value="yes">Sí (Todo Incluido)</option>
                    <option value="no">No (Envío aparte)</option>
                  </select>
                </div>
                {!tierForm.includes_delivery && (
                  <div>
                    <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                      Tarifa Envío por Entrega ($)
                    </label>
                    <input
                      type="number"
                      value={tierForm.delivery_fee}
                      onChange={e => setTierForm(prev => ({ ...prev, delivery_fee: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                  Descripción Corta
                </label>
                <input
                  type="text"
                  value={tierForm.description}
                  onChange={e => setTierForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ej: Incluye 5 Bowls armados a tu gusto + 5 domicilios"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowTierModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer"
                >
                  Guardar Paquete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
