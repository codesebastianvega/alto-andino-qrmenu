import { useState, useEffect } from "react";
import { ShoppingBag, Plus, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MENU_ITEMS = [
  { id: 1, name: "Avocado Toast", price: "$24.000", category: "Brunch", img: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?q=80&w=200&auto=format&fit=crop" },
  { id: 2, name: "Huevos Poché", price: "$18.000", category: "Brunch", img: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=200&auto=format&fit=crop" },
  { id: 3, name: "Latte Frío", price: "$12.000", category: "Bebidas", img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=200&auto=format&fit=crop" },
  { id: 4, name: "Matcha", price: "$14.000", category: "Bebidas", img: "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?q=80&w=200&auto=format&fit=crop" },
  { id: 5, name: "Açaí Bowl", price: "$22.000", category: "Postres", img: "https://images.unsplash.com/photo-1590301157890-4810ed352733?q=80&w=200&auto=format&fit=crop" },
];
const CATEGORIES = ["Todos", "Brunch", "Bebidas", "Postres"];

const NOTIFICATIONS = [
  "Mesa 3 pidió Latte Frío",
  "Mesa 7 pidió Avocado Toast",
  "Mesa 2 pidió Matcha",
  "Mesa 5 pidió Açaí Bowl",
  "Mesa 1 pidió Huevos Poché"
];

export default function InteractivePhone() {
  const [activeCat, setActiveCat] = useState("Todos");
  const [cart, setCart] = useState(0);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomNotif = NOTIFICATIONS[Math.floor(Math.random() * NOTIFICATIONS.length)];
      setNotification(randomNotif);
      setTimeout(() => setNotification(null), 3000);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const filtered = activeCat === "Todos" ? MENU_ITEMS : MENU_ITEMS.filter(i => i.category === activeCat);

  return (
    <div className="relative w-[300px] h-[620px] bg-[#F7F7F5] rounded-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.25)] border-[12px] border-[#1A1A1A] overflow-hidden flex flex-col ring-1 ring-white/20">
      {/* Hardware Buttons */}
      <div className="absolute -left-[14px] top-[120px] w-[3px] h-[26px] bg-[#1A1A1A] rounded-l-md"></div>
      <div className="absolute -left-[14px] top-[160px] w-[3px] h-[45px] bg-[#1A1A1A] rounded-l-md"></div>
      <div className="absolute -left-[14px] top-[215px] w-[3px] h-[45px] bg-[#1A1A1A] rounded-l-md"></div>
      <div className="absolute -right-[14px] top-[180px] w-[3px] h-[65px] bg-[#1A1A1A] rounded-r-md"></div>

      {/* Dynamic Island */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-[#1A1A1A] rounded-full z-[60] flex items-center justify-between px-2">
        <div className="w-2 h-2 rounded-full bg-[#0A0A0A] border border-white/5"></div>
        <div className="w-2 h-2 rounded-full bg-[#0A0A0A] border border-white/5"></div>
      </div>

      {/* Real-time Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-12 left-4 right-4 bg-[#2D6A4F] text-white text-xs py-3 px-4 rounded-2xl shadow-xl z-50 flex items-center gap-3"
          >
            <Bell className="w-4 h-4" />
            <span className="font-medium">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-4 flex justify-between items-center shadow-sm z-10">
        <div>
          <h3 className="font-serif text-xl text-[#1A1A1A]" style={{ fontFamily: "'DM Serif Display', serif" }}>Aluna Café</h3>
          <p className="text-[10px] text-[#2D6A4F] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-pulse"></span>
            Menú en vivo
          </p>
        </div>
        <div className="relative">
          <ShoppingBag className="w-5 h-5 text-[#1A1A1A]" />
          <AnimatePresence>
            {cart > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1.5 -right-1.5 bg-[#2D6A4F] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
              >
                {cart}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-4 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setActiveCat(c)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeCat === c ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-[#1A1A1A]'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {filtered.map(item => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.2 }}
              key={item.id}
              className="bg-white p-2.5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex gap-3 items-center border border-transparent hover:border-[#2D6A4F]/30 transition-colors"
            >
              <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden relative shrink-0">
                <img src={item.img} alt={item.name} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-[#1A1A1A] leading-tight">{item.name}</h4>
                <p className="text-xs text-[#2D6A4F] font-medium mt-0.5">{item.price}</p>
              </div>
              <button
                onClick={() => setCart(c => c + 1)}
                className="w-8 h-8 rounded-full bg-[#F7F7F5] flex items-center justify-center hover:bg-[#2D6A4F] hover:text-white transition-colors text-[#1A1A1A] shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
