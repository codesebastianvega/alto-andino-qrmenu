import { useMemo } from 'react';
import { toast } from '@/components/Toast';
import { useCart } from '@/context/CartContext';
import { getDefaultExtraPrice } from '../utils/diyCategoryTheme';

export function useDIYPricingAndCart({
  product,
  groups = [],
  steps = [],
  currentStep,
  setCurrentStep,
  selections,
  setSelections,
  isScheduleRestricted,
  scheduleNotice,
  scrollContainerRef,
  onAdd,
  onClose
}) {
  const { addItem } = useCart();
  const productId = product?.id ?? null;

  // Multi-portion Pricing Algorithm (SaaS Business Logic)
  const calculateGroupExtraPrice = (group, selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) return 0;

    const includedCount = group.included_quantity ?? (group.isRequired ? group.min : 0);

    const counts = {};
    selectedIds.forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });

    const itemEntries = Object.entries(counts).map(([id, qty]) => {
      const item = group.items.find((i) => String(i.id) === String(id));
      const basePrice = Number(item?.selling_price || item?.price || 0);
      let extraPrice =
        item?.extra_price !== undefined && item?.extra_price !== null
          ? Number(item.extra_price)
          : basePrice;

      if (basePrice === 0 && extraPrice === 0 && (group.allow_quantity || group.max > 1)) {
        extraPrice = getDefaultExtraPrice(group.name, basePrice);
      }

      return { id, item, qty, basePrice, extraPrice };
    });

    itemEntries.sort((a, b) => a.basePrice - b.basePrice);

    let remainingIncluded = includedCount;
    let groupTotal = 0;

    for (const entry of itemEntries) {
      for (let p = 1; p <= entry.qty; p++) {
        if (p === 1 && remainingIncluded > 0) {
          groupTotal += entry.basePrice;
          remainingIncluded--;
        } else {
          groupTotal += entry.extraPrice;
        }
      }
    }

    return groupTotal;
  };

  const extraPrice = useMemo(() => {
    let total = 0;
    groups.forEach((g) => {
      const sel = selections[g.name] || [];
      total += calculateGroupExtraPrice(g, sel);
    });
    return total;
  }, [selections, groups]);

  const basePrice = Number(product?.price || 0);
  const finalPrice = basePrice + extraPrice;
  const isOutOfStock = product?.stock_status === 'out';
  const canAdd = Boolean(productId && Number.isFinite(basePrice) && basePrice > 0 && !isOutOfStock);

  const totalSelectedCount = useMemo(() => {
    return Object.values(selections).reduce((acc, curr) => acc + (curr?.length || 0), 0);
  }, [selections]);

  const liveSelectedChips = useMemo(() => {
    const list = [];
    groups.forEach((g) => {
      const selIds = selections[g.name] || [];
      if (!selIds.length) return;

      const counts = {};
      selIds.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });

      Object.entries(counts).forEach(([id, count]) => {
        const item = g.items.find((i) => i.id === id);
        if (!item) return;
        list.push({
          id: item.id,
          name: item.name,
          count,
          groupName: g.name,
          emoji: item.emoji || '✨',
          price: item.selling_price || item.price || 0,
          extra_price: item.extra_price
        });
      });
    });
    return list;
  }, [selections, groups]);

  const currentStepGroups = steps[currentStep] || [];

  const isCurrentStepValid = () => {
    if (currentStepGroups.length === 0) return false;
    return currentStepGroups.every((g) => {
      const selCount = (selections[g.name] || []).length;
      return selCount >= g.min;
    });
  };

  const missingRequired = groups
    .filter((g) => (selections[g.name] || []).length < g.min)
    .map((g) => g.name);

  const handleIncrement = (groupName, itemId) => {
    const group = groups.find((g) => g.name === groupName);
    if (!group) return;

    setSelections((prev) => {
      const current = prev[groupName] || [];
      if (current.length >= group.max) {
        toast(`Límite de ${group.max} ${group.max === 1 ? 'porción' : 'porciones'} en ${group.name.replace(/^[^\w]+/, '')}`);
        return prev;
      }
      return { ...prev, [groupName]: [...current, itemId] };
    });
  };

  const handleDecrement = (groupName, itemId) => {
    setSelections((prev) => {
      const current = prev[groupName] || [];
      const index = current.indexOf(itemId);
      if (index === -1) return prev;
      const next = [...current];
      next.splice(index, 1);
      return { ...prev, [groupName]: next };
    });
  };

  const handleCardClick = (group, item) => {
    const groupSel = selections[group.name] || [];
    const itemQty = groupSel.filter((id) => id === item.id).length;
    const isMulti = group.allow_quantity || group.max > 1;

    if (!isMulti) {
      if (itemQty > 0) {
        if (group.min === 0) {
          handleDecrement(group.name, item.id);
        }
      } else {
        setSelections((prev) => ({ ...prev, [group.name]: [item.id] }));
      }
      return;
    }

    if (itemQty === 0) {
      handleIncrement(group.name, item.id);
    } else {
      if (groupSel.length < group.max) {
        handleIncrement(group.name, item.id);
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
      const missing = currentStepGroups.find((g) => (selections[g.name] || []).length < g.min);
      toast(`Por favor selecciona al menos ${missing?.min || 1} opción en ${missing?.name || 'este paso'}`);
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
      if (scrollContainerRef?.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      handleAdd();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      if (scrollContainerRef?.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleAdd = () => {
    if (isOutOfStock) {
      toast('Producto agotado');
      return;
    }
    if (!canAdd) {
      toast('Producto no disponible');
      return;
    }
    if (missingRequired.length > 0) {
      const missingLabels = missingRequired.map((n) => n.replace(/-/g, ' ')).join(', ');
      toast(`Faltan selecciones obligatorias: ${missingLabels}`);
      const firstMissingIndex = groups.findIndex((g) => missingRequired.includes(g.name));
      if (firstMissingIndex >= 0) setCurrentStep(firstMissingIndex);
      return;
    }

    const selectedModifiers = {};
    groups.forEach((g) => {
      const sel = selections[g.name];
      if (sel && sel.length > 0) {
        const counts = {};
        sel.forEach((id) => {
          counts[id] = (counts[id] || 0) + 1;
        });

        const formattedNames = Object.entries(counts).map(([id, count]) => {
          const opt = g.items.find((o) => o.id === id);
          const name = opt ? opt.name : id;
          return count > 1 ? `${name} x${count}` : name;
        });

        selectedModifiers[g.name] = g.max === 1 && !g.allow_quantity ? formattedNames[0] : formattedNames;
      }
    });

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
    toast('¡Bowl agregado a tu pedido! 🥣✨');
    setSelections({});
    setCurrentStep(0);
    onAdd?.();
    onClose?.();
  };

  return {
    extraPrice,
    basePrice,
    finalPrice,
    isOutOfStock,
    canAdd,
    totalSelectedCount,
    liveSelectedChips,
    isCurrentStepValid,
    missingRequired,
    handleIncrement,
    handleDecrement,
    handleCardClick,
    handleClose,
    handleNext,
    handlePrev,
    handleAdd
  };
}
