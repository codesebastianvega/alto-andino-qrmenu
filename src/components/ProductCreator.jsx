import React, { useEffect, useMemo, useState } from "react";
import Portal from "./Portal";
import { formatCOP } from "@/utils/money";
import { useCart } from "@/context/CartContext";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useMenuData } from "@/context/MenuDataContext";

/**
 * GenericProductCreator
 * 
 * Uses product.config_options to define steps and logic.
 * Default config structure:
 * {
 *   "creator_type": "step-by-step",
 *   "steps": [
 *     { "id": "base", "label": "Elige tu Base", "group": "bowl-base", "max": 1, "required": true },
 *     ...
 *   ]
 * }
 */

const icoEmojiMap = {
  "arroz": "🍚", "quinoa": "🌾", "lechuga": "🥬", "mix": "🥬",
  "pollo": "🍗", "res": "🥩", "carne": "🥩", "tofu": "🧊", "atun": "🐟", "salm": "🐟",
  "aguacate": "🥑", "mango": "🥭", "pepino": "🥒", "maiz": "🌽", "cebolla": "🧅",
  "tomate": "🍅", "rabano": "🥗", "queso": "🧀", "zanahoria": "🥕", "fresa": "🍓", "banano": "🍌",
  "granola": "🥣", "miel": "🍯", "yogur": "🥛",
  "jamon": "🥓", "huevo": "🥚", "tocino": "🥓"
};

function getEmoji(label) {
  const s = String(label || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [key, emoji] of Object.entries(icoEmojiMap)) {
    if (s.includes(key)) return emoji;
  }
  return "";
}

function Tile({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !active}
      className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition-all duration-200 border-2 ${
        active 
          ? "bg-[#2f4131] text-white border-[#2f4131] shadow-lg scale-[1.02]" 
          : "bg-white text-neutral-800 border-gray-100 hover:border-gray-300 shadow-sm"
      } ${disabled && !active ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

export default function ProductCreator({ product, open, onClose }) {
  const { getModifiers } = useMenuData();
  const cart = useCart();
  useLockBodyScroll(open);

  const config = product?.config_options || {};
  const steps = config.steps || [];
  
  const [selections, setSelections] = useState({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Initialize selections
  useEffect(() => {
    if (open) {
      const initial = {};
      steps.forEach(step => {
        initial[step.id] = step.max === 1 ? null : [];
      });
      setSelections(initial);
      setCurrentStepIndex(0);
    }
  }, [open, steps]);

  const currentStep = steps[currentStepIndex];
  const stepModifiers = useMemo(() => {
    return currentStep ? getModifiers(currentStep.group) : [];
  }, [currentStep, getModifiers]);

  const toggleSelection = (item) => {
    const { id, max } = currentStep;
    const current = selections[id];

    if (max === 1) {
      setSelections(prev => ({ ...prev, [id]: item }));
    } else {
      const isSelected = current.some(i => i.id === item.id);
      if (isSelected) {
        setSelections(prev => ({ ...prev, [id]: current.filter(i => i.id !== item.id) }));
      } else if (current.length < max) {
        setSelections(prev => ({ ...prev, [id]: [...current, item] }));
      }
    }
  };

  const calculateTotal = () => {
    let extraPrice = 0;
    Object.values(selections).forEach(val => {
      if (Array.isArray(val)) {
        val.forEach(item => extraPrice += (item.price || 0));
      } else if (val) {
        extraPrice += (val.price || 0);
      }
    });
    return (product?.price || 0) + extraPrice;
  };

  const isStepComplete = () => {
    if (!currentStep) return true;
    if (!currentStep.required) return true;
    const val = selections[currentStep.id];
    if (currentStep.max === 1) return val !== null;
    return val.length > 0;
  };

  const handleAddToCart = () => {
    const item = {
      ...product,
      quantity: 1,
      price: calculateTotal(),
      custom_selections: selections,
      is_custom: true
    };
    cart.addItem(item);
    onClose();
  };

  if (!open || !product) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md">
        <div className="bg-[#FAF7F2] w-full sm:max-w-xl max-h-[90vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300">
          
          {/* Header */}
          <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100">
            <div>
              <h2 className="text-xl font-black text-[#2f4131] tracking-tight">{product.name}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.description}</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors">✕</button>
          </div>

          {/* Progress Bar */}
          <div className="flex h-1 bg-gray-100">
            {steps.map((_, i) => (
              <div key={i} className={`flex-1 transition-all duration-500 ${i <= currentStepIndex ? 'bg-[#2f4131]' : 'bg-transparent'}`} />
            ))}
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Paso {currentStepIndex + 1} de {steps.length}</span>
              <h3 className="text-lg font-bold text-gray-900">{currentStep?.label}</h3>
              <p className="text-xs text-gray-400">
                {currentStep?.max === 1 ? 'Selecciona una opción' : `Selecciona hasta ${currentStep?.max} opciones`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               {stepModifiers.map(mod => {
                 const isSelected = currentStep?.max === 1 
                   ? selections[currentStep.id]?.id === mod.id
                   : selections[currentStep.id]?.some(i => i.id === mod.id);
                 
                 const disabled = !isSelected && currentStep?.max > 1 && selections[currentStep.id]?.length >= currentStep.max;

                 return (
                   <Tile key={mod.id} active={isSelected} disabled={disabled} onClick={() => toggleSelection(mod)}>
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <span className="text-lg">{getEmoji(mod.name)}</span>
                           <span className="font-bold tracking-tight">{mod.name}</span>
                        </div>
                        {mod.price > 0 && <span className="text-[10px] font-black opacity-60">+{formatCOP(mod.price)}</span>}
                     </div>
                   </Tile>
                 );
               })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-white border-t border-gray-50 flex flex-col gap-4">
            <div className="flex justify-between items-center px-2">
               <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase block tracking-widest leading-none mb-1">Total Personalizado</span>
                  <span className="text-xl font-black text-[#2f4131]">{formatCOP(calculateTotal())}</span>
               </div>
               <div className="flex items-center gap-2">
                  <button 
                    disabled={currentStepIndex === 0}
                    onClick={() => setCurrentStepIndex(p => p - 1)}
                    className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-2xl text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ←
                  </button>
                  {currentStepIndex < steps.length - 1 ? (
                    <button 
                      disabled={!isStepComplete()}
                      onClick={() => setCurrentStepIndex(p => p + 1)}
                      className="px-8 h-12 bg-[#2f4131] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-900/10 disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  ) : (
                    <button 
                      disabled={!isStepComplete()}
                      onClick={handleAddToCart}
                      className="px-8 h-12 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-900/10 disabled:opacity-50"
                    >
                      Añadir al Carrito
                    </button>
                  )}
               </div>
            </div>
          </div>

        </div>
      </div>
    </Portal>
  );
}
