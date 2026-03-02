/* @refresh reset */
import { useEffect, useRef, useState, useMemo } from "react";
import Portal from "./Portal";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useCart } from "@/context/CartContext";
import { useMenuData } from "@/context/MenuDataContext";
import { formatCOP } from "@/utils/money";
import { toast } from "./Toast";
import { getProductImage } from "@/utils/images";
import AAImage from "@/components/ui/AAImage";
import { Icon } from "@iconify-icon/react";

export default function DIYProductModal({ open: isOpen, product, onClose, onAdd }) {
  useLockBodyScroll(isOpen);

  const { addItem } = useCart();
  const menuData = useMenuData();
  const modifierGroupsData = menuData?.modifiers || {};
  const getModifiers = (groupName) =>
    menuData?.getModifiers
      ? menuData.getModifiers(groupName)
      : (modifierGroupsData[groupName] || []);

  const modalRef = useRef(null);

  // Selections per group: required → string id, optional → array of ids
  const [selections, setSelections] = useState({});
  const [currentStep, setCurrentStep] = useState(0);

  // Reset state when product changes
  const productId = product?.id ?? null;
  useEffect(() => {
    setSelections({});
    setCurrentStep(0);
  }, [productId]);

  // Derived values
  const title = product?.title || product?.name || "";
  const subtitle = product?.subtitle;
  const image = product ? getProductImage(product) : null;
  const assignedGroups = product?.modifierGroups || product?.modifier_groups || [];

  const modifierConfig =
    product?.configOptions?.modifier_config ||
    product?.config_options?.modifier_config ||
    {};

  const groups = useMemo(() => {
    return assignedGroups
      .map((groupName) => {
        const config = modifierConfig[groupName] || 'optional';
        let min = 0; let max = 999;
        if (config === 'required') { min = 1; max = 1; }
        else if (config === 'optional') { min = 0; max = 999; }
        else if (typeof config === 'object') { min = config.min || 0; max = config.max || 999; }
        
        return {
          name: groupName,
          type: config,
          min,
          max,
          isRequired: min > 0,
          items: getModifiers(groupName),
        };
      })
      .filter((g) => g.items.length > 0);
  }, [assignedGroups.join(","), JSON.stringify(modifierConfig), modifierGroupsData]);

  const currentGroup = groups[currentStep];

  const extraPrice = useMemo(() => {
    let total = 0;
    groups.forEach((g) => {
      const sel = selections[g.name] || [];
      sel.forEach((selectedId) => {
        const item = g.items.find((i) => i.id === selectedId);
        total += item?.selling_price || item?.price || 0;
      });
    });
    return total;
  }, [selections, groups]);

  if (!isOpen || !product || groups.length === 0) return null;

  const basePrice = Number(product.price || 0);
  const finalPrice = basePrice + extraPrice;
  const isOutOfStock = product.stock_status === "out";
  const canAdd = !!productId && Number.isFinite(basePrice) && basePrice > 0 && !isOutOfStock;

  // Validation logic
  const isCurrentStepValid = () => {
    if (!currentGroup) return false;
    const selCount = (selections[currentGroup.name] || []).length;
    return selCount >= currentGroup.min;
  };

  const missingRequired = groups
    .filter((g) => (selections[g.name] || []).length < g.min)
    .map((g) => g.name);

  const handleSelection = (groupName, itemId) => {
    const group = groups.find(g => g.name === groupName);
    if (!group) return;

    setSelections((prev) => {
      const current = prev[groupName] || [];
      const isSelected = current.includes(itemId);

      if (isSelected) {
        // Deselect
        return { ...prev, [groupName]: current.filter(x => x !== itemId) };
      } else {
        // Select
        if (group.max === 1) {
          // Replace selection
          return { ...prev, [groupName]: [itemId] };
        } else if (current.length < group.max) {
          // Add selection
          return { ...prev, [groupName]: [...current, itemId] };
        } else {
          // Reached max
          toast(`Máximo ${group.max} opciones permitidas`);
          return prev;
        }
      }
    });

    // Auto-advance if max is reached AND it's a single selection
    if (group.max === 1 && currentStep < groups.length - 1) {
       setTimeout(() => setCurrentStep(s => s + 1), 300);
    }
  };

  const handleNext = () => {
    if (!isCurrentStepValid()) {
      toast(`Por favor selecciona una opción para continuar.`);
      return;
    }
    if (currentStep < groups.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleAdd();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  };

  const handleAdd = () => {
    if (isOutOfStock) { toast("Producto agotado"); return; }
    if (!canAdd) { toast("Producto no disponible"); return; }
    if (missingRequired.length > 0) {
      const missingLabels = missingRequired.map(n => n.replace(/-/g, " ")).join(", ");
      toast(`Faltan selecciones obligatorias: ${missingLabels}`);
      // Auto-navigate to first missing step
      const firstMissingIndex = groups.findIndex(g => missingRequired.includes(g.name));
      if (firstMissingIndex >= 0) setCurrentStep(firstMissingIndex);
      return;
    }
    const selectedModifiers = {};
    groups.forEach((g) => {
      const sel = selections[g.name];
      if (sel && sel.length > 0) {
        const names = sel.map(id => {
          const opt = g.items.find(o => o.id === id);
          return opt ? opt.name : id;
        });
        selectedModifiers[g.name] = g.max === 1 ? names[0] : names;
      }
    });
    addItem({ ...product, price: finalPrice, options: selectedModifiers }, 1);
    onAdd?.();
    onClose?.();
  };

  return (
    <Portal>
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => onClose?.()} />

        {/* Modal Window */}
        <div ref={modalRef} tabIndex={-1} className="pointer-events-auto relative z-[110] w-full max-w-md md:max-w-5xl focus-visible:outline-none">
          <div className="relative bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[85vh] rounded-t-3xl sm:rounded-3xl">
            
            {/* Close Button */}
            <button type="button" onClick={() => onClose?.()} aria-label="Cerrar" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md z-20 transition-all border border-white/20">
              <Icon icon="heroicons:x-mark" className="text-xl" />
            </button>

            {/* Left Column: Hero Cover */}
            <div className="w-full h-1/4 md:h-full md:w-5/12 flex-shrink-0 relative bg-neutral-900 group">
              <AAImage src={image} alt={title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 text-white z-10">
                <span className="inline-block px-3 py-1 mb-3 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-widest uppercase border border-white/30">Build Your Own</span>
                <h2 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight drop-shadow-md">
                  Arma tu<br/>{title}
                </h2>
                {subtitle && <p className="mt-2 text-white/80 text-sm md:text-base drop-shadow">{subtitle}</p>}
                
                <div className="mt-4 inline-block bg-black/40 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10">
                  <p className="text-xs text-white/60 uppercase font-bold tracking-widest mb-1">Precio Actual</p>
                  <p className="text-3xl font-bold text-[#cba258]">{formatCOP(finalPrice)}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Interaction Steps */}
            <div className="flex-1 flex flex-col overflow-hidden w-full md:w-7/12 bg-[#f8f9fa] relative">
              
              {/* Stepper Header */}
              <div className="bg-white border-b border-neutral-100 p-4 md:px-8 shadow-sm relative z-10">
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                  {groups.map((g, idx) => {
                    const selCount = (selections[g.name] || []).length;
                    const isDone = selCount >= g.min;
                    const isMissingRequired = selCount < g.min;
                    const isActive = currentStep === idx;
                    
                    return (
                      <button
                        key={g.name}
                        onClick={() => setCurrentStep(idx)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all ${
                          isActive
                            ? 'border-[#2f4131] bg-[#2f4131] text-white shadow-md'
                            : isDone && !isMissingRequired
                              ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                              : 'border-neutral-200 bg-white text-neutral-400 hover:border-neutral-300'
                        }`}
                      >
                        <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] ${isActive ? 'bg-white/20' : 'bg-black/5'}`}>
                          {idx + 1}
                        </span>
                        <span className="capitalize">{g.name.replace(/-/g, " ")}</span>
                        {isDone && !isMissingRequired && !isActive && <Icon icon="heroicons:check" className="text-sm" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Selection Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-24 md:pb-28">
                {currentGroup && (
                  <div className="animate-[fadeUp_0.3s_ease-out]">
                    <div className="mb-6">
                      <h3 className="text-2xl font-black text-neutral-900 capitalize">
                        {currentGroup.name.replace(/-/g, " ")}
                      </h3>
                      <p className="text-base text-neutral-500 mt-1">
                        {currentGroup.min > 0 && currentGroup.min === currentGroup.max 
                          ? `Selecciona ${currentGroup.min} opción ${currentGroup.min > 1 ? 'obligatorias' : 'obligatoria'}.`
                          : currentGroup.min > 0 
                            ? `Selecciona al menos ${currentGroup.min} opción${currentGroup.min > 1 ? 'es' : ''} (máx. ${currentGroup.max}).`
                            : `Agrega hasta ${currentGroup.max === 999 ? 'las opciones que desees' : currentGroup.max + ' opciones'} (opcional).`
                        }
                      </p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {currentGroup.items.map((item) => {
                        const groupSel = selections[currentGroup.name] || [];
                        const isSelected = groupSel.includes(item.id);
                        
                        const itemPrice = item.selling_price || item.price || 0;

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelection(currentGroup.name, item.id)}
                            className={`relative flex flex-col h-full bg-white rounded-2xl overflow-hidden border-2 text-left transition-all duration-200 active:scale-95 ${
                              isSelected 
                                ? 'border-[#2f4131] shadow-[0_4px_12px_rgba(47,65,49,0.15)] ring-1 ring-[#2f4131]' 
                                : 'border-neutral-100 shadow-sm hover:border-[#2f4131]/30 hover:shadow-md'
                            }`}
                          >
                            {/* Selected Badge */}
                            {isSelected && (
                              <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-[#2f4131] rounded-full flex items-center justify-center text-white shadow-sm">
                                <Icon icon="heroicons:check" className="text-sm font-bold" />
                              </div>
                            )}

                            {/* Item Image area placeholder - Fallback to colored box if no image system for now */}
                            <div className={`h-24 md:h-28 w-full flex items-center justify-center bg-gradient-to-br ${
                                isSelected ? 'from-[#2f4131]/10 to-transparent' : 'from-neutral-50 to-neutral-100'
                              }`}
                            >
                               {/* In the future: AAImage for item.image_url */}
                               <span className="text-4xl opacity-20 filter grayscale blur-[1px]">🍲</span>
                            </div>

                            {/* Item Details */}
                            <div className="p-3 md:p-4 flex flex-col flex-1">
                              <span className={`font-bold text-sm md:text-base leading-tight ${isSelected ? 'text-[#2f4131]' : 'text-neutral-800'}`}>
                                {item.name}
                              </span>
                              {itemPrice > 0 && (
                                <span className={`mt-auto pt-2 text-sm font-extrabold ${isSelected ? 'text-[#cba258]' : 'text-neutral-500'}`}>
                                  +{formatCOP(itemPrice)}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Navigation Bar */}
              <div className="absolute bottom-0 left-0 w-full bg-white border-t border-neutral-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] p-4 md:p-5">
                <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
                  
                  {/* Prev Button */}
                  <button
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <Icon icon="heroicons:chevron-left" className="text-2xl" />
                  </button>

                  {/* Main Action Button */}
                  <button
                    onClick={handleNext}
                    className={`flex-1 flex items-center justify-center h-12 md:h-14 rounded-2xl text-white font-bold text-lg transition-all shadow-lg ${
                      isCurrentStepValid() 
                        ? currentStep === groups.length - 1
                          ? 'bg-[#cba258] hover:bg-[#b88c42] shadow-[0_8px_20px_rgba(203,162,88,0.3)] hover:-translate-y-0.5' 
                          : 'bg-[#2f4131] hover:bg-[#202c21] shadow-[0_8px_20px_rgba(47,65,49,0.3)] hover:-translate-y-0.5'
                        : 'bg-neutral-300 shadow-none cursor-not-allowed text-neutral-500'
                    }`}
                  >
                    {currentStep === groups.length - 1 ? (
                      <span className="flex items-center gap-2">
                        Agregar al Pedido <Icon icon="heroicons:check" className="text-xl" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Siguiente paso <Icon icon="heroicons:chevron-right" className="text-xl" />
                      </span>
                    )}
                  </button>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
