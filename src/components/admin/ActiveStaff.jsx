import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ActiveStaff({ orders = [] }) {
  const { activeBrand } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar perfiles de meseros para esta marca
  useEffect(() => {
    async function loadStaff() {
      if (!activeBrand?.id) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('brand_id', activeBrand.id)
          .in('role', ['waiter', 'admin', 'owner', 'kitchen']); // Roles que podrían tomar mesas o trabajar

        if (error) throw error;
        setStaff(data || []);
      } catch (err) {
        console.error('Error cargando personal:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStaff();
  }, [activeBrand?.id]);

  // Cruzar el staff con las órdenes activas para determinar carga de trabajo
  const staffWorkload = useMemo(() => {
    // Solo consideramos órdenes activas
    const activeOrders = orders.filter(
      o => ['new', 'preparing', 'ready', 'waiting_payment'].includes(o.status)
    );

    // Contar órdenes por mesero
    const counts = {};
    activeOrders.forEach(o => {
      if (o.waiter_id) {
        counts[o.waiter_id] = (counts[o.waiter_id] || 0) + 1;
      }
    });

    return staff
      .map(person => {
        const count = counts[person.id] || 0;
        
        // badges de estado (Ligero, Normal, Saturado)
        let loadStatus = 'free';
        if (count > 0) loadStatus = 'light';
        if (count >= 3) loadStatus = 'normal';
        if (count >= 6) loadStatus = 'heavy';

        return {
          ...person,
          activeOrdersCount: count,
          loadStatus,
        };
      })
      // Mostrar meseros y cocineros siempre. Admins/owners también los mostraremos para pruebas.
      .sort((a, b) => b.activeOrdersCount - a.activeOrdersCount); // Ordenar por carga

  }, [staff, orders]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 min-h-[180px] animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-6" />
        <div className="space-y-4">
          <div className="h-10 bg-gray-100 rounded-xl w-full" />
          <div className="h-10 bg-gray-100 rounded-xl w-full" />
        </div>
      </div>
    );
  }

  const STAFF_CONFIG = {
    free:   { color: 'bg-gray-100 text-gray-400',       border: 'border-transparent',     label: 'Sin turno' },
    light:  { color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200',      label: 'Ligero' },
    normal: { color: 'bg-amber-100 text-amber-700',     border: 'border-amber-200',        label: 'A tope' },
    heavy:  { color: 'bg-red-100 text-red-700',         border: 'border-red-200 shadow-sm',label: 'Saturado' },
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-xl bg-[#2f4131]/5 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2f4131]">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Personal Activo</h2>
          <p className="text-[10px] text-gray-400 font-medium tracking-wide">Pedidos activos por rol</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {staffWorkload.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-gray-400 font-medium">No hay personal atendiendo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-2 gap-3 pb-2">
            <AnimatePresence>
              {staffWorkload.map(person => {
                const conf = STAFF_CONFIG[person.loadStatus];
                
                return (
                  <motion.div
                    key={person.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${conf.border} ${person.loadStatus === 'heavy' ? 'bg-red-50/30' : 'bg-gray-50/50'}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {/* Avatar initial */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs uppercase ${conf.color}`}>
                        {person.full_name?.substring(0, 2) || 'UK'}
                      </div>
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-gray-800 truncate">{person.full_name}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${conf.color.split(' ')[1]}`}>
                          {conf.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end pl-2 border-l border-gray-200">
                      <span className={`text-xl leading-none font-black ${person.activeOrdersCount > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                        {person.activeOrdersCount}
                      </span>
                      <span className="text-[9px] text-gray-400 font-medium uppercase tracking-widest mt-1">Mesas</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
