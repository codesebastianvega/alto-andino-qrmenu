import { useEffect, useState } from 'react';
import { CheckCircle, Search, Users, Store, ChevronDown, ChevronUp, Shield, User as UserIcon } from 'lucide-react';
import { supabase } from '../../config/supabase';

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles with their brands via owner_id relationship
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at, avatar_url, brand_id')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Now fetch all brands and map them to their owners
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, slug, owner_id, is_active, plan:plans(name)')
        .order('name');

      if (brandsError) {
        console.warn('Could not fetch brands for users:', brandsError);
      }

      // Group brands by owner_id
      const brandsByOwner = {};
      (brands || []).forEach(brand => {
        if (!brand.owner_id) return;
        if (!brandsByOwner[brand.owner_id]) brandsByOwner[brand.owner_id] = [];
        brandsByOwner[brand.owner_id].push(brand);
      });

      // Merge brands into user profiles
      const usersWithBrands = (profiles || []).map(profile => ({
        ...profile,
        brands: brandsByOwner[profile.id] || [],
      }));

      setUsers(usersWithBrands);
    } catch (error) {
      console.error('Error fetching users', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
            <Shield size={12} />
            Superadmin
          </span>
        );
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Store size={12} />
            Propietario
          </span>
        );
      case 'waiter':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            <UserIcon size={12} />
            Mesero
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
            <UserIcon size={12} />
            {role || 'Sin rol'}
          </span>
        );
    }
  };

  const filteredUsers = users.filter((user) => {
    const term = search.toLowerCase();
    return (
      (user.full_name || '').toLowerCase().includes(term) ||
      (user.email || '').toLowerCase().includes(term) ||
      (user.role || '').toLowerCase().includes(term) ||
      (user.brands || []).some(b => b.name.toLowerCase().includes(term))
    );
  });

  if (loading) return <div className="p-8">Cargando usuarios...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-4">
        <h1
          className="text-3xl text-[#1A1A1A] font-bold"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Gestión de Usuarios ({users.length})
        </h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, rol o marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[300px]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-[#E5E7EB] text-gray-500 text-sm">
              <th className="py-4 px-6 font-medium">Usuario</th>
              <th className="py-4 px-6 font-medium">Rol</th>
              <th className="py-4 px-6 font-medium">Marcas</th>
              <th className="py-4 px-6 font-medium">Fecha de Registro</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-12 text-center text-gray-500">
                  No se encontraron usuarios con estos filtros
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <>
                  <tr
                    key={user.id}
                    className="border-b border-[#E5E7EB] hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3 min-w-[280px]">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name}
                            className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                            <Users size={18} />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[#1A1A1A] leading-5">
                            {user.full_name || 'Sin nombre'}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400 leading-5">
                            {user.email || 'Sin correo registrado'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {user.brands.length > 0 ? (
                          <button
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedUser(expandedUser === user.id ? null : user.id);
                            }}
                          >
                            <Store size={12} />
                            {user.brands.length} {user.brands.length === 1 ? 'marca' : 'marcas'}
                            {expandedUser === user.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Sin marcas</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      <span className="font-medium text-gray-700">{formatDate(user.created_at)}</span>
                    </td>
                  </tr>
                  {/* Expanded brands row */}
                  {expandedUser === user.id && user.brands.length > 0 && (
                    <tr key={`${user.id}-brands`} className="bg-gray-50/50">
                      <td colSpan="4" className="px-6 py-3">
                        <div className="ml-12 space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Marcas de {user.full_name || 'este usuario'}
                          </p>
                          {user.brands.map(brand => (
                            <div
                              key={brand.id}
                              className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-2.5"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                  <Store size={14} className="text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-[#1A1A1A]">{brand.name}</p>
                                  <p className="text-xs text-gray-400">/{brand.slug}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                  {brand.plan?.name || 'Sin plan'}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  brand.is_active
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${brand.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                  {brand.is_active ? 'Activa' : 'Suspendida'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
