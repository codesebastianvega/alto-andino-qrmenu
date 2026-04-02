import { useState, useEffect } from 'react';
import { Store, Users, DollarSign, Activity } from 'lucide-react';
import { supabase } from '../../config/supabase';

export default function SuperAdminMetrics() {
  const [stats, setStats] = useState({
    totalBrands: 0,
    activeBrands: 0,
    mrr: 0, // Monthly Recurring Revenue
    users: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select(`
          id,
          is_active,
          plan:plans(price_monthly)
        `);
      
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (brandsError) throw brandsError;

      const activeBrands = brands.filter(b => b.is_active);
      const mrr = activeBrands.reduce((sum, b) => sum + (b.plan?.price_monthly || 0), 0);

      setStats({
        totalBrands: brands.length,
        activeBrands: activeBrands.length,
        mrr,
        users: usersCount || 0
      });
    } catch (error) {
      console.error('Error fetching metrics', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { title: 'Total Negocios', value: stats.totalBrands, icon: Store, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Negocios Activos', value: stats.activeBrands, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'MRR Estimado', value: `$${(stats.mrr / 1000).toFixed(0)}k`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Usuarios Totales', value: stats.users, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  if (loading) return <div className="p-8">Cargando métricas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl text-[#1A1A1A] font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Métricas Globales
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E7EB]">
            <div className={`inline-flex p-3 rounded-xl ${card.bg} ${card.color} mb-4`}>
              <card.icon size={24} />
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{card.title}</h3>
            <p className="text-3xl font-bold text-[#1A1A1A] mt-1">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
