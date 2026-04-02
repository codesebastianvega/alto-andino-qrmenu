import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { CreditCard, Edit2, CheckCircle, Save, X, Plus } from 'lucide-react';

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);

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
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan({ ...plan });
  };

  const handleSave = async () => {
    try {
      const { error: planError } = await supabase
        .from('plans')
        .update({
          name: editingPlan.name,
          price_monthly: editingPlan.price_monthly,
          description: editingPlan.description,
          is_highlighted: editingPlan.is_highlighted,
          cta_text: editingPlan.cta_text
        })
        .eq('id', editingPlan.id);
      
      if (planError) throw planError;

      for (const feature of editingPlan.features) {
        if (feature.id) {
          await supabase
            .from('plan_features')
            .update({
              display_name: feature.display_name,
              is_included: feature.is_included
            })
            .eq('id', feature.id);
        } else {
          await supabase
            .from('plan_features')
            .insert({
              plan_id: editingPlan.id,
              display_name: feature.display_name,
              is_included: feature.is_included,
              sort_order: editingPlan.features.length * 10
            });
        }
      }

      fetchPlans();
      setEditingPlan(null);
    } catch (error) {
      console.error('Error updating plan', error);
      alert('Error al guardar el plan o sus features');
    }
  };

  const toggleFeature = async (featureId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('plan_features')
        .update({ is_included: !currentStatus })
        .eq('id', featureId);
      
      if (error) throw error;
      fetchPlans(); // Refresh data to get nested features update easily
    } catch (error) {
      console.error('Error updating feature', error);
    }
  };

  if (loading) return <div className="p-8">Cargando planes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl text-[#1A1A1A] font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Planes de Suscripción
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isEditing = editingPlan?.id === plan.id;
          const currentData = isEditing ? editingPlan : plan;

          return (
            <div 
              key={plan.id} 
              className={`bg-white rounded-3xl p-8 flex flex-col relative transition-all duration-300 ${
                currentData.is_highlighted 
                  ? 'border-2 border-emerald-500 shadow-xl lg:-translate-y-4' 
                  : 'border border-[#E5E7EB] shadow-sm'
              }`}
            >
              {currentData.is_highlighted && (
                <div className="absolute top-4 right-8 z-10 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Popular / Highlight
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                {isEditing ? (
                  <input
                    type="text"
                    value={currentData.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="text-2xl font-bold bg-gray-50 border border-gray-200 rounded px-2 w-1/2"
                  />
                ) : (
                  <h3 className="text-2xl text-[#1A1A1A]" style={{ fontFamily: "'DM Serif Display', serif" }}>
                    {currentData.name}
                  </h3>
                )}
                
                {isEditing ? (
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                      <Save size={18} />
                    </button>
                    <button onClick={() => setEditingPlan(null)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleEdit(plan)} className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg transition-colors">
                    <Edit2 size={18} />
                  </button>
                )}
              </div>

              {isEditing ? (
                <textarea
                  value={currentData.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="text-sm text-gray-500 mb-6 bg-gray-50 border border-gray-200 rounded p-2 w-full resize-none"
                  rows={2}
                />
              ) : (
                <p className="text-sm text-[#6B7280] mb-8 min-h-[40px]">
                  {currentData.description}
                </p>
              )}

              <div className="mb-8">
                {isEditing && !currentData.is_custom_pricing ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">$</span>
                    <input
                      type="number"
                      value={currentData.price_monthly}
                      onChange={(e) => setEditingPlan({ ...editingPlan, price_monthly: Number(e.target.value) })}
                      className="text-4xl font-bold bg-gray-50 border border-gray-200 rounded px-2 w-32" style={{ fontFamily: "'DM Serif Display', serif" }}
                    />
                  </div>
                ) : (
                  <div className="text-5xl text-[#1A1A1A]" style={{ fontFamily: "'DM Serif Display', serif" }}>
                    {currentData.is_custom_pricing ? 'Custom' : `$${currentData.price_monthly.toLocaleString()}`}
                    {!currentData.is_custom_pricing && <span className="text-lg font-sans text-[#6B7280]">/mes</span>}
                  </div>
                )}
              </div>

              {/* Toggles extra properties on edit */}
              {isEditing && (
                <div className="mb-6 space-y-4 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
                  <label className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={currentData.is_highlighted} 
                      onChange={(e) => setEditingPlan({ ...editingPlan, is_highlighted: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300"
                    />
                    Destacar en Landing
                  </label>
                  <div>
                    <span className="block text-gray-600 mb-1">Texto del botón CTA:</span>
                    <input
                      type="text"
                      value={currentData.cta_text || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, cta_text: e.target.value })}
                      className="border border-gray-200 rounded px-3 py-1.5 w-full bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Features List */}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-4 border-b pb-2 flex justify-between items-center">
                  Features
                  <Plus size={16} className="text-gray-400" />
                </h4>
                <ul className="space-y-3 mb-8 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                  {(currentData.features || []).sort((a,b) => a.sort_order - b.sort_order).map((feature, featureIndex) => (
                    <li key={feature.id || featureIndex} className="flex items-start gap-3">
                      {!isEditing ? (
                        <>
                          <button 
                            onClick={() => toggleFeature(feature.id, feature.is_included)}
                            className={`mt-0.5 shrink-0 transition-colors ${
                              feature.is_included ? 'text-emerald-500 hover:text-emerald-700' : 'text-gray-300 hover:text-gray-500'
                            }`}
                            title={feature.is_included ? 'Quitar' : 'Añadir'}
                          >
                            <CheckCircle size={18} className={feature.is_included ? 'fill-emerald-50' : ''} />
                          </button>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${feature.is_included ? 'text-gray-900' : 'text-gray-400'}`}>
                              {feature.icon && <span className="mr-2">{feature.icon}</span>}
                              {feature.display_name}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex gap-2 items-center">
                          <input 
                            type="checkbox" 
                            checked={feature.is_included}
                            onChange={(e) => {
                              const newFeatures = [...editingPlan.features];
                              newFeatures[featureIndex].is_included = e.target.checked;
                              setEditingPlan({ ...editingPlan, features: newFeatures });
                            }}
                            className="w-4 h-4 shrink-0 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                          />
                          <input
                            type="text"
                            value={feature.display_name}
                            onChange={(e) => {
                              const newFeatures = [...editingPlan.features];
                              newFeatures[featureIndex].display_name = e.target.value;
                              setEditingPlan({ ...editingPlan, features: newFeatures });
                            }}
                            className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      )}
                    </li>
                  ))}
                  {isEditing && (
                    <li>
                      <button 
                        onClick={() => {
                          setEditingPlan({
                            ...editingPlan,
                            features: [
                              ...editingPlan.features,
                              { display_name: 'Nueva característica', is_included: true, sort_order: editingPlan.features.length * 10 }
                            ]
                          })
                        }}
                        className="w-full mt-2 py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm font-medium text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                      >
                        + Añadir Característica
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
