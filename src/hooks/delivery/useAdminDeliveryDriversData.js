import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { toast } from '../../components/Toast';
import { normalizeWhatsAppNumber } from '../../utils/formatters';

export const VEHICLES = [
  { id: 'moto', label: 'Motocicleta', icon: 'solar:scooter-bold-duotone', emoji: '🛵' },
  { id: 'bici', label: 'Bicicleta', icon: 'solar:bicycle-bold-duotone', emoji: '🚲' },
  { id: 'carro', label: 'Automóvil', icon: 'solar:car-bold-duotone', emoji: '🚗' },
  { id: 'a_pie', label: 'A pie / Caminando', icon: 'solar:walking-bold-duotone', emoji: '🚶' }
];

export function useAdminDeliveryDriversData() {
  const { activeBrand, profile } = useAuth();
  const { brand: brandFromContext } = useBrand();
  const effectiveBrand = activeBrand || brandFromContext;
  const brandId = effectiveBrand?.id || profile?.brand_id || localStorage.getItem('aa_active_brand_id');

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' | 'deliveries'

  // Modal Crear / Editar Domiciliario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle: 'moto',
    plate: '',
    notes: '',
    is_active: true
  });

  // Pedidos a domicilio de hoy para el monitor
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedDriverForDispatch, setSelectedDriverForDispatch] = useState({});
  const [showCancelledDeliveries, setShowCancelledDeliveries] = useState(false);

  // Cargar Domiciliarios desde brands.config
  const loadDrivers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brands')
        .select('config')
        .eq('id', brandId)
        .single();

      if (error) throw error;

      let list = data?.config?.delivery_drivers || [];
      if (list.length === 0) {
        const local = localStorage.getItem(`aluna_drivers_${brandId}`);
        if (local) {
          try { list = JSON.parse(local); } catch (e) {}
        }
      }

      setDrivers(list);
    } catch (err) {
      console.warn('Error cargando domiciliarios de Supabase, usando respaldo local:', err);
      const local = localStorage.getItem(`aluna_drivers_${brandId}`);
      if (local) {
        try { setDrivers(JSON.parse(local)); } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar pedidos a domicilio activos de hoy
  const loadTodayDeliveryOrders = async () => {
    try {
      setLoadingOrders(true);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, status, created_at, total_amount, payment_status, payment_method,
          customer_name, customer_phone, delivery_address, delivery_notes,
          cancellation_reason, cancelled_by
        `)
        .eq('brand_id', brandId)
        .eq('fulfillment_type', 'delivery')
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveryOrders(data || []);
    } catch (err) {
      console.error('Error cargando pedidos a domicilio:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!brandId) return;
    loadDrivers();
    loadTodayDeliveryOrders();

    const channel = supabase
      .channel(`drivers-deliveries-${brandId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `brand_id=eq.${brandId}`
      }, () => {
        loadTodayDeliveryOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [brandId]);

  // Guardar en Supabase y respaldo local
  const persistDrivers = async (newList) => {
    setDrivers(newList);
    localStorage.setItem(`aluna_drivers_${brandId}`, JSON.stringify(newList));

    try {
      setSaving(true);
      const { data: currentBrand } = await supabase
        .from('brands')
        .select('config')
        .eq('id', brandId)
        .single();

      const updatedConfig = {
        ...(currentBrand?.config || {}),
        delivery_drivers: newList
      };

      const { error } = await supabase
        .from('brands')
        .update({ config: updatedConfig })
        .eq('id', brandId);

      if (error) throw error;
      toast.success('Flota de domiciliarios sincronizada.');
    } catch (err) {
      console.error('Error sincronizando domiciliarios con Supabase:', err);
      toast.error('Guardado en este navegador (error de sincronización en red).');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      phone: '',
      vehicle: 'moto',
      plate: '',
      notes: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name || '',
      phone: driver.phone || '',
      vehicle: driver.vehicle || 'moto',
      plate: driver.plate || '',
      notes: driver.notes || '',
      is_active: driver.is_active ?? true
    });
    setIsModalOpen(true);
  };

  const handleSaveDriver = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Ingresa el nombre del domiciliario.');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Ingresa el número de WhatsApp para poder despacharle pedidos.');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    let updatedList = [];

    if (editingDriver) {
      updatedList = drivers.map(d => d.id === editingDriver.id ? {
        ...d,
        ...formData,
        phone: cleanPhone,
        updated_at: new Date().toISOString()
      } : d);
    } else {
      const newDriver = {
        id: `drv_${Date.now()}`,
        ...formData,
        phone: cleanPhone,
        created_at: new Date().toISOString()
      };
      updatedList = [newDriver, ...drivers];
    }

    await persistDrivers(updatedList);
    setIsModalOpen(false);
  };

  const handleDeleteDriver = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${name} de la lista de domiciliarios?`)) return;
    const filtered = drivers.filter(d => d.id !== id);
    await persistDrivers(filtered);
  };

  const handleToggleActive = async (driver) => {
    const updated = drivers.map(d => d.id === driver.id ? { ...d, is_active: !d.is_active } : d);
    await persistDrivers(updated);
  };

  const handleDispatchOrder = async (order, driver) => {
    if (!driver || !driver.phone) {
      toast.error('Selecciona un domiciliario con número de WhatsApp registrado.');
      return;
    }

    const brandName = effectiveBrand?.name || 'Boku Bento';
    const shortNum = `#${order.id.slice(0, 4).toUpperCase()}`;
    const driverUrl = `${window.location.origin}/domi/${order.id}`;
    const cleanDriverPhone = normalizeWhatsAppNumber(driver.phone);

    const message = `🛵 *NUEVO DOMICILIO ASIGNADO - ${brandName}*\n\nHola ${driver.name}! Tienes una nueva entrega:\n\n📦 *Pedido:* ${shortNum}\n👤 *Cliente:* ${order.customer_name || 'Sin nombre'}\n📞 *Teléfono Cliente:* ${order.customer_phone || 'Sin registrar'}\n📍 *Dirección:* ${order.delivery_address || 'Sin dirección'}\n${order.delivery_notes ? `📝 *Nota:* ${order.delivery_notes}\n` : ''}💰 *Cobro:* ${order.payment_status === 'paid' ? '✅ YA PAGADO (No cobrar dinero)' : `$${Number(order.total_amount || 0).toLocaleString()} (${order.payment_method || 'Efectivo'})`}\n\n📲 *Abre tu App de Entrega con el mapa y llamada aquí:*\n${driverUrl}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(driverUrl);
    }

    if (!['on_table', 'on_the_way', 'delivered'].includes(order.status)) {
      try {
        await supabase.from('orders').update({ status: 'on_the_way' }).eq('id', order.id);
        loadTodayDeliveryOrders();
      } catch (e) {}
    }

    toast.success(`Abriendo WhatsApp de ${driver.name} con la orden ${shortNum}...`);
    window.open(`https://wa.me/${cleanDriverPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleMarkOrderDelivered = async (order) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered', delivered_at: new Date().toISOString() })
        .eq('id', order.id);
      if (error) throw error;
      toast.success(`Pedido #${order.id.slice(0, 4).toUpperCase()} marcado como Entregado ✅`);
      loadTodayDeliveryOrders();
    } catch (err) {
      toast.error('No se pudo actualizar el pedido');
    }
  };

  const handleCancelDeliveryOrder = async (order) => {
    const reason = window.prompt('Escribe el motivo de la cancelación (el cliente lo verá en su pantalla):', 'Plato agotado por ahora');
    if (!reason || !reason.trim()) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_by: 'restaurant',
          cancellation_reason: reason.trim(),
          cancelled_at: new Date().toISOString()
        })
        .eq('id', order.id);
      if (error) throw error;
      toast.success('Pedido cancelado');
      loadTodayDeliveryOrders();

      if (order.customer_phone && window.confirm('¿Deseas enviarle un WhatsApp al cliente con la explicación y el cupón de disculpas DISCULPABOKU (15% OFF)?')) {
        handleSendCustomerApologyWhatsApp({ ...order, cancellation_reason: reason.trim() });
      }
    } catch (err) {
      toast.error('Error al cancelar el pedido');
    }
  };

  const handleSendCustomerApologyWhatsApp = (order) => {
    const cleanPhone = normalizeWhatsAppNumber(order.customer_phone || '');
    if (!cleanPhone) {
      toast.error('El pedido no tiene teléfono válido');
      return;
    }
    const cleanCustomerName = (order.customer_name || 'Cliente').replace(/\s*\[Dir:.*$/i, '').trim();
    const shortNum = `#${order.id.slice(0, 4).toUpperCase()}`;
    const brandSlug = effectiveBrand?.slug || 'boku-bento';
    const recoveryUrl = `${window.location.origin}/${brandSlug}/?src=recuperacion`;
    const msg = `Hola ${cleanCustomerName} 🙏, te escribimos de *${effectiveBrand?.name || 'Boku Bento'}* respecto a tu pedido *${shortNum}*.\n\nLamentablemente tuvimos que cancelarlo por el siguiente motivo: *${order.cancellation_reason || 'Inconveniente operativo en cocina'}*.\n\nTe pedimos mil disculpas por la molestia 😔. Para compensarte, te activamos el cupón *DISCULPABOKU* con un *15% DE DESCUENTO* para que pidas otro plato hoy o en tu próxima orden entrando desde este enlace:\n👉 ${recoveryUrl}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // KPIs
  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(d => d.is_active).length;
  const activeDeliveryOrders = deliveryOrders.filter(o => o.status !== 'cancelled');
  const cancelledDeliveryOrders = deliveryOrders.filter(o => o.status === 'cancelled');
  const inRouteOrders = activeDeliveryOrders.filter(o => o.status === 'on_table' || o.status === 'on_the_way').length;
  const deliveredOrders = activeDeliveryOrders.filter(o => o.status === 'delivered').length;

  return {
    drivers,
    loading,
    saving,
    activeTab,
    setActiveTab,
    isModalOpen,
    setIsModalOpen,
    editingDriver,
    formData,
    setFormData,
    deliveryOrders,
    loadingOrders,
    selectedDriverForDispatch,
    setSelectedDriverForDispatch,
    showCancelledDeliveries,
    setShowCancelledDeliveries,
    totalDrivers,
    activeDrivers,
    activeDeliveryOrders,
    cancelledDeliveryOrders,
    inRouteOrders,
    deliveredOrders,
    loadDrivers,
    loadTodayDeliveryOrders,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleSaveDriver,
    handleDeleteDriver,
    handleToggleActive,
    handleDispatchOrder,
    handleMarkOrderDelivered,
    handleCancelDeliveryOrder,
    handleSendCustomerApologyWhatsApp
  };
}
