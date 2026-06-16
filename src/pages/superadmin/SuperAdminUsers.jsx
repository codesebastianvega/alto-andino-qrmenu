import { useEffect, useMemo, useState, Fragment } from 'react';
import { CheckCircle, Search, Users, Store, ChevronDown, ChevronUp, Shield, User as UserIcon, Save, Unlink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';

const ROLE_OPTIONS = [
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'owner', label: 'Propietario' },
  { value: 'admin', label: 'Admin' },
  { value: 'encargado', label: 'Encargado' },
  { value: 'waiter', label: 'Mesero' },
  { value: 'customer', label: 'Cliente' }
];

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const brandsById = useMemo(() => {
    return brands.reduce((acc, brand) => {
      acc[brand.id] = brand;
      return acc;
    }, {});
  }, [brands]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at, avatar_url, brand_id, phone')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, slug, owner_id, is_active, plan:plans(name)')
        .order('name');

      if (brandsError) throw brandsError;

      const brandsByOwner = {};
      (brandsData || []).forEach((brand) => {
        if (!brand.owner_id) return;
        if (!brandsByOwner[brand.owner_id]) brandsByOwner[brand.owner_id] = [];
        brandsByOwner[brand.owner_id].push(brand);
      });

      setBrands(brandsData || []);
      setUsers((profiles || []).map((profile) => ({
        ...profile,
        brands: brandsByOwner[profile.id] || [],
      })));
    } catch (error) {
      console.error('Error fetching users', error);
      alert(`Error cargando usuarios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId, patch) => {
    setSavingUserId(userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', userId)
        .select('id, full_name, email, role, created_at, avatar_url, brand_id, phone')
        .single();

      if (error) throw error;

      setUsers((current) => current.map((user) => (
        user.id === userId ? { ...user, ...data } : user
      )));
    } catch (error) {
      console.error('Error updating user', error);
      alert(`No se pudo actualizar el usuario: ${error.message}`);
    } finally {
      setSavingUserId(null);
    }
  };

  const detachUserFromBrand = (user) => {
    if (!user.brand_id) return;
    if (!window.confirm(`¿Quitar a ${user.full_name || user.email || 'este usuario'} del negocio asignado?`)) return;
    updateUser(user.id, { brand_id: null });
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
      case 'admin':
      case 'encargado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
            <UserIcon size={12} />
            {role === 'admin' ? 'Admin' : 'Encargado'}
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
    const assignedBrand = user.brand_id ? brandsById[user.brand_id] : null;
    return (
      (user.full_name || '').toLowerCase().includes(term) ||
      (user.email || '').toLowerCase().includes(term) ||
      (user.role || '').toLowerCase().includes(term) ||
      (assignedBrand?.name || '').toLowerCase().includes(term) ||
      (user.brands || []).some((brand) => brand.name.toLowerCase().includes(term))
    );
  });

  if (loading) return <div className="p-8">Cargando usuarios...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-4">
        <div>
          <h1
            className="text-3xl text-[#1A1A1A] font-bold"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Gestión de Usuarios ({users.length})
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Edita roles y asignación de negocio. El borrado real de cuentas Auth debe hacerse con función segura de servidor.
          </p>
        </div>

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
              <th className="py-4 px-6 font-medium">Negocio asignado</th>
              <th className="py-4 px-6 font-medium">Marcas propias</th>
              <th className="py-4 px-6 font-medium">Registro</th>
              <th className="py-4 px-6 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-500">
                  No se encontraron usuarios con estos filtros
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const assignedBrand = user.brand_id ? brandsById[user.brand_id] : null;
                const isSaving = savingUserId === user.id;

                return (
                  <Fragment key={user.id}>
                    <tr className="border-b border-[#E5E7EB] hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3 min-w-[260px]">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.full_name || user.email || 'Usuario'}
                              className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                              <Users size={18} />
                            </div>
                          )}
                          <div>
                            <input
                              value={user.full_name || ''}
                              onChange={(e) => setUsers((current) => current.map((item) => (
                                item.id === user.id ? { ...item, full_name: e.target.value } : item
                              )))}
                              onBlur={(e) => updateUser(user.id, { full_name: e.target.value || null })}
                              className="w-full text-sm font-semibold text-[#1A1A1A] leading-5 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-emerald-500 focus:outline-none"
                              placeholder="Sin nombre"
                            />
                            <p className="mt-0.5 text-xs text-gray-400 leading-5">
                              {user.email || 'Sin correo registrado'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-2 min-w-[150px]">
                          {getRoleBadge(user.role)}
                          <select
                            value={user.role || ''}
                            disabled={isSaving}
                            onChange={(e) => updateUser(user.id, { role: e.target.value || null })}
                            className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                          >
                            <option value="">Sin rol</option>
                            {ROLE_OPTIONS.map((role) => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="min-w-[220px] space-y-2">
                          <select
                            value={user.brand_id || ''}
                            disabled={isSaving}
                            onChange={(e) => updateUser(user.id, { brand_id: e.target.value || null })}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                          >
                            <option value="">Sin negocio asignado</option>
                            {brands.map((brand) => (
                              <option key={brand.id} value={brand.id}>{brand.name}</option>
                            ))}
                          </select>
                          {assignedBrand && (
                            <Link
                              to={`/superadmin/brands/${assignedBrand.id}`}
                              className="inline-flex text-xs font-medium text-emerald-700 hover:underline"
                            >
                              Ver {assignedBrand.name}
                            </Link>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {user.brands.length > 0 ? (
                            <button
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                              onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
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

                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={isSaving || !user.brand_id}
                            onClick={() => detachUserFromBrand(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                          >
                            <Unlink size={14} />
                            Quitar
                          </button>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => updateUser(user.id, {
                              full_name: user.full_name || null,
                              role: user.role || null,
                              brand_id: user.brand_id || null,
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {isSaving ? <CheckCircle size={14} /> : <Save size={14} />}
                            Guardar
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedUser === user.id && user.brands.length > 0 && (
                      <tr key={`${user.id}-brands`} className="bg-gray-50/50">
                        <td colSpan="6" className="px-6 py-3">
                          <div className="ml-12 space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Marcas donde figura como propietario
                            </p>
                            {user.brands.map((brand) => (
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
                                  <Link
                                    to={`/superadmin/brands/${brand.id}`}
                                    className="text-xs font-semibold text-emerald-700 hover:underline"
                                  >
                                    Abrir
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
