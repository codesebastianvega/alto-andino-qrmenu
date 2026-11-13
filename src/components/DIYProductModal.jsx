/* @refresh reset */
import { useEffect, useRef, useState, useMemo } from "react";
import Portal from "./Portal";
import IngredientPhoto from "./IngredientPhoto";
import { resolveDIYImage } from "@/utils/diyImages";
import { buildDIYGroups, pruneDIYSelections, calculateDIYGroupPrice, getDIYPortions, getDIYSummary, getDIYOrderOptions, removeDIYPortion } from "@/utils/diy";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useCart } from "@/context/CartContext";
import { useMenuData } from "@/context/MenuDataContext";
import { formatCOP } from "@/utils/money";
import { toast } from "./Toast";
import { getProductImage } from "@/utils/images";
import AAImage from "@/components/ui/AAImage";
import { Icon } from "@iconify-icon/react";

const cleanLabel = value => String(value || '').replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D\u20E3]/gu, '').trim();

const getCategoryTheme = (groupName = '') => {
  const s = groupName.toLowerCase();
  if (s.includes('entrada') || s.includes('sopa')) return { bg: 'from-orange-500/10 to-amber-500/5', border: 'hover:border-orange-400', badge: 'bg-orange-100 text-orange-900', icon: '🥣' };
  if (s.includes('base')) return { bg: 'from-amber-500/10 to-orange-500/5', border: 'hover:border-amber-400', badge: 'bg-amber-100 text-amber-900', icon: '🍚' };
  if (s.includes('prote')) return { bg: 'from-rose-500/10 to-red-500/5', border: 'hover:border-rose-400', badge: 'bg-rose-100 text-rose-900', icon: '🍗' };
  if (s.includes('veg') || s.includes('fresc')) return { bg: 'from-emerald-500/10 to-teal-500/5', border: 'hover:border-emerald-400', badge: 'bg-emerald-100 text-emerald-900', icon: '🥗' };
  if (s.includes('salsa') || s.includes('aderez')) return { bg: 'from-amber-500/10 to-yellow-500/5', border: 'hover:border-amber-400', badge: 'bg-amber-100 text-amber-900', icon: '🥢' };
  if (s.includes('crunch') || s.includes('semill')) return { bg: 'from-lime-500/10 to-emerald-500/5', border: 'hover:border-lime-400', badge: 'bg-lime-100 text-lime-900', icon: '🍙' };
  return { bg: 'from-neutral-500/10 to-neutral-500/5', border: 'hover:border-neutral-400', badge: 'bg-neutral-100 text-neutral-800', icon: '🍲' };
};

export default function DIYProductModal({ open: isOpen, product, onClose, onAdd }) {
  useLockBodyScroll(isOpen);

  const { addItem } = useCart();
  const menuData = useMenuData();
  const modifierGroupsData = menuData?.modifiers || {};

  const modalRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Selections per group: groupName -> array of item ids (can contain duplicates for multi-portions)
  const [selections, setSelections] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showLiveTray, setShowLiveTray] = useState(true);
  const [expandLiveTray, setExpandLiveTray] = useState(false);

  // Always reset selections and step when modal opens or product changes
  const productId = product?.id ?? null;
  useEffect(() => {
    if (isOpen) {
      setSelections({});
      setCurrentStep(0);
      setExpandLiveTray(false);
    }
  }, [isOpen, productId]);

  // Derived values
  const title = product?.title || product?.name || "Personaliza tu producto";
  const subtitle = product?.subtitle || product?.description || product?.desc || "";
  const image = product ? getProductImage(product) : null;
  const isScheduleRestricted = product?.is_schedule_available === false && !product?.is_plan_bowl;
  const scheduleNotice = product?.schedule_label || "Fuera de horario de servicio";
  const assignedGroups = product?.modifierGroups || product?.modifier_groups || [];
  const rawModifierGroups = menuData?.rawModifierGroups || [];

  const modifierConfig =
    product?.configOptions?.modifier_config ||
    product?.config_options?.modifier_config ||
    {};

  const groups = useMemo(() => buildDIYGroups({
    assignedGroups, rawGroups: rawModifierGroups, modifiers: modifierGroupsData,
    config: modifierConfig, selections, resolveImage: resolveDIYImage,
  }), [assignedGroups.join(','), rawModifierGroups, modifierGroupsData, JSON.stringify(modifierConfig), selections]);

  useEffect(() => {
    setSelections(previous => pruneDIYSelections(groups, previous));
  }, [groups]);

  // Group into steps: each main group starts a step, followed by its active sub-groups
  const steps = useMemo(() => {
    const res = [];
    groups.forEach(g => {
      if (!g.is_submodifier || res.length === 0) {
        res.push([g]);
      } else {
        res[res.length - 1].push(g);
      }
    });
    return res;
  }, [groups]);

  const effectiveStep = Math.min(currentStep, Math.max(steps.length - 1, 0));
  const currentStepGroups = steps[effectiveStep] || [];
  const nextStepGroup = steps[currentStep + 1]?.[0];

  const extraPrice = useMemo(() => groups.reduce((sum, group) => sum + calculateDIYGroupPrice(group, selections[group.selectionKey]), 0), [groups, selections]);
  const liveSelectedChips = useMemo(() => getDIYSummary(groups, selections), [groups, selections]);
  const totalSelectedCount = liveSelectedChips.length;

  if (!isOpen || !product || groups.length === 0) return null;

  const basePrice = Number(product.price || 0);
  const finalPrice = basePrice + extraPrice;
  const isOutOfStock = product.stock_status === "out";
  const canAdd = !!productId && Number.isFinite(basePrice) && basePrice > 0 && !isOutOfStock;

  // Validation logic
  const isCurrentStepValid = () => {
    if (currentStepGroups.length === 0) return false;
    return currentStepGroups.every(g => {
      const selCount = (selections[g.selectionKey] || []).length;
      return selCount >= g.min;
    });
  };

  const missingRequired = groups
    .filter((g) => (selections[g.selectionKey] || []).length < g.min)
    .map((g) => g.selectionKey);

  // Stepper handlers
  const handleIncrement = (groupName, itemId) => {
    const group = groups.find((g) => g.selectionKey === groupName);
    if (!group || !group.items.some(item => String(item.id) === String(itemId))) return;

    setSelections((prev) => {
      const current = prev[groupName] || [];
      if (current.length >= group.max) {
        toast(`Límite de ${group.max} ${group.max === 1 ? 'porción' : 'porciones'} en ${group.name.replace(/^[^\w]+/, '')}`);
        return prev;
      }
      return { ...prev, [groupName]: [...current, itemId] };
    });
  };

  const handleDecrement = (groupKey, itemId, portionIndex) => {
    setSelections(previous => removeDIYPortion(previous, groupKey, itemId, portionIndex));
  };

  const handleCardClick = (group, item) => {
    const groupSel = selections[group.selectionKey] || [];
    const itemQty = groupSel.filter((id) => id === item.id).length;
    const isMulti = group.allow_quantity;

    if (!isMulti && group.max === 1) {
      // Single selection group (Radio behavior)
      if (itemQty > 0) {
        if (group.min === 0) {
          handleDecrement(group.selectionKey, item.id);
        }
      } else {
        setSelections((prev) => ({ ...prev, [group.selectionKey]: [item.id] }));
      }
      return;
    }

    if (!group.allow_quantity && group.max > 1) {
      if (itemQty > 0) handleDecrement(group.selectionKey, item.id);
      else handleIncrement(group.selectionKey, item.id);
      return;
    }
    // Multi / Quantity group
    if (itemQty === 0) {
      handleIncrement(group.selectionKey, item.id);
    } else {
      // If already selected, clicking the card body will increment if limit not reached
      if (groupSel.length < group.max) {
        handleIncrement(group.selectionKey, item.id);
      } else {
        toast(`Límite de ${group.max} porciones alcanzado en ${group.name.replace(/^[^\w]+/, '')}`);
      }
    }
  };

  const handleClose = () => {
    setSelections({});
    setCurrentStep(0);
    onClose?.();
  };

  const handleNext = () => {
    if (!isCurrentStepValid()) {
      const missing = currentStepGroups.find(g => (selections[g.selectionKey] || []).length < g.min);
      toast(`Por favor selecciona al menos ${missing?.min || 1} opción en ${missing?.name || 'este paso'}`);
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      handleAdd();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleAdd = () => {
    if (isOutOfStock) { toast("Producto agotado"); return; }
    if (!canAdd) { toast("Producto no disponible"); return; }
    if (missingRequired.length > 0) {
      const missingLabels = missingRequired.map(key => cleanLabel(groups.find(group => group.selectionKey === key)?.name)).join(", ");
      toast(`Faltan selecciones obligatorias: ${missingLabels}`);
      const firstMissingIndex = groups.findIndex(g => missingRequired.includes(g.selectionKey));
      if (firstMissingIndex >= 0) setCurrentStep(steps.findIndex(step => step.some(group => group.selectionKey === groups[firstMissingIndex].selectionKey)));
      return;
    }

    const selectedModifiers = getDIYOrderOptions(groups, selections);

    addItem(
      {
        ...product,
        price: finalPrice,
        base_plan_price: basePrice,
        extra_modifiers_price: extraPrice,
        options: selectedModifiers
      },
      1
    );
    toast("Producto personalizado agregado a tu pedido");
    setSelections({});
    setCurrentStep(0);
    onAdd?.();
    onClose?.();
  };

  const currentProgressPercent = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <Portal>
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity" onClick={handleClose} />

        {/* Modal Container */}
        <div ref={modalRef} tabIndex={-1} className="pointer-events-auto relative z-[110] w-full max-w-md md:max-w-5xl focus-visible:outline-none">
          <div className="relative bg-[#fcfcfd] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[94vh] md:h-[88vh] rounded-t-[32px] sm:rounded-[36px] border border-white/20">
            
            {/* Close Button Floating */}
            <button 
              type="button" 
              onClick={handleClose} 
              aria-label="Cerrar" 
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md z-30 transition-all border border-white/20 shadow-lg active:scale-90"
            >
              <Icon icon="heroicons:x-mark" className="text-xl font-bold" />
            </button>

            {/* DESKTOP LEFT COLUMN: Hero Cover */}
            <div className="hidden md:flex w-5/12 flex-shrink-0 relative bg-neutral-950 flex-col justify-between p-8 text-white overflow-hidden">
              {/* Background Glow */}
              <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#cba258]/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#2f4131]/40 rounded-full blur-3xl pointer-events-none" />
              
              {/* Top Hero Header */}
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black tracking-widest uppercase border border-white/20 text-[#e6ca85]">
                  <Icon icon="lucide:sparkles" className="text-sm" /> Personaliza a tu gusto
                </span>
                <h2 className="text-3xl lg:text-4xl font-black leading-tight tracking-tight drop-shadow-md">
                  {title}
                </h2>
                {subtitle && <p className="mt-2 text-white/70 text-xs lg:text-sm leading-relaxed line-clamp-3">{subtitle}</p>}
              </div>

              {/* Floating Hero Image */}
              <div className="relative z-10 my-4 lg:my-6 flex items-center justify-center flex-1">
                <div className="relative w-64 h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96 rounded-full p-2 bg-gradient-to-tr from-[#cba258]/30 via-white/5 to-transparent shadow-2xl">
                  <AAImage 
                    src={image} 
                    alt={title} 
                    className="w-full h-full object-contain filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.7)] hover:scale-105 transition-transform duration-700" 
                  />
                </div>
              </div>

              {/* Price & Summary Footnote */}
              <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/15 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-white/60 uppercase font-bold tracking-widest">Total de tu selección</p>
                    <p className="text-2xl font-black text-[#f1d28d]">{formatCOP(finalPrice)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-white/15 px-2.5 py-1 rounded-full font-bold text-white/90">
                      {totalSelectedCount} {totalSelectedCount === 1 ? 'porción' : 'porciones'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (OR FULL ON MOBILE): Interactive Stepper */}
            <div className="flex-1 flex flex-col overflow-hidden w-full md:w-7/12 bg-[#f8f9fa] relative">
              
              {/* MOBILE COMPACT HEADER */}
              <div className="md:hidden bg-white border-b border-neutral-100 p-4 pt-3.5 pr-16 shadow-sm relative z-20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-900 overflow-hidden shrink-0 border border-neutral-200 shadow-sm">
                    <AAImage src={image} alt={title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#2f4131] bg-[#2f4131]/10 px-2 py-0.5 rounded-full">
                        Paso {currentStep + 1} de {steps.length}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-neutral-900 truncate leading-tight mt-0.5">
                      {title}
                    </h3>
                    <p className="text-xs font-black text-[#cba258]">
                      {formatCOP(finalPrice)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar Line */}
                <div className="w-full bg-neutral-100 h-1 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-[#2f4131] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${currentProgressPercent}%` }}
                  />
                </div>

                {isScheduleRestricted && (
                  <div className="mt-3 p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-start gap-2.5 text-amber-900 text-xs shadow-2xs">
                    <span className="text-base shrink-0 mt-0.5">🕒</span>
                    <div className="leading-tight">
                      <strong className="font-extrabold text-amber-950">Fuera de horario de servicio: </strong>
                      <span className="font-medium text-amber-900/90">{scheduleNotice}. Puedes personalizar tu combinación, pero no está habilitado para pedidos en este momento.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* STEPPER PILLS HEADER */}
              <div className="bg-white border-b border-neutral-200/70 px-4 md:px-8 py-3 shadow-xs relative z-10">
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-0.5">
                  {steps.map((stepArr, idx) => {
                    const isDone = stepArr.every(g => (selections[g.selectionKey] || []).length >= g.min);
                    const isActive = currentStep === idx;
                    const mainGroup = stepArr[0];
                    
                    return (
                      <button
                        key={mainGroup.name}
                        onClick={() => setCurrentStep(idx)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all ${
                          isActive
                            ? 'border-[#2f4131] bg-[#2f4131] text-white shadow-md shadow-[#2f4131]/20 scale-102'
                            : isDone
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                              : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                        }`}
                      >
                        <Icon icon="lucide:utensils" className="text-xs" />
                        <span className="capitalize">{cleanLabel(mainGroup.name).replace(/-/g, " ")}</span>
                        {isDone && !isActive && (
                          <Icon icon="heroicons:check-circle-20-solid" className="text-emerald-600 text-sm ml-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fixed-size summary cards never shrink into vertical text columns. */}
              {liveSelectedChips.length > 0 && (
                <div className="bg-[#f0f4f1] border-b border-[#2f4131]/10 px-4 md:px-8 py-2.5 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#2f4131] flex items-center gap-1">
                      <Icon icon="lucide:check-circle" className="text-xs text-emerald-600" />
                      Tu selección ({totalSelectedCount})
                    </span>
                    <div className="flex items-center gap-3">
                    {showLiveTray && <button type="button" onClick={() => setExpandLiveTray(value => !value)}
                      aria-expanded={expandLiveTray}
                      className="text-[10px] text-[#2f4131] hover:underline font-bold">
                      {expandLiveTray ? 'Vista compacta' : 'Ver detalle'}
                    </button>}
                    <button
                      type="button"
                      onClick={() => setShowLiveTray(v => !v)}
                      className="text-[10px] text-neutral-500 hover:text-neutral-800 font-bold"
                    >
                      {showLiveTray ? 'Ocultar' : 'Ver'}
                    </button>
                    </div>
                  </div>

                  {showLiveTray && (
                    <div className={expandLiveTray ? 'grid gap-2 max-h-40 overflow-y-auto pr-1' : 'flex items-stretch gap-2 overflow-x-auto pb-1'} aria-label="Resumen de tu selección">
                      {liveSelectedChips.map(chip => (
                        <span 
                          key={`${chip.groupName}-${chip.id}-${chip.portionIndex}`}
                          className={`flex-none flex items-center gap-2 px-2.5 rounded-xl bg-white border border-[#2f4131]/15 text-neutral-800 shadow-xs ${expandLiveTray ? 'w-full min-h-[68px] py-2' : 'w-60 h-[68px]'}`}
                        >
                          <span className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-[#faf9f6] grid place-items-center">
                            <IngredientPhoto item={chip} className="w-full h-full object-cover" />
                          </span>
                          <span className="min-w-0 flex-1 text-left leading-snug" title={chip.name}>
                            <span className={`block text-[11px] font-bold ${expandLiveTray ? '' : 'truncate'}`}>{chip.label}</span>
                            <span className={`block text-[10px] text-neutral-500 ${expandLiveTray ? '' : 'line-clamp-2'}`}>{chip.details || 'Porción ' + (chip.portionIndex + 1)}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDecrement(chip.groupName, chip.id, chip.portionIndex)}
                            className="w-6 h-6 shrink-0 rounded-full hover:bg-neutral-100 grid place-items-center text-neutral-400 hover:text-red-500 transition-colors"
                            aria-label={`Quitar ${chip.name}, porción ${chip.portionIndex + 1}`}
                          >
                            <Icon icon="heroicons:x-mark" className="text-xs" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MAIN INTERACTIVE INGREDIENT CARDS AREA */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-32 md:pb-36">
                {currentStepGroups.map((group) => {
                  const selCount = (selections[group.selectionKey] || []).length;
                  const isLimitReached = selCount >= group.max;
                  const theme = getCategoryTheme(group.name);

                  return (
                    <div key={group.selectionKey} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      
                      {/* Step Title & Requirement Pill */}
                      <div className="mb-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Icon icon="lucide:utensils" className="text-xl md:text-2xl" />
                            <h3 className="text-xl md:text-2xl font-black text-neutral-900 capitalize">
                              {cleanLabel(group.name).replace(/-/g, " ")}{group.parentId && <span className="block text-sm font-medium text-neutral-500 mt-1">{cleanLabel(group.parentLabel)} · Porción {group.portionIndex + 1}</span>}
                            </h3>
                            {group.is_submodifier && (
                              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Según tu elección</span>
                            )}
                          </div>

                          {/* Dynamic Selection Counter Badge */}
                          <div className="shrink-0">
                            {group.min > 0 && group.min === group.max ? (
                              <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                                selCount === group.min ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                              }`}>
                                {selCount === group.min ? '✓ Seleccionado' : `Elige ${group.min} (Obligatorio)`}
                              </span>
                            ) : group.max === 999 ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-neutral-100 text-neutral-600">
                                Opcional ({selCount} elegidos)
                              </span>
                            ) : (
                              <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                                isLimitReached 
                                  ? 'bg-amber-100 text-amber-900 font-extrabold' 
                                  : selCount >= group.min 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-neutral-100 text-neutral-600'
                              }`}>
                                {isLimitReached 
                                  ? `Límite alcanzado (${selCount}/${group.max})` 
                                  : `Llevas ${selCount} de ${group.max}`}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs md:text-sm text-neutral-500 mt-1">
                          {group.min > 0 && group.min === group.max 
                            ? `Selecciona 1 opción para continuar.`
                            : group.min > 0 
                              ? `Selecciona al menos ${group.min} y máximo ${group.max} ${group.max === 1 ? 'opción' : 'porciones'}.`
                              : `Elige hasta ${group.max} ${group.max === 1 ? 'opción' : 'porciones'} a tu gusto (opcional).`
                          }
                          {group.included_quantity > 0 && group.max > group.included_quantity && (
                            <span className="ml-1 text-[#b88c42] font-semibold">
                              ({group.included_quantity} {group.included_quantity === 1 ? 'porción incluida' : 'porciones incluidas'}, adicionales con costo extra).
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Ingredient Cards Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        {group.items.length === 0 && <p className="col-span-full text-sm text-amber-800">No hay opciones disponibles para esta selección. Cambia la proteína o consulta con el restaurante.</p>}
                        {group.items.map((item) => {
                          const groupSel = selections[group.selectionKey] || [];
                          const itemQty = groupSel.filter((id) => id === item.id).length;
                          const isSelected = itemQty > 0;
                          const portions = getDIYPortions(group, item, groups, selections);
                          const photos = portions.length ? portions : [item];
                          const itemPrice = item.selling_price || item.price || 0;
                          let itemExtraPrice = item.extra_price !== undefined && item.extra_price !== null 
                            ? Number(item.extra_price) 
                            : itemPrice;
                          const isMulti = group.allow_quantity;

                          return (
                            <div
                              key={item.id}
                              onClick={() => handleCardClick(group, item)}
                              className={`group relative flex flex-col h-full bg-white rounded-2xl overflow-hidden border-2 text-left transition-all duration-200 select-none cursor-pointer ${
                                isSelected 
                                  ? 'border-[#2f4131] bg-[#2f4131]/[0.02] shadow-md ring-2 ring-[#2f4131]/15 scale-[1.01]' 
                                  : 'border-neutral-200/70 shadow-xs hover:border-[#2f4131]/40 hover:shadow-md active:scale-[0.98]'
                              }`}
                            >
                              {/* Quantity Badge on Top Right */}
                              {itemQty > 0 ? (
                                <div className="absolute top-2.5 right-2.5 z-10 min-w-6 h-6 px-1.5 rounded-full bg-[#2f4131] text-white flex items-center justify-center font-black text-xs shadow-md">
                                  {group.parentId ? '✓' : 'x' + itemQty}
                                </div>
                              ) : (
                                <div className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center text-transparent group-hover:border-neutral-400 group-hover:text-neutral-600 transition-colors">
                                  <Icon icon="heroicons:plus-20-solid" className="text-sm font-black" />
                                </div>
                              )}

                              {/* Thumbnail / Visual Area */}
                              <div className={`h-20 sm:h-24 w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br ${
                                isSelected 
                                  ? 'from-[#2f4131]/15 to-transparent' 
                                  : theme.bg
                              }`}>
                                {photos.map((photo, index) => <div key={index} className="h-full min-w-0 flex-1 relative">
                                  <IngredientPhoto key={photo.image_url || item.id} item={photo} className="w-full h-full object-cover bg-[#faf9f6] group-hover:scale-105 transition-transform duration-500" />
                                  {photos.length > 1 && <span className="absolute bottom-1 left-1 bg-black/60 text-white rounded px-1 text-[10px]">{index + 1}</span>}
                                </div>)}

                              </div>

                              {/* Content Details */}
                              <div className={`p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-1.5 ${group.is_submodifier ? 'pr-4' : ''}`}>
                                <div>
                                  <span className={`font-black text-xs sm:text-sm leading-snug ${
                                    isSelected ? 'text-[#2f4131]' : 'text-neutral-800'
                                  }`}>
                                    {cleanLabel(item.name)}
                                  </span>

                                  {/* Price Tag Pill */}
                                  <div className="mt-1 flex flex-wrap items-center gap-1">
                                    {itemPrice > 0 ? (
                                      <span className="inline-block text-[11px] font-black text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                                        +{formatCOP(itemPrice)}
                                      </span>
                                    ) : (
                                      <span className="inline-block text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                                        ✓ Incluido
                                      </span>
                                    )}

                                    {itemPrice === 0 && itemExtraPrice > 0 && (
                                      <span className="text-[9px] font-bold text-neutral-400">
                                        (Extra +{formatCOP(itemExtraPrice)})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Stepper Controls for Multi-Quantity */}
                                {isMulti && itemQty > 0 && (
                                  <div 
                                    className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/90 rounded-xl p-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleDecrement(group.selectionKey, item.id)}
                                      className="w-7 h-7 rounded-lg bg-white hover:bg-neutral-200 text-neutral-800 grid place-items-center font-bold text-sm shadow-xs active:scale-90 transition-all border border-neutral-200"
                                      aria-label="Quitar una porción"
                                    >
                                      <Icon icon="heroicons:minus-20-solid" />
                                    </button>
                                    
                                    <span className="font-black text-xs text-[#2f4131] px-1">
                                      {itemQty} {itemQty === 1 ? 'porción' : 'porciones'}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => handleIncrement(group.selectionKey, item.id)}
                                      disabled={isLimitReached}
                                      className="w-7 h-7 rounded-lg bg-[#2f4131] hover:bg-[#202c21] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed text-white grid place-items-center font-bold text-sm shadow-xs active:scale-90 transition-all"
                                      aria-label="Agregar otra porción"
                                    >
                                      <Icon icon="heroicons:plus-20-solid" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* STICKY BOTTOM ACTION BAR */}
              <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-neutral-200 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] p-3.5 md:p-4 z-30">
                <div className="flex items-center justify-between gap-3 max-w-2xl mx-auto">
                  
                  {/* Total running price display */}
                  <div className="shrink-0 pl-1">
                    <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-black">Total</p>
                    <p className="text-xl md:text-2xl font-black text-[#cba258] leading-tight">
                      {formatCOP(finalPrice)}
                    </p>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {/* Back Button */}
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={currentStep === 0}
                      className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 disabled:opacity-20 disabled:hover:bg-transparent transition-all shrink-0 active:scale-95"
                      aria-label="Paso anterior"
                    >
                      <Icon icon="heroicons:chevron-left-20-solid" className="text-xl font-bold" />
                    </button>

                    {/* Next / Add Button */}
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!isCurrentStepValid() || (currentStep === steps.length - 1 && isScheduleRestricted)}
                      className={`flex-1 sm:max-w-xs flex items-center justify-center gap-2 h-11 md:h-12 px-5 rounded-xl text-white font-extrabold text-sm md:text-base transition-all shadow-md active:scale-97 ${
                        isCurrentStepValid() && !(currentStep === steps.length - 1 && isScheduleRestricted)
                          ? currentStep === steps.length - 1
                            ? 'bg-[#cba258] hover:bg-[#b88c42] shadow-[#cba258]/30 hover:shadow-lg' 
                            : 'bg-[#2f4131] hover:bg-[#202c21] shadow-[#2f4131]/30 hover:shadow-lg'
                          : 'bg-neutral-200 shadow-none cursor-not-allowed text-neutral-400'
                      }`}
                    >
                      {currentStep === steps.length - 1 ? (
                        isScheduleRestricted ? (
                          <span className="truncate">🕒 {scheduleNotice}</span>
                        ) : (
                          <>
                            <span>Agregar al Pedido</span>
                            <Icon icon="heroicons:shopping-bag-20-solid" className="text-lg" />
                          </>
                        )
                      ) : (
                        <>
                          <span className="truncate">
                            {nextStepGroup ? `Siguiente: ${nextStepGroup.name.replace(/-/g, ' ').replace(/^[^\w]+/, '')}` : 'Siguiente Paso'}
                          </span>
                          <Icon icon="heroicons:arrow-right-20-solid" className="text-lg shrink-0" />
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
