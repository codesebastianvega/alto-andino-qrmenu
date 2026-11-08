import { useMemo } from "react";
import { toast } from "../../Toast";
import { useCart } from "../../../context/CartContext";

export function useProductQuickViewLogic({
  product,
  groups,
  selections,
  setSelections,
  specialInstructions,
  image,
  onAdd,
  onClose
}) {
  const { addItem } = useCart();

  const extraPrice = useMemo(() => {
    let total = 0;
    groups.forEach((g) => {
      const sel = selections[g.name] || [];
      const isIncludedGroup = g.included_count !== undefined && g.included_count !== null;
      sel.forEach((selectedId, idx) => {
        const item = g.items.find((i) => i.id === selectedId);
        if (isIncludedGroup) {
          if (idx >= g.included_count) {
            total += (item?.extra_price !== undefined ? item.extra_price : (item?.selling_price || item?.price || 0));
          }
        } else {
          total += item?.selling_price || item?.price || 0;
        }
      });
    });
    return total;
  }, [selections, groups]);

  const id = product?.id;
  const basePrice = typeof product?.price === 'number'
    ? product.price
    : Number(String(product?.price || 0).replace(/[^\d.-]/g, "")) || 0;
  const finalPrice = basePrice + extraPrice;
  const isOutOfStock = product?.stock_status === "out";
  const isScheduleRestricted = product?.is_schedule_available === false;
  const scheduleNotice = product?.schedule_label || "Fuera de horario de servicio";

  const missingRequired = useMemo(() => {
    return groups
      .filter((g) => (selections[g.name] || []).length < g.min)
      .map((g) => g.name);
  }, [groups, selections]);

  const canAdd = Boolean(
    id &&
    Number.isFinite(basePrice) &&
    basePrice > 0 &&
    !isOutOfStock &&
    !isScheduleRestricted &&
    missingRequired.length === 0
  );

  const handleIncrement = (groupName, itemId, e) => {
    if (e) e.stopPropagation();
    const group = groups.find((g) => g.name === groupName);
    if (!group) return;
    const targetItem = group.items?.find((i) => i.id === itemId);
    if (targetItem?.is_out || targetItem?.stock_status === 'out') {
      toast(`${targetItem?.name || 'Esta opción'} se encuentra agotada temporalmente`);
      return;
    }

    setSelections((prev) => {
      const current = prev[groupName] || [];
      if (current.length >= group.max) {
        toast(`Límite de ${group.max} ${group.max === 1 ? 'porción' : 'porciones'} alcanzado`);
        return prev;
      }
      return { ...prev, [groupName]: [...current, itemId] };
    });
  };

  const handleDecrement = (groupName, itemId, e) => {
    if (e) e.stopPropagation();
    setSelections((prev) => {
      const current = prev[groupName] || [];
      const index = current.lastIndexOf(itemId);
      if (index === -1) return prev;
      const next = [...current];
      next.splice(index, 1);
      return { ...prev, [groupName]: next };
    });
  };

  const handleSelection = (groupName, itemId) => {
    const group = groups.find((g) => g.name === groupName);
    if (!group) return;
    const targetItem = group.items?.find((i) => i.id === itemId);
    if (targetItem?.is_out || targetItem?.stock_status === 'out') {
      toast(`${targetItem?.name || 'Esta opción'} se encuentra agotada temporalmente`);
      return;
    }

    if (group.allow_quantity) {
      const current = selections[groupName] || [];
      const itemQty = current.filter((id) => id === itemId).length;
      if (itemQty === 0) {
        handleIncrement(groupName, itemId);
      } else {
        if (current.length < group.max) {
          handleIncrement(groupName, itemId);
        } else {
          toast(`Límite de ${group.max} porciones alcanzado`);
        }
      }
      return;
    }

    setSelections((prev) => {
      const current = prev[groupName] || [];
      const isSelected = current.includes(itemId);

      if (isSelected) {
        // Enforce true radio behavior: cannot deselect if min is 1 and max is 1 and it's the only one selected
        if (group.min === 1 && group.max === 1 && current.length === 1) {
          return prev;
        }
        return { ...prev, [groupName]: current.filter((x) => x !== itemId) };
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
    if (isOutOfStock) {
      toast("Producto agotado");
      return;
    }
    if (!canAdd) {
      toast("Producto no disponible");
      return;
    }
    if (missingRequired.length > 0) {
      const missingLabels = missingRequired.map((n) => n.replace(/-/g, " ")).join(", ");
      toast(`⚠️ Por favor selecciona: ${missingLabels}`);
      const firstMissingIdx = groups.findIndex((g) => missingRequired.includes(g.name));
      if (firstMissingIdx >= 0) {
        const el = document.getElementById(`modifier-group-${firstMissingIdx}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    const selectedModifiers = {};
    groups.forEach((g) => {
      const sel = selections[g.name];
      if (sel && sel.length > 0) {
        if (g.allow_quantity) {
          const counts = {};
          sel.forEach((id) => {
            counts[id] = (counts[id] || 0) + 1;
          });
          const formatted = Object.entries(counts).map(([id, qty]) => {
            const opt = g.items.find((o) => o.id === id);
            const name = opt ? opt.name : id;
            return qty > 1 ? `${name} (x${qty})` : name;
          });
          selectedModifiers[g.name] = formatted;
        } else {
          // Map IDs to Names
          const names = sel.map((id) => {
            const opt = g.items.find((o) => o.id === id);
            return opt ? opt.name : id;
          });
          selectedModifiers[g.name] = g.max === 1 ? names[0] : names;
        }
      }
    });

    // Ensure cart item has resolved image for consistency
    const cartItem = {
      ...product,
      price: finalPrice,
      base_plan_price: basePrice,
      extra_modifiers_price: extraPrice,
      options: selectedModifiers,
      note: specialInstructions?.trim() || undefined,
      image_url: image || product.image_url || product.image,
      resolved_image: image
    };

    addItem(cartItem, 1);
    onAdd?.();
    onClose?.();
  };

  return {
    extraPrice,
    basePrice,
    finalPrice,
    isOutOfStock,
    isScheduleRestricted,
    scheduleNotice,
    missingRequired,
    canAdd,
    handleIncrement,
    handleDecrement,
    handleSelection,
    handleAdd
  };
}
