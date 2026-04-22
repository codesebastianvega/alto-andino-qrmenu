import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Link } from 'react-router-dom';
import { Store, CheckCircle, XCircle, Search, Settings, MapPin } from 'lucide-react';

export default function SuperAdminBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select(`
          id, name, slug, is_active, created_at, city, google_maps_url,
          plan:plans(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBrandActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('brands')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      setBrands(brands.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
    } catch (error) {
      console.error('Error toggling brand', error);
    }
  };

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8">Cargando negocios...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl text-[#1A1A1A] font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Negocios ({brands.length})
        </h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[300px]"
            />
          </div>
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition">
            + Nuevo Negocio
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-[#E5E7EB] text-gray-500 text-sm">
              <th className="py-4 px-6 font-medium">Restaurante</th>
              <th className="py-4 px-6 font-medium">URL (Slug)</th>
              <th className="py-4 px-6 font-medium">Plan</th>
              <th className="py-4 px-6 font-medium">Ciudad</th>
              <th className="py-4 px-6 font-medium">Estado</th>
              <th className="py-4 px-6 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredBrands.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  No se encontraron negocios
                </td>
              </tr>
            ) : (
              filteredBrands.map((brand) => (
                <tr key={brand.id} className="border-b border-[#E5E7EB] hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Store size={20} />
                      </div>
                      <span className="font-semibold text-[#1A1A1A]">{brand.name}</span>
                      {brand.google_maps_url && (
                        <a 
                          href={brand.google_maps_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"
                          title="Ver en Google Maps"
                        >
                          <MapPin size={14} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">/{brand.slug}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {brand.plan?.name || 'Viendo'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{brand.city || '-'}</td>
                  <td className="py-4 px-6">
                    <button 
                      onClick={() => toggleBrandActive(brand.id, brand.is_active)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        brand.is_active 
                          ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {brand.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {brand.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      to={`/superadmin/brands/${brand.id}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                    >
                      <Settings size={16} />
                      Editar
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
