import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMenuData } from '../../context/MenuDataContext';
import { formatCOP } from '../../utils/money';
import { PRINT_LIMITS_BY_PLAN, PLAN_LABELS } from '../../config/plans';

const ALUNA_ADMIN_WHATSAPP = '573222285900';

export function useAdminMenuPrintData() {
  const { activeBrand, activePlan } = useAuth();
  const {
    categories = [],
    productsByCategory = {},
    restaurantSettings,
    locations = [],
  } = useMenuData();

  // 1. Plan y cupo
  const planSlug = activeBrand?.plan_slug || activePlan?.slug || 'emprendedor';
  const planInfo = PLAN_LABELS[planSlug] || PLAN_LABELS.emprendedor;
  const printTier = PRINT_LIMITS_BY_PLAN[planSlug] || PRINT_LIMITS_BY_PLAN.emprendedor;
  const isUnlimited = printTier.quota === -1;

  const [facesUsedThisMonth] = useState(0);
  const remainingFreeFaces = isUnlimited ? 999 : Math.max(0, printTier.quota - facesUsedThisMonth);
  const canPrintFree = isUnlimited || remainingFreeFaces > 0;

  // 2. Opciones de configuración de la carta
  const [template, setTemplate] = useState('bistro'); // 'visual' | 'bistro'
  const [columns, setColumns] = useState(2); // 1 | 2 columnas
  const [density, setDensity] = useState('compact'); // 'compact' | 'normal' | 'spacious'
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(() =>
    categories.map((c) => c.id)
  );
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showExtrasNote, setShowExtrasNote] = useState(true);
  const [zoom, setZoom] = useState(0.85);

  // 3. Datos de marca
  const brandName = restaurantSettings?.business_name || activeBrand?.name || 'Mi Restaurante';
  const brandLogo = restaurantSettings?.logo_url || activeBrand?.logo_url;
  const primaryColor = restaurantSettings?.primary_color || '#BC0E0E';
  const mainLocation = locations.find((l) => l.is_main) || locations[0];
  const brandAddress = mainLocation?.address || 'Sede Principal';
  const brandPhone =
    restaurantSettings?.whatsapp_number_orders || mainLocation?.phone || activeBrand?.phone || '';
  const brandSlug = activeBrand?.slug || 'menu';
  const menuUrl = `https://aluna-qrmenu.vercel.app/${brandSlug}`;

  // 4. Categorías y platos filtrados
  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) => selectedCategoryIds.includes(c.id))
      .map((c) => ({
        ...c,
        items: productsByCategory[c.slug] || [],
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, selectedCategoryIds, productsByCategory]);

  const allFilteredProducts = useMemo(() => {
    return filteredCategories.flatMap((c) => c.items);
  }, [filteredCategories]);

  // 5. Estimación de páginas A4 necesarias
  const estimatedPages = useMemo(() => {
    const totalItems = allFilteredProducts.length;
    if (totalItems === 0) return 0;
    let itemsPerFace = columns === 2 ? 24 : 14;
    if (!showDescriptions) itemsPerFace = columns === 2 ? 36 : 22;
    if (density === 'compact') itemsPerFace = Math.round(itemsPerFace * 1.25);
    if (density === 'spacious') itemsPerFace = Math.round(itemsPerFace * 0.8);
    return Math.max(1, Math.ceil(totalItems / itemsPerFace));
  }, [allFilteredProducts.length, columns, showDescriptions, density]);

  const toggleCategory = (id) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllCategories = () => {
    setSelectedCategoryIds(categories.map((c) => c.id));
  };

  const deselectAllCategories = () => {
    setSelectedCategoryIds([]);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRequestFaceViaWhatsApp = () => {
    const costText = formatCOP(printTier.pricePerFace);
    const message = `Hola Aluna Administración 👋\n\nQuiero activar una *Cara Imprimible (PDF Alta Resolución)* para mi restaurante *${brandName}*.\n\n• Plan actual: *${planInfo.name}*\n• Tarifa por cara: *${costText}*\n• Restaurante: *${brandName}* (ID: ${
      activeBrand?.id?.slice(0, 8) || 'N/A'
    })\n\n¿Me comparten por favor los datos de transferencia (Nequi / Bancolombia) para proceder con el pago y activar la exportación?`;

    const waUrl = `https://wa.me/${ALUNA_ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return {
    planInfo,
    printTier,
    isUnlimited,
    canPrintFree,
    remainingFreeFaces,
    template,
    setTemplate,
    columns,
    setColumns,
    density,
    setDensity,
    categories,
    selectedCategoryIds,
    toggleCategory,
    selectAllCategories,
    deselectAllCategories,
    showDescriptions,
    setShowDescriptions,
    showQr,
    setShowQr,
    showExtrasNote,
    setShowExtrasNote,
    zoom,
    setZoom,
    brandName,
    brandLogo,
    primaryColor,
    brandAddress,
    brandPhone,
    menuUrl,
    filteredCategories,
    allFilteredProducts,
    estimatedPages,
    productsByCategory,
    handlePrint,
    handleRequestFaceViaWhatsApp,
  };
}
