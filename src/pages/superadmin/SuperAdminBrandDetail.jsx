import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { ArrowLeft, Store, Save, ExternalLink } from 'lucide-react';

export default function SuperAdminBrandDetail() {
  const { id } = useParams();
  const [brand, setBrand] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('id', id)
        .single();
      
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('id, name')
        .order('sort_order');

      const { data: settingsData } = await supabase
        .from('restaurant_settings')
        .select('legal_name, legal_id')
        .eq('brand_id', id)
        .maybeSingle();

      if (brandError) throw brandError;
      if (plansError) throw plansError;

      setBrand({
        ...brandData,
        legal_name: settingsData?.legal_name || '',
        legal_id: settingsData?.legal_id || ''
      });
      setPlans(plansData);
    } catch (error) {
      console.error('Error fetching brand details', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('brands')
        .update({
          name: brand.name,
          slug: brand.slug,
          plan_id: brand.plan_id,
          city: brand.city,
          country: brand.country,
          phone: brand.phone,
          email: brand.email,
          description: brand.description
        })
        .eq('id', id);
      
      if (error) throw error;

      try {
        await supabase.from('restaurant_settings')
          .update({ legal_name: brand.legal_name, legal_id: brand.legal_id })
          .eq('brand_id', id);
      } catch (e) {
         console.warn("Legal fields not yet implemented in DB", e);
      }

      alert('Cambios guardados correctamente');
    } catch (error) {
      console.error('Error saving brand', error);
      alert('Error guardando los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Cargando detalle...</div>;
  if (!brand) return <div className="p-8">Negocio no encontrado</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/superadmin/brands" className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl text-[#1A1A1A] font-bold flex items-center gap-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
            <span className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Store size={20} />
            </span>
            {brand.name}
          </h1>
        </div>
        <a 
          href={`/${brand.slug}/admin`} 
          target="_blank" 
          className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Entrar como Admin
          <ExternalLink size={16} />
        </a>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E5E7EB]">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Negocio</label>
              <input
                type="text"
                required
                value={brand.name || ''}
                onChange={(e) => setBrand({...brand, name: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL (Slug)</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 text-gray-500 text-sm">
                  aluna.app/
                </span>
                <input
                  type="text"
                  required
                  value={brand.slug || ''}
                  onChange={(e) => setBrand({...brand, slug: e.target.value})}
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-r-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan de Suscripción</label>
              <select
                value={brand.plan_id || ''}
                onChange={(e) => setBrand({...brand, plan_id: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">-- Seleccionar Plan --</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contacto</label>
              <input
                type="email"
                value={brand.email || ''}
                onChange={(e) => setBrand({...brand, email: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp</label>
              <input
                type="text"
                value={brand.phone || ''}
                onChange={(e) => setBrand({...brand, phone: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input
                type="text"
                value={brand.city || ''}
                onChange={(e) => setBrand({...brand, city: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
              <input
                type="text"
                value={brand.country || ''}
                onChange={(e) => setBrand({...brand, country: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción corta</label>
              <textarea
                value={brand.description || ''}
                onChange={(e) => setBrand({...brand, description: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                rows={3}
              />
            </div>

            <div className="md:col-span-2 pt-4 border-t border-gray-100 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Legal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                  <input
                    type="text"
                    value={brand.legal_name || ''}
                    onChange={(e) => setBrand({...brand, legal_name: e.target.value})}
                    placeholder="Ej. Restaurantes del Sur S.A.S."
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIT / RUT</label>
                  <input
                    type="text"
                    value={brand.legal_id || ''}
                    onChange={(e) => setBrand({...brand, legal_id: e.target.value})}
                    placeholder="Ej. 900.000.000-1"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E5E7EB] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
