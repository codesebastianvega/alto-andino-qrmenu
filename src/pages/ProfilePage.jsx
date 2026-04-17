import React, { useState, useEffect } from 'react';
import { 
  User,
  Leaf,
  Sparkles,
  ShoppingBag,
  Package,
  Handshake,
  Star,
  Instagram,
  Medal,
  ChevronRight,
  Loader2,
  Clock,
  Heart,
  CalendarDays,
  Settings,
  X,
  History,
  MapPin,
  CreditCard,
  Bell,
  CheckCircle2,
  Info,
  Gift,
  Coffee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMenuData } from '../context/MenuDataContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';

export default function ProfilePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Controlador de los modales (bottom sheets)
  const [activeModal, setActiveModal] = useState(null); 
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPalate, setAiPalate] = useState("");
  
  // =========================================================================
  // 🧑‍💻 HELPER LÓGICO: ESTADOS DE USUARIO Y FIDELIDAD
  // En producción, estos datos vendrían de tu base de datos (ej. Firebase).
  // 
  // LÓGICA DE SEMILLAS (PUNTOS):
  // 1. Tasa de ganancia: 10 semillas por cada $1.000 COP gastados.
  // 2. Niveles (Tiers): 
  //    - 'Brote' (0 - 999 semillas)
  //    - 'Oro' (1000 - 4999 semillas) -> Este es el nivel actual del mock
  //    - 'Andino VIP' (5000+ semillas)
  // =========================================================================
  const [user] = useState({ 
    name: 'Alejandro', 
    memberSince: '2025',
    points: 1250, 
    tier: 'Oro',
    activeOrder: { id: '#1058', status: 'En preparación', time: '14:30', items: 'Poke Andino, Hatsu', total: '$42.000' }
  }); 

  // =========================================================================
  // 🧑‍💻 HELPER LÓGICO: CATÁLOGO DE RECOMPENSAS
  // Arreglo de objetos con el costo en semillas. La UI bloqueará (disabled)
  // automáticamente los botones si user.points < reward.cost
  // =========================================================================
  const rewardsCatalog = [
    { id: 1, name: 'Café Filtrado de Origen', desc: 'Taza de 12oz de nuestra mejor selección.', cost: 500, icon: <Coffee size={24} /> },
    { id: 2, name: 'Postre del Día', desc: 'Tarta de higo o alfajor andino.', cost: 800, icon: <Gift size={24} /> },
    { id: 3, name: 'Bowl o Poke a elección', desc: 'Cualquier plato principal de la carta.', cost: 1500, icon: <Leaf size={24} /> },
    { id: 4, name: 'Taller de Latte Art', desc: 'Pase gratis para nuestra experiencia.', cost: 3000, icon: <Star size={24} /> }
  ];

  // --- DATOS MOCK PARA OTROS MODALES ---
  const mockHistory = [
    { id: '#1042', date: '28 Feb 2026', items: 'Sunrise Bowl, Café Filtrado', total: '$36.000', status: 'Entregado' },
    { id: '#0984', date: '15 Feb 2026', items: 'Tarta de Higo, Cappuccino', total: '$25.000', status: 'Entregado' }
  ];

  const mockFavs = [
    { name: 'Poke Andino', price: '$34.000', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200' },
    { name: 'Ensalada Bosque', price: '$31.000', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=200' }
  ];

  const mockReservas = [
    { type: 'Experiencia', title: 'Cata de Cafés de Origen', date: '8 Mar 2026', time: '10:00 AM', guests: 2, status: 'Confirmada' }
  ];

  const { restaurantSettings } = useMenuData();
  const { activeBrand } = useAuth();
  
  const brandName = restaurantSettings?.business_name || activeBrand?.name || "Aluna";

  useEffect(() => {
    generatePalateProfile();
  }, []);

  const generatePalateProfile = async () => {
    setIsAiLoading(true);
    try {
      const prompt = `Eres la IA de ${brandName}. Genera un "Perfil de Paladar" divertido y elegante de 1 sola línea (máx 15 palabras) para el cliente ${user.name}. Ej: "Tu paladar exige frescura premium y notas intensas."`;
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { prompt, systemInstruction: `Experiencia gastronómica en ${brandName}.` }
      });
      if (error) throw error;
      setAiPalate(data.reply);
    } catch (err) {
      console.error(err);
      setAiPalate("Explorador gastronómico con debilidad por lo saludable.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };

  // --- RENDERIZADORES DE MODALES ---
  const renderModalContent = () => {
    switch(activeModal) {
      case 'semillas':
        return (
          <div className="space-y-6">
            {/* Header del Programa */}
            <div className="bg-gradient-to-br from-[#E6B05C] to-[#d49e4c] rounded-2xl p-6 text-[#1A1A1A] text-center shadow-inner relative overflow-hidden">
              <div className="absolute -left-4 -top-4 text-white/20"><Leaf size={80} strokeWidth={1} /></div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1 relative z-10">Balance Actual</p>
              <h3 className="text-5xl font-extrabold mb-1 relative z-10">{user.points}</h3>
              <p className="text-sm font-medium opacity-80 relative z-10">Semillas acumuladas</p>
            </div>

            {/* Helper Visual para el Usuario */}
            <div className="bg-[#FAFAFA] border border-[#1A1A1A]/10 rounded-2xl p-4 flex gap-3">
              <Info size={20} className="text-[#E6B05C] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-[#1A1A1A] mb-1">¿Cómo funciona?</h4>
                <p className="text-xs font-medium text-black/50 leading-relaxed">
                  Ganas <span className="font-bold text-black/70">10 semillas</span> por cada $1.000 pesos de compra. Úsalas para canjear platos, bebidas y experiencias exclusivas.
                </p>
              </div>
            </div>

            {/* Catálogo de Recompensas */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/40 mb-3">Catálogo de Recompensas</h3>
              <div className="space-y-3">
                {rewardsCatalog.map((reward) => {
                  const canAfford = user.points >= reward.cost;
                  return (
                    <div key={reward.id} className={`bg-white border rounded-2xl p-4 flex gap-4 transition-all ${canAfford ? 'border-black/5 shadow-sm' : 'border-black/5 opacity-60 grayscale-[0.5]'}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${canAfford ? 'bg-[#E6B05C]/20 text-[#E6B05C]' : 'bg-black/5 text-black/30'}`}>
                        {reward.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-[#1A1A1A]">{reward.name}</h4>
                        <p className="text-[10px] text-black/50 font-medium mb-2">{reward.desc}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-extrabold text-[#4A7856] flex items-center gap-1">
                            <Leaf size={10} /> {reward.cost}
                          </span>
                          {canAfford ? (
                            <button className="text-[10px] font-bold bg-[#1A1A1A] text-white px-3 py-1 rounded-full hover:bg-[#E6B05C] transition-colors">
                              CANJEAR
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-black/40 uppercase bg-black/5 px-2 py-1 rounded-full">
                              Faltan {reward.cost - user.points}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case 'pedidos':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/40 mb-3">En Curso</h3>
              <div className="bg-white border border-[#E6B05C]/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#E6B05C]" />
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-bold text-[#1A1A1A]">{user.activeOrder.id}</span>
                    <p className="text-[10px] text-black/50">Hoy, {user.activeOrder.time}</p>
                  </div>
                  <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> {user.activeOrder.status}
                  </div>
                </div>
                <p className="text-sm font-medium mb-3">{user.activeOrder.items}</p>
                <div className="flex justify-between items-center border-t border-black/5 pt-3">
                  <span className="text-xs font-medium text-black/50">Total</span>
                  <span className="font-extrabold">{user.activeOrder.total}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/40 mb-3 flex items-center gap-2">
                <History size={14} /> Historial
              </h3>
              <div className="space-y-3">
                {mockHistory.map((order, idx) => (
                  <div key={idx} className="bg-white border border-black/5 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-[#1A1A1A]">{order.id} • <span className="text-black/50 font-medium">{order.date}</span></span>
                        <p className="text-xs font-medium mt-1 text-black/70">{order.items}</p>
                      </div>
                      <span className="font-extrabold text-sm">{order.total}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-black/5 pt-3">
                      <span className="text-[10px] font-bold text-black/30 uppercase flex items-center gap-1"><CheckCircle2 size={12}/> {order.status}</span>
                      <button className="text-[10px] bg-[#1A1A1A] text-white px-3 py-1.5 rounded-full font-bold uppercase tracking-wider hover:bg-[#E6B05C] transition-colors">
                        Reordenar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'favoritos':
        return (
          <div className="space-y-4">
            {mockFavs.map((dish, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-black/5 shadow-sm">
                <img src={dish.img} alt={dish.name} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-[#1A1A1A] mb-0.5">{dish.name}</h4>
                  <p className="font-extrabold text-[#4A7856] text-sm">{dish.price}</p>
                </div>
                <button className="w-10 h-10 rounded-full bg-[#FAFAFA] border border-black/5 flex items-center justify-center text-[#1A1A1A] hover:bg-[#E6B05C] hover:text-white transition-colors group">
                  <ShoppingBag size={16} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        );
      case 'reservas':
        return (
          <div className="space-y-4">
            {mockReservas.map((res, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-black/5 shadow-sm relative overflow-hidden flex">
                <div className="w-2 bg-[#1A2421]" />
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-[#E6B05C] font-bold mb-1 block">{res.type}</span>
                      <h4 className="font-bold text-[#1A1A1A] leading-tight">{res.title}</h4>
                    </div>
                    <span className="bg-[#FAFAFA] border border-black/5 px-2 py-1 rounded text-[9px] font-bold text-black/50 uppercase">{res.status}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-black/60 border-t border-black/5 pt-3">
                    <div className="flex items-center gap-1.5"><CalendarDays size={14}/> {res.date}</div>
                    <div className="flex items-center gap-1.5"><Clock size={14}/> {res.time}</div>
                    <div className="flex items-center gap-1.5"><User size={14}/> {res.guests}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'ajustes':
        return (
          <div className="bg-white rounded-[1.5rem] border border-black/5 overflow-hidden">
            {[
              { icon: <User size={16} />, title: 'Datos Personales', desc: 'Nombre, email, teléfono' },
              { icon: <CreditCard size={16} />, title: 'Métodos de Pago', desc: 'Tarjetas guardadas' },
              { icon: <MapPin size={16} />, title: 'Direcciones', desc: 'Casa, Oficina' },
              { icon: <Bell size={16} />, title: 'Notificaciones', desc: 'Promos y estado de pedido' }
            ].map((setting, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 hover:bg-black/[0.02] transition-colors cursor-pointer border-b border-black/5 last:border-0 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAFAFA] flex items-center justify-center text-[#1A1A1A] group-hover:bg-[#1A2421] group-hover:text-white transition-colors">
                    {setting.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1A1A1A]">{setting.title}</h4>
                    <p className="text-[10px] text-black/40 font-medium">{setting.desc}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-black/20 group-hover:text-black transition-colors" />
              </div>
            ))}
          </div>
        );
      default: return null;
    }
  };

  const modalTitles = {
    pedidos: 'Mis Pedidos',
    favoritos: 'Platos Favoritos',
    reservas: 'Próximas Reservas',
    ajustes: 'Ajustes de Cuenta',
    semillas: 'Programa de Semillas'
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans selection:bg-[#E6B05C] selection:text-white relative overflow-hidden pb-16">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
          body { font-family: 'Outfit', sans-serif; }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      {/* FONDO */}
      <div className="absolute top-0 left-0 w-full h-[60vh] overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-20 w-[500px] h-[500px] bg-[#E6B05C]/5 rounded-full blur-[100px]" />
        <div className="absolute top-20 -right-20 w-96 h-96 bg-[#4A7856]/5 rounded-full blur-[80px]" />
      </div>

      {/* 🎯 MAIN CONTENT */}
      {/* Note: Header & BottomNavBar are provided by App.jsx, we just need padding top for the header space */}
      <main className="relative z-10 pt-24 pb-20 px-6 lg:px-8 container mx-auto max-w-3xl flex flex-col items-center">
        
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full">
          
          {/* HEADER DEL PERFIL */}
          <motion.div variants={itemVariants} className="flex flex-col items-center mb-10 text-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1A2421] to-[#2c3d38] p-1 shadow-xl">
                <img src="/pwa-192x192.png" alt="Perfil" className="w-full h-full rounded-full object-cover border-4 border-white" />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#E6B05C] text-[#1A1A1A] text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border-2 border-white shadow-sm flex items-center gap-1">
                <Medal size={10} /> {user.tier}
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1A1A1A] mb-1">Hola, {user.name}</h1>
            <p className="text-[#1A1A1A]/40 font-medium text-xs">Miembro de la tribu desde {user.memberSince}</p>
          </motion.div>

          {/* TOP CARDS (IA + PUNTOS) */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            
            <div className="md:col-span-3 bg-[#1A2421] rounded-[1.5rem] p-5 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E6B05C]/20 rounded-full blur-3xl" />
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-[#E6B05C]" />
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">IA Paladar</span>
              </div>
              {isAiLoading ? (
                <div className="flex items-center gap-2 text-white/50 py-2"><Loader2 size={16} className="animate-spin" /><span className="text-sm">Analizando...</span></div>
              ) : (
                <p className="text-white text-sm md:text-base font-medium leading-snug italic">"{aiPalate}"</p>
              )}
            </div>

            {/* TARJETA DE SEMILLAS (AHORA ABRE EL MODAL) */}
            <div 
              onClick={() => setActiveModal('semillas')}
              className="md:col-span-2 bg-gradient-to-br from-[#E6B05C] to-[#d49e4c] rounded-[1.5rem] p-5 text-[#1A1A1A] shadow-sm relative overflow-hidden cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all"
            >
              <div className="absolute -right-6 -bottom-6 text-white/20"><Leaf size={100} strokeWidth={1} /></div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">Mis Semillas</p>
              <h3 className="text-3xl font-extrabold mb-1">{user.points}</h3>
              <p className="text-xs font-medium opacity-80 flex items-center gap-1">Ver recompensas <ChevronRight size={12} /></p>
            </div>

          </motion.div>

          {/* GRID COMPACTO PERSONAL (Sin duplicados) */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-6">
            <div onClick={() => setActiveModal('pedidos')} className="bg-white rounded-[1.2rem] p-4 shadow-sm border border-black/5 hover:border-black/10 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#1A1A1A] group-hover:bg-[#1A2421] group-hover:text-white transition-colors"><Package size={14} /></div>
                <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Activo</div>
              </div>
              <div>
                <h4 className="font-extrabold text-sm mb-0.5">Mis Pedidos</h4>
                <p className="text-[10px] font-medium text-black/50 truncate">Hoy, {user.activeOrder.time} • En proceso</p>
              </div>
            </div>

            <div onClick={() => setActiveModal('favoritos')} className="bg-white rounded-[1.2rem] p-4 shadow-sm border border-black/5 hover:border-black/10 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-32">
              <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#1A1A1A] group-hover:bg-red-500 group-hover:text-white transition-colors"><Heart size={14} /></div>
              <div>
                <h4 className="font-extrabold text-sm mb-0.5">Favoritos</h4>
                <p className="text-[10px] font-medium text-black/50">2 platos guardados</p>
              </div>
            </div>

            <div onClick={() => setActiveModal('reservas')} className="bg-white rounded-[1.2rem] p-4 shadow-sm border border-black/5 hover:border-black/10 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-32">
              <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#1A1A1A] group-hover:bg-[#E6B05C] group-hover:text-white transition-colors"><CalendarDays size={14} /></div>
              <div>
                <h4 className="font-extrabold text-sm mb-0.5">Reservas</h4>
                <p className="text-[10px] font-medium text-black/50">1 evento próximo</p>
              </div>
            </div>

            <div onClick={() => setActiveModal('ajustes')} className="bg-white rounded-[1.2rem] p-4 shadow-sm border border-black/5 hover:border-black/10 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-32">
              <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#1A1A1A] group-hover:bg-[#1A2421] group-hover:text-white transition-colors"><Settings size={14} /></div>
              <div>
                <h4 className="font-extrabold text-sm mb-0.5">Ajustes</h4>
                <p className="text-[10px] font-medium text-black/50">Pagos, direcciones...</p>
              </div>
            </div>
          </motion.div>

          {/* LISTA DE COMUNIDAD (Solo aparece una vez) */}
          <motion.div variants={itemVariants} className="w-full">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/40 mb-3 px-2">Comunidad {brandName}</h3>
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-black/5 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 hover:bg-black/[0.02] transition-colors cursor-pointer group border-b border-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#1A1A1A] group-hover:bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 group-hover:text-white transition-colors"><Instagram size={14} /></div>
                  <span className="font-bold text-sm text-[#1A1A1A]">Síguenos en Instagram</span>
                </div>
                <ChevronRight size={16} className="text-black/20 group-hover:text-black transition-colors" />
              </div>
              <div className="flex items-center justify-between p-4 hover:bg-black/[0.02] transition-colors cursor-pointer group border-b border-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#1A1A1A] group-hover:bg-[#E6B05C] group-hover:text-white transition-colors"><Star size={14} /></div>
                  <span className="font-bold text-sm text-[#1A1A1A]">Déjanos una Reseña</span>
                </div>
                <ChevronRight size={16} className="text-black/20 group-hover:text-black transition-colors" />
              </div>
              <div className="flex items-center justify-between p-4 hover:bg-black/[0.02] transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#1A1A1A] group-hover:bg-[#1A2421] group-hover:text-white transition-colors"><Handshake size={14} /></div>
                  <div className="flex flex-col"><span className="font-bold text-sm text-[#1A1A1A] leading-tight">Trabaja con Nosotros</span><span className="text-[10px] font-medium text-black/40">Portal para aliados B2B</span></div>
                </div>
                <ChevronRight size={16} className="text-black/20 group-hover:text-black transition-colors" />
              </div>
            </div>
          </motion.div>

          {/* BOTÓN CERRAR SESIÓN */}
          <motion.div variants={itemVariants} className="mt-8 text-center pb-10">
             <button className="text-xs font-bold text-black/30 hover:text-red-500 transition-colors border-b border-transparent hover:border-red-500 pb-0.5">Cerrar Sesión</button>
          </motion.div>

        </motion.div>
      </main>

      {/* 🚀 MODALES FLOTANTES (BOTTOM SHEET) */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-[#FAFAFA] w-full sm:max-w-md h-[85vh] sm:h-[650px] rounded-t-[2rem] sm:rounded-[2rem] flex flex-col shadow-2xl relative overflow-hidden"
            >
              <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mt-4 sm:hidden" />
              
              <div className="px-6 py-5 border-b border-black/5 flex justify-between items-center bg-white sticky top-0 z-10">
                <h2 className="text-xl font-extrabold text-[#1A1A1A]">{modalTitles[activeModal]}</h2>
                <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/50 hover:bg-black/10 hover:text-black transition-colors">
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
                {renderModalContent()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
