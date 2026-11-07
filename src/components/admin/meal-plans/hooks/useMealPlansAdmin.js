import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../../config/supabase';
import { toast } from '../../../Toast';
import {
  MEAL_PLAN_TEMPLATES,
  DEFAULT_PROGRAM_CONFIG,
  getConfiguredMealPlans,
  getMealPlanProgramConfig,
  fetchPlanUsage,
  getPlanSoupMode
} from '../../../../utils/mealPlans';
import {
  buildVipUrl,
  calculateTotalRemainingCredits,
  calculateGpsVerifiedCount
} from '../helpers/mealPlansAdminHelpers';

export function useMealPlansAdmin({ brandId, brandSlug = 'boku-bento' }) {
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

      const brandRow = (rsRows || []).find((r) => !r.location_id) || (rsRows || [])[0] || null;
      const configured = getConfiguredMealPlans(brandRow);
      const prog = getMealPlanProgramConfig(brandRow);
      setPlans(configured);
      setProgramConfig(prog);

      const map = {};
      await Promise.all(
        configured.map(async (p) => {
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
        (rsRows || []).map((row) => {
          const existingConcepts = Array.isArray(row.brand_concepts) ? row.brand_concepts : [];
          const nextConcepts = [
            ...existingConcepts.filter((c) => c && c.id !== 'meal_plans_config'),
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
    () =>
      Array.isArray(programConfig?.tiers) && programConfig.tiers.length > 0
        ? programConfig.tiers
        : MEAL_PLAN_TEMPLATES,
    [programConfig?.tiers]
  );

  const handleQuickTemplateChange = async (plan, newTemplateId) => {
    const tpl = activeTiers.find((t) => t.id === newTemplateId);
    if (!tpl) return;

    const updated = plans.map((p) => {
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
    const updated = plans.map((p) => {
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
    const updated = plans.map((p) => {
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
    const updated = plans.map((p) => {
      if ((p.id || p.code) !== (plan.id || plan.code)) return p;
      return {
        ...p,
        manual_used_adjustment: 0,
        cycle_start_at: new Date().toISOString()
      };
    });

    const ok = await persistMealPlansConcept(updated, programConfig);
    if (ok) {
      toast.success(
        `🔄 ¡Tiquetera de ${plan.customer_name} renovada con ${plan.total_credits} créditos completos!`
      );
      loadPlansAndUsage();
    }
  };

  const handleDeletePlan = async (plan) => {
    const updated = plans.filter((p) => (p.id || p.code) !== (plan.id || plan.code));
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

    const updated = plans.map((p) => {
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
      dietary_notes:
        'Incluye Sopa del Día o Fruta + 1 Base + 1 Proteína + 5 Toppings + Semillas + Salsa'
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
    const tpl = activeTiers.find((t) => t.id === templateId);
    if (!tpl) return;
    setForm((prev) => ({
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

    const tpl = activeTiers.find((t) => t.id === form.template_id);
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
        ? Number(plans.find((p) => (p.id || p.code) === editingPlanId)?.manual_used_adjustment) || 0
        : 0,
      bowl_value: Number(form.bowl_value) || 17000,
      includes_delivery: Boolean(form.includes_delivery),
      delivery_fee: form.includes_delivery ? 0 : Number(form.delivery_fee) || 5000,
      soup_preference: soupPref,
      payment_status: form.payment_status || 'paid',
      default_address: form.default_address.trim(),
      default_delivery_notes: form.default_delivery_notes.trim(),
      default_coords: form.default_coords || null,
      default_time: form.default_time.trim(),
      dietary_notes: form.dietary_notes.trim() || autoNotes,
      status: 'active',
      cycle_start_at: editingPlanId
        ? plans.find((p) => (p.id || p.code) === editingPlanId)?.cycle_start_at ||
          new Date().toISOString()
        : new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const nextPlans = editingPlanId
      ? plans.map((p) => ((p.id || p.code) === editingPlanId ? newPlanObj : p))
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
      delivery_fee: tierForm.includes_delivery ? 0 : Number(tierForm.delivery_fee) || 5000,
      badge:
        tierForm.badge.trim() ||
        `${tierForm.total_credits} ${programConfig.credit_unit_plural || 'Créditos'}`,
      description: tierForm.description.trim()
    };

    const nextTiers = editingTierId
      ? activeTiers.map((t) => (t.id === editingTierId ? newTier : t))
      : [...activeTiers, newTier];

    const nextProg = { ...programConfig, tiers: nextTiers };
    const ok = await persistMealPlansConcept(plans, nextProg);
    if (ok) {
      toast.success(editingTierId ? '✅ Paquete actualizado' : '🎉 Nuevo paquete agregado al catálogo');
      setShowTierModal(false);
    }
  };

  const handleDeleteTier = async (tierId) => {
    const nextTiers = activeTiers.filter((t) => t.id !== tierId);
    const nextProg = { ...programConfig, tiers: nextTiers };
    const ok = await persistMealPlansConcept(plans, nextProg);
    if (ok) {
      toast.success('Paquete eliminado');
    }
  };

  const handleCopyVipLink = (plan) => {
    const url = buildVipUrl(brandSlug, plan.code);
    navigator.clipboard?.writeText(url);
    setCopiedCode(plan.code);
    toast.success(`Link VIP de ${plan.customer_name} copiado`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const totalRemainingCredits = useMemo(
    () => calculateTotalRemainingCredits(plans, usageMap),
    [plans, usageMap]
  );

  const gpsVerifiedCount = useMemo(
    () => calculateGpsVerifiedCount(plans),
    [plans]
  );

  return {
    activeTab,
    setActiveTab,
    plans,
    programConfig,
    setProgramConfig,
    usageMap,
    loading,
    saving,
    copiedCode,
    activeTiers,
    totalRemainingCredits,
    gpsVerifiedCount,
    loadPlansAndUsage,
    handleQuickTemplateChange,
    handleTogglePaymentStatus,
    handleAdjustUsedCredit,
    handleRenewPlan,
    handleDeletePlan,
    handleQuickSoupChange,
    handleCopyVipLink,
    showModal,
    setShowModal,
    editingPlanId,
    form,
    setForm,
    openCreateModal,
    openEditModal,
    handleFormTemplateSelect,
    handleSaveForm,
    handleSaveProgramSettings,
    showTierModal,
    setShowTierModal,
    editingTierId,
    tierForm,
    setTierForm,
    openCreateTierModal,
    openEditTierModal,
    handleSaveTier,
    handleDeleteTier
  };
}
