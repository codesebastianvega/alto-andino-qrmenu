import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SUPPORT_NUMBER = '573222285900';

const SUPPORT_MESSAGE =
  'Hola, soy cliente de Aluna 👋 Necesito ayuda con mi cuenta / plan. ¿Puedes asistirme?';

export default function SupportFAB() {
  const [hovered, setHovered] = useState(false);

  const openWhatsApp = () => {
    const url = `https://wa.me/${SUPPORT_NUMBER}?text=${encodeURIComponent(SUPPORT_MESSAGE)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-[300] flex flex-col items-end gap-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 shadow-xl pointer-events-none"
          >
            <p className="text-white text-[11px] font-bold whitespace-nowrap">Hablar con soporte</p>
            <p className="text-white/40 text-[10px]">Respuesta en minutos</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={openWhatsApp}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center overflow-hidden"
        style={{ background: '#25D366' }}
        title="Soporte vía WhatsApp"
        aria-label="Abrir soporte en WhatsApp"
      >
        {/* Shimmer ring */}
        <span className="absolute inset-0 rounded-full animate-ping opacity-25" style={{ background: '#25D366' }} />
        {/* WhatsApp SVG icon */}
        <svg viewBox="0 0 24 24" fill="white" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.113.549 4.098 1.512 5.826L0 24l6.337-1.493C8.015 23.468 9.967 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-1.888 0-3.652-.507-5.168-1.393l-.371-.22-3.763.887.94-3.665-.243-.381A9.787 9.787 0 0 1 2.182 12c0-5.414 4.404-9.818 9.818-9.818 5.414 0 9.818 4.404 9.818 9.818 0 5.414-4.404 9.818-9.818 9.818z"/>
        </svg>
      </motion.button>
    </div>
  );
}
