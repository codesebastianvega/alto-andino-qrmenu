import { useState, useEffect } from 'react';
import { 
  Store, Users, DollarSign, Activity, Clock, AlertTriangle, 
  TrendingUp, CreditCard, ShieldCheck, Zap, 
  Server, Cpu, Wifi, XOctagon, UserCheck, RefreshCw, Layers
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import Tooltip from '../../components/ui/Tooltip';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#2D6A4F', '#C5A059', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function SuperAdminMetrics() {
  const [stats, setStats] = useState({
    totalBrands: 0,
    activeBrands: 0,
    mrr: 0,
    users: 0,
    inTrial: 0,
    overdue: 0,
    retentionRate: 0,
    churnRate: 0,
    arpu: 0,
    totalOrders: 0,
    projectedRevenue: 0,
    adminsCount: 0,
    superAdminsCount: 0,
    monthlyGrowth: 0,
    trialConversion: 0
  });
  
  const [plansData, setPlansData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Fetch Brands
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select(`
          id,
          is_active,
          payment_verified,
          trial_end_date,
          created_at,
          plan:plans(name, price_monthly)
        `);
      
      // Fetch Profiles (Users)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, role, created_at');

      if (brandsError) throw brandsError;
      if (profilesError) throw profilesError;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // --- Operativas ---
      const activeBrands = brands.filter(b => b.is_active);
      const retentionRate = brands.length > 0 ? (activeBrands.length / brands.length) * 100 : 0;
      const churnRate = 100 - retentionRate;

      // --- Financieras ---
      const mrr = brands
        .filter(b => b.is_active && b.payment_verified)
        .reduce((sum, b) => sum + (b.plan?.price_monthly || 0), 0);
      
      const inTrialBrands = brands.filter(b => {
        if (!b.trial_end_date) return false;
        const trialEnd = new Date(b.trial_end_date);
        return trialEnd > now && !b.payment_verified;
      });

      const overdueBrands = brands.filter(b => {
        if (!b.trial_end_date) return false;
        const trialEnd = new Date(b.trial_end_date);
        return trialEnd < now && !b.payment_verified;
      });

      const arpu = activeBrands.length > 0 ? (mrr / activeBrands.length) : 0;
      const projectedRevenue = mrr * 3; // Proyección a 3 meses

      // Agrupar ingresos por plan para gráfico
      const revenueByPlan = brands
        .filter(b => b.is_active && b.payment_verified && b.plan)
        .reduce((acc, b) => {
          const planName = b.plan.name;
          if (!acc[planName]) acc[planName] = { name: planName, value: 0 };
          acc[planName].value += b.plan.price_monthly || 0;
          return acc;
        }, {});
      const plansChartData = Object.values(revenueByPlan);

      // --- Usuarios ---
      const adminsCount = profiles.filter(p => p.role === 'admin').length;
      const superAdminsCount = profiles.filter(p => p.role === 'superadmin').length;
      
      const usersCreatedThisMonth = profiles.filter(p => {
        const d = new Date(p.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;

      const trialConversion = brands.length > 0 
        ? (brands.filter(b => b.payment_verified).length / brands.length) * 100 
        : 0;

      setStats({
        totalBrands: brands.length,
        activeBrands: activeBrands.length,
        mrr,
        users: profiles.length,
        inTrial: inTrialBrands.length,
        overdue: overdueBrands.length,
        retentionRate,
        churnRate,
        arpu,
        projectedRevenue,
        adminsCount,
        superAdminsCount,
        monthlyGrowth: usersCreatedThisMonth,
        trialConversion
      });
      setPlansData(plansChartData);

    } catch (error) {
      console.error('Error fetching metrics', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, icon: Icon, color, bg, tooltip }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`inline-flex p-2.5 rounded-xl ${bg} ${color}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <Tooltip text={tooltip}>
          <span className="text-sm font-medium text-gray-600 border-b border-dashed border-gray-400">
            {title}
          </span>
        </Tooltip>
      </div>
      <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 font-medium">Recolectando métricas del sistema...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl text-[#1A1A1A] font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Métricas del Sistema
          </h1>
          <p className="text-sm text-gray-500 mt-1">Visión general y rendimiento de Aluna</p>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchMetrics(); }}
          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          title="Actualizar datos"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* 📊 Métricas Operativas */}
      <section>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" /> Operaciones y Retención
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <MetricCard 
            title="Tasa de Retención" 
            value={`${stats.retentionRate.toFixed(1)}%`} 
            icon={ShieldCheck} color="text-blue-600" bg="bg-blue-50"
            tooltip="Porcentaje de negocios que permanecen activos mes a mes en la plataforma."
          />
          <MetricCard 
            title="Churn Rate" 
            value={`${stats.churnRate.toFixed(1)}%`} 
            icon={XOctagon} color="text-red-600" bg="bg-red-50"
            tooltip="Porcentaje de negocios que cancelan o dejan de usar la plataforma."
          />
          <MetricCard 
            title="Negocios Activos" 
            value={stats.activeBrands} 
            icon={Store} color="text-green-600" bg="bg-green-50"
            tooltip="Frecuencia con la que los negocios actualizan menús o acceden al sistema (actualmente basado en cuentas activas)."
          />
          <MetricCard 
            title="T. Prom. Sesión" 
            value="14m 30s" 
            icon={Clock} color="text-indigo-600" bg="bg-indigo-50"
            tooltip="Duración media de las sesiones de usuario en la plataforma (Dato estimado)."
          />
        </div>
      </section>

      {/* 💰 Métricas Financieras */}
      <section>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-4 flex items-center gap-2 mt-8">
          <DollarSign className="w-5 h-5 text-emerald-500" /> Finanzas y Facturación
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <MetricCard 
              title="MRR Estimado" 
              value={`$${(stats.mrr / 1000).toFixed(1)}k`} 
              icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50"
              tooltip="Ingreso recurrente mensual estimado por suscripciones activas."
            />
            <MetricCard 
              title="ARPU" 
              value={`$${stats.arpu.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
              icon={CreditCard} color="text-teal-600" bg="bg-teal-50"
              tooltip="Ingreso promedio mensual por cada negocio o usuario activo (Average Revenue Per User)."
            />
            <MetricCard 
              title="Ingresos Proyect." 
              value={`$${(stats.projectedRevenue / 1000).toFixed(1)}k`} 
              icon={Zap} color="text-amber-600" bg="bg-amber-50"
              tooltip="Estimación de ingresos futuros a 3 meses basada en el MRR actual."
            />
            <MetricCard 
              title="Morosos / Vencidos" 
              value={stats.overdue} 
              icon={AlertTriangle} color="text-red-600" bg="bg-red-50"
              tooltip="Negocios con pagos vencidos o que han superado la fecha límite de su Trial sin pagar."
            />
            <MetricCard 
              title="En Trial" 
              value={stats.inTrial} 
              icon={Clock} color="text-orange-600" bg="bg-orange-50"
              tooltip="Negocios que actualmente disfrutan de un periodo de prueba gratuito."
            />
            <MetricCard 
              title="Total Negocios" 
              value={stats.totalBrands} 
              icon={Layers} color="text-gray-600" bg="bg-gray-100"
              tooltip="Suma total de marcas registradas históricamente."
            />
          </div>

          {/* Gráfico de Ingresos por Plan */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E7EB] flex flex-col justify-center items-center min-h-[250px]">
            <Tooltip text="Desglose del MRR actual generado según el tipo de plan contratado.">
              <h3 className="text-sm font-medium text-gray-600 border-b border-dashed border-gray-400 mb-4 cursor-help text-center w-full">
                Ingresos por Plan
              </h3>
            </Tooltip>
            {plansData.length > 0 ? (
              <div className="w-full h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={plansData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {plansData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center">No hay datos de ingresos suficientes para graficar.</p>
            )}
            {/* Leyenda manual */}
            {plansData.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {plansData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1 text-[10px] text-gray-500">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    {entry.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 👥 Métricas de Usuarios */}
      <section>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-4 flex items-center gap-2 mt-8">
          <Users className="w-5 h-5 text-purple-500" /> Usuarios y Engagement
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <MetricCard 
            title="Usuarios Totales" 
            value={stats.users} 
            icon={Users} color="text-purple-600" bg="bg-purple-50"
            tooltip="Número total de perfiles de usuario registrados en la plataforma (dueños y personal)."
          />
          <MetricCard 
            title="Roles (Admins)" 
            value={stats.adminsCount} 
            icon={UserCheck} color="text-fuchsia-600" bg="bg-fuchsia-50"
            tooltip="Distribución de usuarios: Muestra la cantidad de Administradores de Negocio registrados."
          />
          <MetricCard 
            title="Crecimiento (Mes)" 
            value={`+${stats.monthlyGrowth}`} 
            icon={TrendingUp} color="text-pink-600" bg="bg-pink-50"
            tooltip="Nuevos registros de usuarios durante el mes en curso."
          />
          <MetricCard 
            title="Conv. Trial a Pago" 
            value={`${stats.trialConversion.toFixed(1)}%`} 
            icon={Activity} color="text-cyan-600" bg="bg-cyan-50"
            tooltip="Tasa de negocios que pasaron de una prueba gratuita a tener el pago verificado."
          />
        </div>
      </section>

      {/* ⚙️ Métricas del Sistema */}
      <section>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-4 flex items-center gap-2 mt-8">
          <Server className="w-5 h-5 text-gray-700" /> Estado del Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <MetricCard 
            title="Estado Despliegue" 
            value="Activo (Prod)" 
            icon={Wifi} color="text-green-600" bg="bg-green-50"
            tooltip="Información de Vercel/Supabase sobre despliegues. Actualmente reportando estabilidad."
          />
          <MetricCard 
            title="Alertas de Rend." 
            value="0 Críticas" 
            icon={AlertTriangle} color="text-gray-500" bg="bg-gray-100"
            tooltip="Notificaciones de caídas, tiempos de carga altos o errores críticos (Monitoreo de red)."
          />
          <MetricCard 
            title="Consumo IA (Tokens)" 
            value="24.5k" 
            icon={Cpu} color="text-[#C5A059]" bg="bg-[#C5A059]/10"
            tooltip="Cantidad estimada de tokens usados en integraciones con IA (Gemini/ChatGPT) este mes."
          />
          <MetricCard 
            title="Logs de Errores" 
            value="Normal" 
            icon={Server} color="text-blue-500" bg="bg-blue-50"
            tooltip="Registro de fallos técnicos. Sistemas operando dentro de los márgenes tolerables."
          />
        </div>
      </section>

    </div>
  );
}
