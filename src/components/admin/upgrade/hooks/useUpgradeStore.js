import { useState, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { STORE_PRODUCTS, CATEGORIES, openWhatsApp } from '../upgradeStoreData';

export function useUpgradeStore({ currentPlanSlug } = {}) {
  const { activeBrand, activePlan } = useAuth();

  // Estados del Mini E-commerce
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currency, setCurrency] = useState('COP'); // 'COP' | 'USD'
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [cartItems, setCartItems] = useState(new Set()); // IDs de productos agregados al carrito
  const [isCartOpenMobile, setIsCartOpenMobile] = useState(false);

  // Plan activo del restaurante (ej: 'premium' en Boku Bento)
  const effectiveCurrentPlanSlug = useMemo(() => {
    return (currentPlanSlug || activePlan?.slug || activeBrand?.plans?.slug || 'emprendedor').toLowerCase();
  }, [currentPlanSlug, activePlan, activeBrand]);

  // Formateador de precios de la tienda
  const getDisplayPrice = (copVal, usdVal, isAnnual = billingCycle === 'annual') => {
    const discount = isAnnual ? 0.8 : 1.0;
    if (currency === 'USD') {
      const finalVal = Math.round(usdVal * discount);
      return `$${finalVal}`;
    } else {
      const finalVal = Math.round(copVal * discount);
      return `$${finalVal.toLocaleString('es-CO')}`;
    }
  };

  // Precio anual total (12 meses con el 20% de descuento)
  const getAnnualPrice = (copVal, usdVal) => {
    if (currency === 'USD') {
      const annualVal = Math.round(usdVal * 0.8) * 12;
      return `$${annualVal}`;
    } else {
      const annualVal = Math.round(copVal * 0.8) * 12;
      return `$${annualVal.toLocaleString('es-CO')}`;
    }
  };

  // Toggle item en el carrito
  const handleToggleCart = (productId) => {
    const product = STORE_PRODUCTS.find(p => p.id === productId);
    setCartItems(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        // Si el producto es un plan base, reemplazamos cualquier otro plan previo
        if (product?.type === 'plan') {
          STORE_PRODUCTS.filter(p => p.type === 'plan').forEach(p => next.delete(p.id));
        }
        next.add(productId);
      }
      return next;
    });
  };

  // Remover item del carrito
  const handleRemoveFromCart = (productId) => {
    setCartItems(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  // Productos filtrados según la categoría
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return STORE_PRODUCTS;
    return STORE_PRODUCTS.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  // Resumen del Carrito con cálculo exacto mensual vs anual (12 meses)
  const cartSummary = useMemo(() => {
    const isAnnual = billingCycle === 'annual';
    const items = STORE_PRODUCTS.filter(p => cartItems.has(p.id));

    let monthlyRegularSum = 0;      // Suma mensual sin descuento
    let monthlyDiscountedSum = 0;   // Suma mensual con descuento si es anual
    let totalPayable = 0;           // Total a pagar hoy (1 mes si mensual, 12 meses si anual)
    let annualSavings = 0;          // Ahorro total acumulado al año

    items.forEach(item => {
      if (!item.isCustomPricing) {
        const rawMonthly = currency === 'USD' ? item.usdMonthly : item.copMonthly;
        const discMonthly = isAnnual ? Math.round(rawMonthly * 0.8) : rawMonthly;

        monthlyRegularSum += rawMonthly;
        monthlyDiscountedSum += discMonthly;
      }
    });

    if (isAnnual) {
      totalPayable = monthlyDiscountedSum * 12; // ¡Cobro de los 12 meses completos!
      annualSavings = (monthlyRegularSum * 12) - totalPayable;
    } else {
      totalPayable = monthlyDiscountedSum; // 1 mes
      annualSavings = 0;
    }

    const fmtFull = (val) => currency === 'USD' ? `$${val} USD` : `$${val.toLocaleString('es-CO')} COP`;

    return {
      items,
      count: items.length,
      isAnnual,
      monthlyRegularSum,
      monthlyDiscountedSum,
      totalPayable,
      annualSavings,
      formattedMonthly: fmtFull(monthlyDiscountedSum),
      formattedTotalPayable: fmtFull(totalPayable),
      formattedSavings: fmtFull(annualSavings)
    };
  }, [cartItems, billingCycle, currency]);

  // Checkout por WhatsApp con mensaje estructurado de tienda
  const handleCheckoutWhatsApp = () => {
    const brandName = activeBrand?.name || 'Mi Restaurante';
    const isAnnual = billingCycle === 'annual';
    const cycleText = isAnnual ? 'Anual (12 meses con -20% de descuento aplicado)' : 'Mensual (Mes a mes)';

    if (cartSummary.count === 0) {
      openWhatsApp(`¡Hola Aluna! 👋 Mi restaurante es *${brandName}*. Quisiera conocer más sobre las opciones de planes y módulos disponibles.`);
      return;
    }

    const itemsList = cartSummary.items.map(it => {
      if (it.isCustomPricing) return `• *${it.name}* (A cotizar)`;
      const rawMonthly = currency === 'USD' ? it.usdMonthly : it.copMonthly;
      const discMonthly = isAnnual ? Math.round(rawMonthly * 0.8) : rawMonthly;
      const itemAnnual = discMonthly * 12;

      if (isAnnual) {
        const fmtM = currency === 'USD' ? `$${discMonthly} USD/mes` : `$${discMonthly.toLocaleString('es-CO')} COP/mes`;
        const fmtA = currency === 'USD' ? `$${itemAnnual} USD/año` : `$${itemAnnual.toLocaleString('es-CO')} COP/año`;
        return `• *${it.name}* — ${fmtA} (equivale a ${fmtM})`;
      } else {
        const fmtM = currency === 'USD' ? `$${discMonthly} USD/mes` : `$${discMonthly.toLocaleString('es-CO')} COP/mes`;
        return `• *${it.name}* — ${fmtM}`;
      }
    }).join('\n');

    const totalText = isAnnual
      ? `💰 *Total a Pagar Hoy (12 Meses):* ${cartSummary.formattedTotalPayable}\n🎉 *Ahorro Total por Pago Anual:* ${cartSummary.formattedSavings}`
      : `💰 *Total Mensual:* ${cartSummary.formattedTotalPayable}`;

    const message = `¡Hola Aluna Store! 🛍️✨\n\nMi restaurante es *${brandName}* y deseo solicitar los siguientes módulos desde la tienda:\n\n${itemsList}\n\n📋 *Modalidad:* Facturación ${cycleText}\n${totalText}\n\n¿Podrían indicarme los pasos para la activación y métodos de pago disponibles (Transferencia, Nequi, Wompi o Tarjeta)?`;

    openWhatsApp(message);
  };

  return {
    selectedCategory,
    setSelectedCategory,
    currency,
    setCurrency,
    billingCycle,
    setBillingCycle,
    cartItems,
    isCartOpenMobile,
    setIsCartOpenMobile,
    effectiveCurrentPlanSlug,
    activeBrand,
    getDisplayPrice,
    getAnnualPrice,
    handleToggleCart,
    handleRemoveFromCart,
    filteredProducts,
    cartSummary,
    handleCheckoutWhatsApp
  };
}
