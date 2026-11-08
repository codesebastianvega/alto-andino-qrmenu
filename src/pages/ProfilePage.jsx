import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  ShoppingBag, 
  CreditCard, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  ArrowLeft, 
  Repeat, 
  Copy, 
  Check, 
  MessageCircle, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../config/supabase';
import { useMenuData } from '../context/MenuDataContext';
import { useCart } from '../context/CartContext';
import { toast } from '../components/Toast';
import { normalizeWhatsAppNumber } from '../utils/formatters';

export default function ProfilePage() {
  const { restaurantSettings, brand } = useMenuData();
  const { addToCart } = useCart();

  const [authUser, setAuthUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(null);

  const brandName = brand?.name || restaurantSettings?.business_name || 'Boku Bento';
  const nequiNumber = restaurantSettings?.nequi_phone || '3244402642';
  const whatsappNumber = normalizeWhatsAppNumber(
    restaurantSettings?.whatsapp_number || 
    restaurantSettings?.phone || 
    '573244402642'
  );

  // 1. Cargar sesión de usuario (Google OAuth / Supabase Auth)
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setAuthUser(session?.user || null);
          const savedPhone = localStorage.getItem('aa_customer_phone') || '';
          const savedAddr = localStorage.getItem('aa_customer_address') || '';
          const savedNotes = localStorage.getItem('aa_customer_delivery_notes') || '';
          setCustomerPhone(savedPhone);
          setPhoneInput(savedPhone);
          setCustomerAddress(savedAddr);
          setCustomerNotes(savedNotes);
        }
      } catch (err) {
        console.error('Error fetching auth session:', err);
      } finally {
        if (isMounted) setLoadingAuth(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setAuthUser(session?.user || null);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // 2. Cargar historial real de pedidos desde Supabase
  const fetchCustomerOrders = async (phoneToQuery) => {
    const cleanPhone = (phoneToQuery || customerPhone || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone && !authUser?.id) return;

    setLoadingOrders(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          created_at,
          status,
          fulfillment_type,
          payment_status,
          payment_method,
          total_amount,
          paid_amount,
          discount_amount,
          discount_reason,
          delivery_fee,
          service_fee,
          customer_name,
          customer_phone,
          delivery_address,
          delivery_notes,
          order_items (
            id,
            product_id,
            quantity,
            unit_price,
            modifiers,
            notes,
            products (
              name,
              image_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (authUser?.id && cleanPhone) {
        query = query.or(`customer_id.eq.${authUser.id},customer_phone.ilike.%${cleanPhone}%`);
      } else if (authUser?.id) {
        query = query.eq('customer_id', authUser.id);
      } else {
        query = query.ilike('customer_phone', `%${cleanPhone}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);

      // Autoguardar la dirección más reciente si no tenía una guardada
      if (data && data.length > 0 && !customerAddress) {
        const latestDelivery = data.find(o => o.delivery_address);
        if (latestDelivery?.delivery_address) {
          setCustomerAddress(latestDelivery.delivery_address);
          setCustomerNotes(latestDelivery.delivery_notes || '');
          localStorage.setItem('aa_customer_address', latestDelivery.delivery_address);
          if (latestDelivery.delivery_notes) {
            localStorage.setItem('aa_customer_delivery_notes', latestDelivery.delivery_notes);
          }
        }
      }
    } catch (err) {
      console.error('Error cargando historial de pedidos:', err);
      toast.error('No se pudo cargar el historial de pedidos');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (customerPhone || authUser?.id) {
      fetchCustomerOrders(customerPhone);
    }
  }, [customerPhone, authUser?.id]);

  // Iniciar sesión con Google OAuth
  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/#perfil`
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error con Google OAuth:', err);
      toast.error('Error al iniciar sesión con Google');
    }
  };

  // Cerrar sesión
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    toast.success('Sesión cerrada');
  };

  // Guardar teléfono vinculado
  const handleSavePhone = (e) => {
    e.preventDefault();
    const clean = phoneInput.replace(/\D/g, '').slice(-10);
    if (clean.length < 10) {
      toast.error('Ingresa un número de celular válido de 10 dígitos');
      return;
    }
    setCustomerPhone(clean);
    localStorage.setItem('aa_customer_phone', clean);
    fetchCustomerOrders(clean);
    toast.success('Celular vinculado exitosamente');
  };

  // Guardar datos de entrega
  const handleSaveDeliveryInfo = (e) => {
    e.preventDefault();
    if (!customerAddress.trim()) {
      toast.error('Ingresa una dirección válida');
      return;
    }
    localStorage.setItem('aa_customer_address', customerAddress.trim());
    localStorage.setItem('aa_customer_delivery_notes', customerNotes.trim());
    setIsEditingAddress(false);
    toast.success('Datos de entrega actualizados');
  };

  // 3. Cálculos de Cartera / ¿Cuánto debo?
  const pendingOrders = useMemo(() => {
    return orders.filter(o => 
      o.status !== 'cancelled' && 
      (o.payment_status === 'pending' || (o.payment_method || '').toLowerCase().includes('fiado')) &&
      (Number(o.total_amount || 0) - Number(o.paid_amount || 0)) > 0
    );
  }, [orders]);

  const totalPendingDebt = useMemo(() => {
    return pendingOrders.reduce((sum, o) => sum + Math.max(0, (Number(o.total_amount || 0) - Number(o.paid_amount || 0))), 0);
  }, [pendingOrders]);

  // Mensaje de WhatsApp para pago de saldo
  const pendingDebtWppMessage = useMemo(() => {
    const ids = pendingOrders.map(o => `#${o.id.slice(0, 4).toUpperCase()}`).join(', ');
    return encodeURIComponent(
      `¡Hola ${brandName}! 👋\nAcabo de realizar la transferencia de mi saldo pendiente por $${totalPendingDebt.toLocaleString('es-CO')} COP correspondiente a mis pedidos (${ids}).\n\nAdjunto aquí el comprobante de pago.`
    );
  }, [brandName, pendingOrders, totalPendingDebt]);

  // Repetir pedido
  const handleRepeatOrder = (order) => {
    const items = order.order_items || [];
    if (items.length === 0) {
      toast.error('Este pedido no tiene productos disponibles');
      return;
    }
    items.forEach(it => {
      addToCart({
        id: it.product_id,
        name: it.products?.name || it.modifiers?._item_name || 'Producto',
        price: Number(it.unit_price) || 0,
        quantity: Number(it.quantity) || 1,
        options: it.modifiers || {},
        note: it.notes || ''
      });
    });
    toast.success(`🛒 ¡${items.length} productos agregados a tu carrito!`);
    window.location.hash = '#menu';
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500">Cargando tu cuenta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-28 pt-4 md:pt-8 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Botón Volver al Menú */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => { window.location.hash = '#menu'; }}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 py-2 px-3.5 rounded-full border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>Volver al Menú</span>
        </button>

        {authUser && (
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 py-2 px-3.5 rounded-full border border-rose-200/70 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Cerrar Sesión</span>
          </button>
        )}
      </div>

      {/* Hero: Bienvenida y Tarjeta de Identidad */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-6 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {/* Avatar */}
          <div className="relative">
            {authUser?.user_metadata?.avatar_url ? (
              <img 
                src={authUser.user_metadata.avatar_url} 
                alt="Avatar" 
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-amber-400/20 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-md">
                <User size={36} />
              </div>
            )}
            {authUser && (
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full ring-2 ring-white" title="Cuenta verificada">
                <CheckCircle2 size={14} />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || (customerPhone ? `Cliente (+57 ${customerPhone})` : 'Tu Cuenta')}
              </h1>
              {authUser && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  Google Verificado
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium mb-3">
              {authUser?.email || 'Inicia sesión para proteger tu información y acceder a tu historial completo.'}
            </p>

            {/* Si no está autenticado con Google: Botón Google OAuth */}
            {!authUser ? (
              <div className="mt-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                  <span>Protege tu privacidad con 1 solo clic</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Inicia sesión con tu cuenta de Google para asegurar que nadie más pueda ver tus pedidos ni tus datos de entrega.
                </p>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-extrabold text-xs rounded-xl shadow-xs active:scale-98 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continuar con Google</span>
                </button>
              </div>
            ) : (
              /* Campo para vincular o actualizar celular */
              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-400" />
                  Celular vinculado:
                </span>
                {customerPhone ? (
                  <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                    +57 {customerPhone}
                  </span>
                ) : (
                  <form onSubmit={handleSavePhone} className="flex items-center gap-2">
                    <input
                      type="tel"
                      placeholder="Ej: 3219111671"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Vincular
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ========================================================
          MÓDULO 1: ESTADO DE CUENTA (¿CUÁNTO DEBO? / FIADOS)
      ======================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <CreditCard size={17} className="text-amber-600" />
            <span>Estado de Cuenta / Cartera</span>
          </h2>
        </div>

        {totalPendingDebt > 0 ? (
          <div className="bg-gradient-to-br from-rose-50 via-white to-orange-50 border-2 border-rose-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full border border-rose-200">
                  Saldo Pendiente por Pagar
                </span>
                <div className="text-3xl sm:text-4xl font-black text-rose-700 tracking-tight mt-2">
                  ${totalPendingDebt.toLocaleString('es-CO')} <span className="text-base text-rose-500 font-bold">COP</span>
                </div>
                <p className="text-xs text-rose-900/80 font-medium mt-1">
                  Tienes {pendingOrders.length} {pendingOrders.length === 1 ? 'pedido pendiente' : 'pedidos pendientes'} de pago.
                </p>
              </div>

              {/* Botón WhatsApp de reporte de pago */}
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${pendingDebtWppMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
                >
                  <MessageCircle size={16} />
                  <span>Reportar Pago por WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Datos para transferir por Nequi */}
            <div className="pt-3 border-t border-rose-100 bg-white/70 p-4 rounded-2xl border border-rose-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm shrink-0">
                  N
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">Transfiere a Nequi:</p>
                  <p className="text-sm font-black text-purple-900 tracking-wide">{nequiNumber}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(nequiNumber);
                  setCopiedAccount('nequi');
                  setTimeout(() => setCopiedAccount(null), 2000);
                }}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-800 font-bold text-xs border border-purple-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedAccount === 'nequi' ? (
                  <>
                    <Check size={14} className="text-purple-700" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar Número Nequi</span>
                  </>
                )}
              </button>
            </div>

            {/* Desglose de órdenes pendientes */}
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Detalle de pedidos con saldo:
              </p>
              {pendingOrders.map(o => (
                <div key={o.id} className="p-3 bg-white rounded-xl border border-rose-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-slate-800 block">
                      Pedido #{o.id.slice(0, 4).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(o.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="font-black text-rose-700 text-sm">
                    ${Math.max(0, (Number(o.total_amount || 0) - Number(o.paid_amount || 0))).toLocaleString('es-CO')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-5 flex items-center gap-3.5 shadow-2xs">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 className="text-sm font-black text-emerald-950">¡Estás completamente al día!</h3>
              <p className="text-xs text-emerald-800 font-medium">
                No tienes deudas ni pedidos pendientes de pago en este momento. ✨
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ========================================================
          MÓDULO 2: MIS DATOS DE ENTREGA
      ======================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <MapPin size={17} className="text-amber-600" />
            <span>Mis Datos de Entrega Predeterminados</span>
          </h2>
          <button
            type="button"
            onClick={() => setIsEditingAddress(prev => !prev)}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer"
          >
            {isEditingAddress ? 'Cancelar' : (customerAddress ? 'Editar' : '+ Registrar Dirección')}
          </button>
        </div>

        {isEditingAddress ? (
          <form onSubmit={handleSaveDeliveryInfo} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Dirección de Entrega</label>
              <input
                type="text"
                placeholder="Ej: Calle 3a # 17-43"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Notas o Referencia (piso, apto, timbre)</label>
              <input
                type="text"
                placeholder="Ej: Casa segundo piso, timbre blanco"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Guardar Datos de Entrega
            </button>
          </form>
        ) : (
          <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 text-xs">
            <MapPin size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-slate-900">
                {customerAddress || 'No has guardado una dirección aún'}
              </p>
              {customerNotes && (
                <p className="text-slate-500 mt-0.5">Nota: {customerNotes}</p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* ========================================================
          MÓDULO 3: HISTORIAL REAL DE PEDIDOS
      ======================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag size={17} className="text-amber-600" />
            <span>Historial de Pedidos Realizados ({orders.length})</span>
          </h2>
        </div>

        {loadingOrders ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Cargando tus pedidos anteriores...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-3 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <ShoppingBag size={26} />
            </div>
            <h3 className="text-sm font-black text-slate-800">Aún no registras pedidos</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Tus pedidos aparecerán aquí automáticamente en tiempo real cada vez que ordenes.
            </p>
            <button
              type="button"
              onClick={() => { window.location.hash = '#menu'; }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span>Explorar la Carta</span>
              <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {orders.map((order) => {
              const shortId = `#${order.id.slice(0, 4).toUpperCase()}`;
              const isPaid = order.payment_status === 'paid';
              const dateStr = new Date(order.created_at).toLocaleDateString([], { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              });

              return (
                <div 
                  key={order.id} 
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow space-y-3.5"
                >
                  {/* Fila Header de la Orden */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900">{shortId}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          order.status === 'delivered' ? 'bg-slate-100 text-slate-700' :
                          order.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-800 animate-pulse'
                        }`}>
                          {order.status === 'delivered' ? 'Entregado' :
                           order.status === 'cancelled' ? 'Cancelado' :
                           order.status === 'preparing' ? 'En Cocina' :
                           order.status === 'on_the_way' ? 'En Camino' : 'Nuevo'}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isPaid ? 'Pagado' : 'Pendiente'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">{dateStr}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-base text-slate-900 block">
                        ${Number(order.total_amount || 0).toLocaleString('es-CO')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block">
                        {order.fulfillment_type === 'delivery' ? 'Domicilio' : 'Consumo en restaurante'}
                      </span>
                    </div>
                  </div>

                  {/* Lista de productos de la orden */}
                  <div className="space-y-2">
                    {(order.order_items || []).map((item) => (
                      <div key={item.id} className="flex justify-between items-start gap-3 text-xs">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800">
                            {item.quantity}x {item.products?.name || item.modifiers?._item_name || 'Producto'}
                          </span>
                          {/* Modificadores detallados */}
                          {item.modifiers && Object.entries(item.modifiers).filter(([k]) => !k.startsWith('_')).length > 0 && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {Object.entries(item.modifiers)
                                .filter(([k]) => !k.startsWith('_'))
                                .map(([key, val]) => Array.isArray(val) ? val.join(', ') : val)
                                .join(' • ')}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-slate-700 shrink-0">
                          ${(Number(item.unit_price || 0) * (Number(item.quantity) || 1)).toLocaleString('es-CO')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Fila Footer con Acciones */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => { window.location.href = `#order/${order.id}`; }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink size={13} />
                      <span>Ver Recibo Digital</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRepeatOrder(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
                    >
                      <Repeat size={13} className="text-amber-700" />
                      <span>Repetir Pedido</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
