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

export default function ProductQuickView({ open: isOpen, product, onClose, onAdd }) {
  // ── All hooks MUST be called unconditionally, in the same order, every render ──

  useLockBodyScroll(isOpen);

  const { addItem } = useCart();

  const menuData = useMenuData();
  const modifierGroupsData = menuData?.modifiers || {};
  const getModifiers = (groupName) =>
    menuData?.getModifiers
      ? menuData.getModifiers(groupName)
      : (modifierGroupsData[groupName] || []);

  const modalRef = useRef(null);
  const lastFocused = useRef(null);

  // Selections per group: required → string id, optional → array of ids
  const [selections, setSelections] = useState({});

  // Reset selections when product changes
  const productId = product?.id ?? null;
  useEffect(() => {
    setSelections({});
  }, [productId]);

  // Keyboard / focus trap
  useEffect(() => {
    if (!isOpen) return;
    lastFocused.current = document.activeElement;
    const el = modalRef.current;
    el?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab") {
        const focusables = el?.querySelectorAll(
          'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (!focusables?.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lastFocused.current?.focus?.();
    };
  }, [isOpen, onClose]);

  // Derived values — safe with optional chaining when product is null
  const title = product?.title || product?.name || "";
  const subtitle = product?.subtitle;
  const image = product ? getProductImage(product) : null;

  const productAllergens = (product?.tags || []).map(tagName => {
    return (menuData?.allergens || []).find(a => a.name === tagName);
  }).filter(Boolean);

  const assignedGroups = product?.modifierGroups || product?.modifier_groups || [];
  // categorySlug is set by MenuDataContext when mapping products
  const isCafe = product?.categorySlug === 'cafe';

  // Fallback: if a café product has no modifier groups in DB yet,
  // inject 'milk-options' automatically (covers products not yet updated in admin)
  const effectiveGroups = (assignedGroups.length === 0 && isCafe)
    ? ['milk-options']
    : assignedGroups;

  const modifierConfig =
    product?.configOptions?.modifier_config ||
    product?.config_options?.modifier_config ||
    {};

  const groups = useMemo(() => {
    return effectiveGroups
      .map((groupName) => {
        const config = modifierConfig[groupName] || (groupName === 'milk-options' || groupName === 'sandwich-bread' ? 'required' : 'optional');
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveGroups.join(","), JSON.stringify(modifierConfig), modifierGroupsData]);

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

  // ── After all hooks: early exit if nothing to render ──
  if (!isOpen || !product) return null;

  const id = product.id;
  const basePrice = Number(product.price || 0);
  const finalPrice = basePrice + extraPrice;
  const isOutOfStock = product.stock_status === "out";
  const canAdd = !!id && Number.isFinite(basePrice) && basePrice > 0 && !isOutOfStock;

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
        // Enforce true radio behavior: cannot deselect if min is 1 and max is 1 and it's the only one selected
        if (group.min === 1 && group.max === 1 && current.length === 1) {
          return prev;
        }
        return { ...prev, [groupName]: current.filter(x => x !== itemId) };
      } else {
        if (group.max === 1) {
          return { ...prev, [groupName]: [itemId] };
        } else if (current.length < group.max) {
          return { ...prev, [groupName]: [...current, itemId] };
        } else {
          toast(`Máximo ${group.max} opciones permitidas`);
          return prev;
        }
      }
    });
  };

  const handleAdd = () => {
    if (isOutOfStock) { toast("Producto agotado"); return; }
    if (!canAdd) { toast("Producto no disponible"); return; }
    if (missingRequired.length > 0) {
      toast(`Por favor selecciona: ${missingRequired.map((n) => n.replace(/-/g, " ")).join(", ")}`);
      return;
    }
    const selectedModifiers = {};
    groups.forEach((g) => {
      const sel = selections[g.name];
      if (sel && sel.length > 0) {
        // Map IDs to Names
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

  const stagger = (i) => ({
    animation: "fadeUp 0.35s ease-out forwards",
    animationDelay: `${i * 60}ms`,
    opacity: 0,
  });

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => onClose?.()}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          tabIndex={-1}
          className="pointer-events-auto relative z-[110] w-full max-w-md md:max-w-4xl focus-visible:outline-none"
        >
          {/* Mobile bottom-sheet style, Desktop center-card style */}
          <div className="relative bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[80vh] rounded-t-3xl sm:rounded-3xl">
            
            {/* Close button */}
            <button
              type="button"
              onClick={() => onClose?.()}
              aria-label="Cerrar"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md z-20 transition-all border border-white/20"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            {/* Left Column: Image (Desktop) / Top Image (Mobile) */}
            <div className="w-full h-1/3 md:h-full md:w-5/12 lg:w-1/2 flex-shrink-0 relative bg-neutral-100">
              <AAImage
                src={image}
                alt={title || "Producto"}
                className="w-full h-full object-cover"
                style={stagger(0)}
              />
              {/* Desktop subtle gradient overlay */}
              <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/10 pointer-events-none mix-blend-multiply" />
              {/* Mobile subtle gradient overlay */}
              <div className="md:hidden absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Right Column: Content */}
            <div className="flex-1 flex flex-col overflow-hidden w-full md:w-7/12 lg:w-1/2 bg-white relative">
              <div className="flex-1 p-6 md:p-8 xl:p-10 overflow-y-auto pb-32 md:pb-32">
                {/* Title & Subtitle */}
                <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 leading-tight tracking-tight" style={stagger(1)}>
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-3 text-sm md:text-base text-neutral-500 leading-relaxed" style={stagger(2)}>
                    {subtitle}
                  </p>
                )}
                {/* Alérgenos */}
                {productAllergens.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2" style={stagger(2)}>
                    {productAllergens.map((alg) => (
                      <span
                        key={alg.id}
                        className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm"
                        title={alg.name}
                      >
                        <span className="text-sm">{alg.emoji}</span>
                        <span>{alg.name}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Modifier groups */}
                <div className="mt-8 space-y-8">
                  {groups.map((group, gi) => {
                    const groupSel = selections[group.name];
                    const isRequired = group.type === "required";
                    const label = group.name.replace(/-/g, " ");
                    const isMissing = missingRequired.includes(group.name);

                    return (
                      <div key={group.name} style={stagger(3 + gi)} className="bg-white">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
                          <div>
                            <p className="text-base font-bold text-neutral-900 capitalize">
                              {label}
                            </p>
                            <p className="text-[11px] text-neutral-400 mt-0.5">
                              {group.min > 0 && group.min === group.max 
                                ? `Elige ${group.min} opción`
                                : group.min > 0 
                                  ? `Mín. ${group.min} - Máx. ${group.max}`
                                  : group.max === 999 
                                    ? "Elige extras (opcional)"
                                    : `Límite: ${group.max} extras`
                              }
                            </p>
                          </div>
                          {group.min > 0 ? (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                              {group.min === group.max ? "Obligatorio" : "Requerido"}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 bg-neutral-50 px-2 py-1 rounded border border-neutral-100">
                              Opcional
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-2.5">
                          {group.items.map((item) => {
                            const itemPrice = item.selling_price || item.price || 0;
                            const groupSel = selections[group.name] || [];
                            const isSelected = groupSel.includes(item.id);

                            const baseClasses = "flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer w-full text-left";
                            
                            const stateClasses = isSelected
                              ? "border-[#2f4131] bg-[#2f4131]/5 shadow-sm ring-1 ring-[#2f4131]"
                              : isMissing

                              ? "border-amber-300 bg-amber-50 hover:bg-amber-100"
                              : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50";

                            const Icon = () => {
                              if (group.max === 1) {
                                return (
                                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isSelected ? 'border-[#2f4131]' : 'border-neutral-300'}`}>
                                    {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-[#2f4131]" />}
                                  </div>
                                );
                              } else {
                                return (
                                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors ${isSelected ? 'border-[#2f4131] bg-[#2f4131]' : 'border-neutral-300'}`}>
                                    {isSelected && (
                                      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                );
                              }
                            };

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelection(group.name, item.id)}
                                className={`${baseClasses} ${stateClasses}`}
                              >
                                <div className="flex items-center gap-3">
                                  <Icon />
                                  <span className={`text-[13px] font-medium ${isSelected ? 'text-[#2f4131]' : 'text-neutral-700'}`}>
                                    {item.name}
                                  </span>
                                </div>
                                {itemPrice > 0 && (
                                  <span
                                    className={`text-[13px] font-bold ${
                                      isSelected ? "text-[#2f4131]" : "text-neutral-400"
                                    }`}
                                  >
                                    +{formatCOP(itemPrice)}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fixed Footer for Price and Button */}
              <div className="absolute bottom-0 left-0 w-full bg-white border-t border-neutral-100 shadow-[0_-20px_40px_rgba(0,0,0,0.06)] p-5 md:p-6 md:px-8" style={stagger(4 + groups.length)}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Total a pagar</p>
                    <p className="text-3xl font-extrabold text-[#2f4131] leading-none tracking-tight">{formatCOP(finalPrice)}</p>
                  </div>
                  {extraPrice > 0 && (
                    <div className="text-right">
                      <p className="text-xs font-semibold text-neutral-400">Base: {formatCOP(basePrice)}</p>
                      <p className="text-sm font-bold text-[#cba258]">+{formatCOP(extraPrice)} extras</p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!canAdd}
                  className="w-full h-14 rounded-2xl bg-[#2f4131] text-white font-bold text-lg shadow-[0_8px_16px_rgba(47,65,49,0.2)] transition-all hover:bg-[#243326] hover:-translate-y-0.5 hover:shadow-[0_12px_20px_rgba(47,65,49,0.3)] active:scale-[0.98] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none disabled:active:scale-100 disabled:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
                >
                  <span className="relative z-10">
                    {isOutOfStock
                      ? "Agotado"
                      : canAdd
                      ? "Agregar al pedido"
                      : "No disponible"}
                  </span>
                  {canAdd && (
                    <div className="absolute inset-0 h-full w-full block bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Portal>
  );
}
