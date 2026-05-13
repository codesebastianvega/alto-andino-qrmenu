import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase';
import { Link } from 'react-router-dom';
import { Store, CheckCircle, XCircle, Search, Settings, MapPin, MoreVertical, Clock, AlertTriangle, Building2, CalendarPlus } from 'lucide-react';

export default function SuperAdminBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchBrands();
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select(`
          id, name, slug, is_active, created_at, city, google_maps_url,
          payment_verified, trial_end_date, trial_start_date, subscription_status,
          plan:plans(name),
          locations(count)
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
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error toggling brand', error);
    }
  };

  const extendTrial = async (id, currentEndDate) => {
    try {
      const current = currentEndDate ? new Date(currentEndDate) : new Date();
      current.setDate(current.getDate() + 21);
      
      const { error } = await supabase
        .from('brands')
        .update({ 
          trial_end_date: current.toISOString(),
          subscription_status: 'trialing'
        })
        .eq('id', id);
        
      if (error) throw error;
      
      setBrands(brands.map(b => b.id === id ? { ...b, trial_end_date: current.toISOString(), subscription_status: 'trialing' } : b));
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error extending trial', error);
    }
  };

  const getBrandStatus = (brand) => {
    const now = new Date();
    if (brand.payment_verified || brand.subscription_status === 'active') return 'active';
    if (!brand.trial_end_date) return 'unknown';
    
    const trialEnd = new Date(brand.trial_end_date);
    const isTrialing = brand.subscription_status === 'trialing' || brand.subscription_status === 'trial' || !brand.subscription_status;
    
    if (isTrialing && trialEnd > now) return 'trial';
    if (isTrialing && trialEnd <= now) return 'overdue';
    
    return 'active'; // Fallback for active subscriptions
  };

  const getTrialDaysLeft = (endDate) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredBrands = brands.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) || 
                          b.slug.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    const status = getBrandStatus(b);
    const now = new Date();
    const created = new Date(b.created_at);
    const isNew = (now - created) / (1000 * 60 * 60 * 24) <= 21;

    switch (filterTab) {
      case 'trial': return status === 'trial';
      case 'overdue': return status === 'overdue';
      case 'new': return isNew;
      default: return true;
    }
  });

  const tabs = [
    { id: 'all', label: 'Todos' },
    { id: 'trial', label: 'En Trial' },
    { id: 'overdue', label: 'Morosos' },
    { id: 'new', label: 'Nuevos (21 días)' },
  ];

  if (loading) return <div className="p-8">Cargando negocios...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-4">
        <h1 className="text-3xl text-[#1A1A1A] font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Centro de Mando ({brands.length})
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

      <div className="flex border-b border-gray-200 gap-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`pb-3 font-medium text-sm transition-colors relative ${
              filterTab === tab.id 
                ? 'text-emerald-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {filterTab === tab.id && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-[#E5E7EB] text-gray-500 text-sm">
              <th className="py-4 px-6 font-medium">Restaurante</th>
              <th className="py-4 px-6 font-medium">Plan</th>
              <th className="py-4 px-6 font-medium">Estado de Pago</th>
              <th className="py-4 px-6 font-medium">Sedes</th>
              <th className="py-4 px-6 font-medium">Cuenta</th>
              <th className="py-4 px-6 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredBrands.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-500">
                  No se encontraron negocios con estos filtros
                </td>
              </tr>
            ) : (
              filteredBrands.map((brand) => {
                const status = getBrandStatus(brand);
                const trialDays = getTrialDaysLeft(brand.trial_end_date);
                
                return (
                  <tr key={brand.id} className="border-b border-[#E5E7EB] hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1A1A1A]">{brand.name}</span>
                          {brand.google_maps_url && (
                            <a 
                              href={brand.google_maps_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-emerald-600 transition-all"
                              title="Ver en Google Maps"
                            >
                              <MapPin size={14} />
                            </a>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">/{brand.slug}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {brand.plan?.name || 'Ninguno'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 items-start">
                        {status === 'active' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle size={12} /> Al Día
                          </span>
                        )}
                        {status === 'trial' && (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                              <Clock size={12} /> En Trial
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">
                              Quedan {trialDays} días
                            </span>
                          </>
                        )}
                        {status === 'overdue' && (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                              <AlertTriangle size={12} /> Moroso
                            </span>
                            <span className="text-[11px] text-red-500 font-medium">
                              Venció hace {Math.abs(trialDays)} días
                            </span>
                          </>
                        )}
                        {status === 'unknown' && (
                          <span className="text-xs text-gray-500">Desconocido</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Building2 size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-700">{brand.locations[0]?.count || 0}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          brand.is_active 
                            ? 'text-gray-700 bg-gray-100' 
                            : 'text-gray-400 bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${brand.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                        {brand.is_active ? 'Activa' : 'Suspendida'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === brand.id ? null : brand.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {activeDropdown === brand.id && (
                        <div ref={dropdownRef} className="absolute right-8 top-10 w-48 bg-white rounded-xl shadow-lg border border-[#E5E7EB] py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                          <Link
                            to={`/superadmin/brands/${brand.id}`}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                          >
                            <Settings size={16} className="text-gray-400" />
                            Ver Detalles
                          </Link>
                          
                          <button
                            onClick={() => extendTrial(brand.id, brand.trial_end_date)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                          >
                            <CalendarPlus size={16} className="text-blue-500" />
                            Extender Trial (+7d)
                          </button>
                          
                          <div className="h-px bg-gray-100 my-1 mx-2"></div>

                          <button
                            onClick={() => toggleBrandActive(brand.id, brand.is_active)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm w-full text-left transition-colors ${
                              brand.is_active 
                                ? 'text-red-600 hover:bg-red-50' 
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {brand.is_active ? (
                              <><XCircle size={16} /> Suspender Cuenta</>
                            ) : (
                              <><CheckCircle size={16} /> Reactivar Cuenta</>
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
