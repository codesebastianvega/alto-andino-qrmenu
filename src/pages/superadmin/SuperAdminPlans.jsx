import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import {
  Edit2, Save, X, Plus, Check, ChevronDown, ChevronUp,
  ShoppingBag, Package, FolderOpen, Users, Star, Sparkles, Trash2, MapPin
} from 'lucide-react';
import { toast } from '../../components/Toast';

/* ── Tier color config ──────────────────────────────────────────── */
const TIER_STYLES = {
  emprendedor: {
    accent: '#F59E0B',
    accentLight: 'rgba(245,158,11,0.08)',
    accentBorder: 'rgba(245,158,11,0.25)',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    label: 'Starter',
  },
  esencial: {
    accent: '#3B82F6',
    accentLight: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.25)',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    label: 'Growth',
  },
  profesional: {
    accent: '#10B981',
    accentLight: 'rgba(16,185,129,0.08)',
    accentBorder: 'rgba(16,185,129,0.3)',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    label: 'Popular',
  },
  premium: {
    accent: '#8B5CF6',
    accentLight: 'rgba(139,92,246,0.08)',
    accentBorder: 'rgba(139,92,246,0.25)',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    label: 'Pro',
  },
  enterprise: {
    accent: '#EC4899',
    accentLight: 'rgba(236,72,153,0.08)',
    accentBorder: 'rgba(236,72,153,0.25)',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
    label: 'Enterprise',
  },
};

const getTierStyle = (name) => {
  const n = name?.toLowerCase() || '';
  if (n.includes('emprendedor')) return TIER_STYLES.emprendedor;
  if (n.includes('esencial')) return TIER_STYLES.esencial;
  if (n.includes('profesional')) return TIER_STYLES.profesional;
  if (n.includes('premium')) return TIER_STYLES.premium;
  if (n.includes('enterprise')) return TIER_STYLES.enterprise;
  return TIER_STYLES.esencial;
};

/* ── Limit Pill ─────────────────────────────────────────────────── */
function LimitPill({ icon: Icon, value, label, accent }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
      style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}20` }}
    >
      <Icon size={13} strokeWidth={2.5} />
      <span>{value ?? '∞'}</span>
      <span className="font-normal opacity-70">{label}</span>
    </div>
  );
}

/* ── Feature Row (view mode) ────────────────────────────────────── */
function FeatureRow({ feature, accent, onToggle }) {
  return (
    <button
      onClick={() => onToggle(feature.id, feature.is_included)}
      className="group flex items-center gap-2.5 w-full text-left py-1.5 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div
        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
        style={feature.is_included
          ? { background: accent, boxShadow: `0 2px 8px ${accent}40` }
          : { background: '#F3F4F6', border: '1.5px solid #D1D5DB' }
        }
      >
        {feature.is_included && <Check size={12} strokeWidth={3} className="text-white" />}
      </div>
      <span className={`text-sm leading-tight transition-colors ${feature.is_included ? 'text-gray-800' : 'text-gray-400'}`}>
        {feature.display_name}
      </span>
    </button>
  );
}

/* ── Edit Panel (slide-over) ────────────────────────────────────── */
function EditPanel({ plan, onSave, onClose, onChange }) {
  const tier = getTierStyle(plan.name);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setSaving(false);
  };

  const updateField = (field, value) => {
    onChange({ ...plan, [field]: value });
  };

  const updateFeature = (index, field, value) => {
    const newFeatures = [...plan.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    onChange({ ...plan, features: newFeatures });
  };

  const addFeature = () => {
    onChange({
      ...plan,
      features: [
        ...plan.features,
        { display_name: '', is_included: true, sort_order: (plan.features.length + 1) * 10 }
      ]
    });
  };

  const removeFeature = (index) => {
    const newFeatures = plan.features.filter((_, i) => i !== index);
    onChange({ ...plan, features: newFeatures });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ background: tier.gradient }} />
            <h2 className="text-lg font-bold text-gray-900">Editar {plan.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
              style={{ background: tier.gradient }}
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={15} />
              )}
              Guardar
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Basic Info */}
          <div className="px-6 py-5 space-y-4 border-b border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Información General</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={plan.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': `${tier.accent}40` }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio Mensual</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                  <input
                    type="number"
                    value={plan.price_monthly}
                    onChange={(e) => updateField('price_monthly', Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-bold focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ '--tw-ring-color': `${tier.accent}40` }}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
              <textarea
                value={plan.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm resize-none focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': `${tier.accent}40` }}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={plan.is_highlighted}
                    onChange={(e) => updateField('is_highlighted', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-all ${plan.is_highlighted ? '' : 'bg-gray-200'}`}
                    style={plan.is_highlighted ? { background: tier.gradient } : {}}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 transition-all ${plan.is_highlighted ? 'left-5' : 'left-1'}`} />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">Destacar en Landing</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Texto del botón CTA</label>
              <input
                type="text"
                value={plan.cta_text || ''}
                onChange={(e) => updateField('cta_text', e.target.value)}
                placeholder="Ej: Comenzar ahora"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': `${tier.accent}40` }}
              />
            </div>
          </div>

          {/* Limits */}
          <div className="px-6 py-5 space-y-4 border-b border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Límites del Plan</h3>
            <p className="text-xs text-gray-400 -mt-2">Deja vacío para indicar ilimitado (∞)</p>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'max_orders_per_month', label: 'Pedidos / Mes', placeholder: '800', icon: ShoppingBag },
                { key: 'max_products', label: 'Productos', placeholder: '50', icon: Package },
                { key: 'max_categories', label: 'Categorías', placeholder: '15', icon: FolderOpen },
                { key: 'max_admins', label: 'Administradores', placeholder: '3', icon: Users },
                { key: 'max_locations', label: 'Sedes', placeholder: '3', icon: MapPin },
              ].map(({ key, label, placeholder, icon: Icon }) => (
                <div key={key}>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
                    <Icon size={12} />
                    {label}
                  </label>
                  <input
                    type="number"
                    placeholder={placeholder}
                    value={plan[key] || ''}
                    onChange={(e) => updateField(key, e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ '--tw-ring-color': `${tier.accent}40` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Características ({plan.features?.length || 0})
              </h3>
              <button
                onClick={addFeature}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                style={{ background: tier.accentLight, color: tier.accent }}
              >
                <Plus size={12} /> Añadir
              </button>
            </div>

            <div className="space-y-2">
              {(plan.features || []).sort((a, b) => a.sort_order - b.sort_order).map((feature, idx) => (
                <div key={feature.id || `new-${idx}`} className="flex items-center gap-2 group">
                  <button
                    onClick={() => updateFeature(idx, 'is_included', !feature.is_included)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all"
                    style={feature.is_included
                      ? { background: tier.accent, boxShadow: `0 2px 6px ${tier.accent}35` }
                      : { background: '#F3F4F6', border: '1.5px solid #D1D5DB' }
                    }
                  >
                    {feature.is_included && <Check size={12} strokeWidth={3} className="text-white" />}
                  </button>
                  <input
                    type="text"
                    value={feature.display_name}
                    onChange={(e) => updateFeature(idx, 'display_name', e.target.value)}
                    placeholder="Nombre de la característica..."
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ '--tw-ring-color': `${tier.accent}40` }}
                  />
                  {!feature.id && (
                    <button
                      onClick={() => removeFeature(idx)}
                      className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function SuperAdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [expandedFeatures, setExpandedFeatures] = useState({});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select(`
          *,
          features:plan_features(*)
        `)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans', error);
      toast.error('Error cargando planes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingPlan) return;
    try {
      const { error: planError } = await supabase
        .from('plans')
        .update({
          name: editingPlan.name,
          price_monthly: editingPlan.price_monthly,
          description: editingPlan.description,
          is_highlighted: editingPlan.is_highlighted,
          cta_text: editingPlan.cta_text,
          max_orders_per_month: editingPlan.max_orders_per_month || null,
          max_products: editingPlan.max_products || null,
          max_categories: editingPlan.max_categories || null,
          max_admins: editingPlan.max_admins || null,
          max_locations: editingPlan.max_locations || null,
        })
        .eq('id', editingPlan.id);
      
      if (planError) throw planError;

      for (const feature of editingPlan.features) {
        if (feature.id) {
          const { error: fError } = await supabase
            .from('plan_features')
            .update({
              display_name: feature.display_name,
              is_included: feature.is_included
            })
            .eq('id', feature.id);
          if (fError) throw fError;
        } else if (feature.display_name.trim()) {
          const { error: fError } = await supabase
            .from('plan_features')
            .insert({
              plan_id: editingPlan.id,
              display_name: feature.display_name,
              is_included: feature.is_included,
              sort_order: (editingPlan.features.length + 1) * 10
            });
          if (fError) throw fError;
        }
      }

      await fetchPlans();
      setEditingPlan(null);
      toast.success('Plan actualizado correctamente');
    } catch (error) {
      console.error('Error updating plan', error);
      toast.error('Error al guardar el plan');
    }
  };

  const toggleFeature = async (featureId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('plan_features')
        .update({ is_included: !currentStatus })
        .eq('id', featureId);
      
      if (error) throw error;
      await fetchPlans();
      toast.success('Característica actualizada');
    } catch (error) {
      console.error('Error updating feature', error);
      toast.error('Error al actualizar');
    }
  };

  const toggleExpandFeatures = (planId) => {
    setExpandedFeatures(prev => ({ ...prev, [planId]: !prev[planId] }));
  };

  /* ── Loading state ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Cargando planes...</p>
        </div>
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-3xl text-[#1A1A1A] font-bold mb-1"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Planes de Suscripción
        </h1>
        <p className="text-sm text-gray-400">
          Gestiona los precios, límites y características de cada plan. Los cambios se reflejan en tiempo real.
        </p>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-5">
        {plans.map((plan) => {
          const tier = getTierStyle(plan.name);
          const features = (plan.features || []).sort((a, b) => a.sort_order - b.sort_order);
          const includedFeatures = features.filter(f => f.is_included);
          const excludedFeatures = features.filter(f => !f.is_included);
          const isExpanded = expandedFeatures[plan.id];
          const visibleFeatures = isExpanded ? features : includedFeatures.slice(0, 6);
          const hasMore = includedFeatures.length > 6 || excludedFeatures.length > 0;

          return (
            <div
              key={plan.id}
              className="group bg-white rounded-2xl flex flex-col relative overflow-hidden transition-all duration-300 hover:shadow-lg"
              style={{
                border: `1.5px solid ${plan.is_highlighted ? tier.accent : '#E5E7EB'}`,
                boxShadow: plan.is_highlighted ? `0 8px 30px ${tier.accent}15` : '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {/* ── Gradient top bar ─────────────────────────────── */}
              <div className="h-1.5 w-full" style={{ background: tier.gradient }} />

              {/* ── Badge ─────────────────────────────────────── */}
              {plan.is_highlighted && (
                <div className="absolute top-4 right-4 z-10">
                  <div
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
                    style={{ background: tier.gradient, boxShadow: `0 2px 10px ${tier.accent}40` }}
                  >
                    <Star size={10} fill="currentColor" />
                    {tier.label}
                  </div>
                </div>
              )}

              {/* ── Header ──────────────────────────────────────── */}
              <div className="px-5 pt-5 pb-0">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: tier.gradient }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: tier.accent }}>
                        {tier.label}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  </div>
                  <button
                    onClick={() => setEditingPlan({ ...plan })}
                    className="p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 size={15} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-4 min-h-[32px] leading-relaxed">{plan.description}</p>
              </div>

              {/* ── Price ───────────────────────────────────────── */}
              <div className="px-5 pb-4">
                <div className="flex items-baseline gap-1">
                  {plan.is_custom_pricing ? (
                    <span className="text-2xl font-black text-gray-900">A medida</span>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>
                        ${plan.price_monthly?.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-400 font-medium">/mes</span>
                    </>
                  )}
                </div>
              </div>

              {/* ── Limits Pills ─────────────────────────────────── */}
              <div className="px-5 pb-4">
                <div className="flex flex-wrap gap-1.5">
                  <LimitPill
                    icon={ShoppingBag}
                    value={plan.max_orders_per_month?.toLocaleString()}
                    label={plan.max_orders_per_month ? 'ped/mes' : 'pedidos'}
                    accent={tier.accent}
                  />
                  <LimitPill
                    icon={Package}
                    value={plan.max_products}
                    label="prod."
                    accent={tier.accent}
                  />
                  <LimitPill
                    icon={FolderOpen}
                    value={plan.max_categories}
                    label="categ."
                    accent={tier.accent}
                  />
                  <LimitPill
                    icon={Users}
                    value={plan.max_admins && plan.max_admins > 0 ? plan.max_admins : null}
                    label="admins"
                    accent={tier.accent}
                  />
                  <LimitPill
                    icon={MapPin}
                    value={plan.max_locations && plan.max_locations > 0 ? plan.max_locations : null}
                    label={plan.max_locations === 1 ? 'sede' : 'sedes'}
                    accent={tier.accent}
                  />
                </div>
              </div>

              {/* ── Divider ─────────────────────────────────────── */}
              <div className="mx-5 border-t border-gray-100" />

              {/* ── Features ────────────────────────────────────── */}
              <div className="px-5 py-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                    {includedFeatures.length}/{features.length} incluidas
                  </span>
                </div>

                <div className="space-y-0.5 flex-1">
                  {visibleFeatures.map((feature) => (
                    <FeatureRow
                      key={feature.id}
                      feature={feature}
                      accent={tier.accent}
                      onToggle={toggleFeature}
                    />
                  ))}
                </div>

                {hasMore && (
                  <button
                    onClick={() => toggleExpandFeatures(plan.id)}
                    className="flex items-center justify-center gap-1.5 w-full mt-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    {isExpanded ? (
                      <><ChevronUp size={14} /> Mostrar menos</>
                    ) : (
                      <><ChevronDown size={14} /> Ver {features.length - visibleFeatures.length} más</>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Edit Panel ──────────────────────────────────────────── */}
      {editingPlan && (
        <EditPanel
          plan={editingPlan}
          onSave={handleSave}
          onClose={() => setEditingPlan(null)}
          onChange={setEditingPlan}
        />
      )}
    </div>
  );
}
