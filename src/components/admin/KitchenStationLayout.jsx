import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../Toast';
import Portal from '../Portal';

const DEFAULT_STATIONS_TEMPLATE = [
  {
    id: 'assembly',
    title: 'Mesa de Ensamble & Báscula',
    subtitle: 'Zona Central (Montaje, Pesaje & Despacho)',
    icon: 'heroicons:squares-plus',
    accentColor: 'indigo',
    badge: 'Estación Crítica',
    temp: 'Ambiente (20-22°C)',
    description: 'Donde se realiza el pesaje exacto en gramera, colocación de bases tibias, toppings frescos y sellado para despacho.',
    items: [
      {
        name: 'Gramera Digital de Precisión',
        location: 'Centro del Mesón',
        purpose: 'Pesaje gramo a gramo. Regla: siempre tarar en 0g con el empaque puesto.',
        critical: true,
        icon: 'heroicons:scale'
      },
      {
        name: 'Termo / Calentador de Base',
        location: 'Extremo Izquierdo',
        purpose: 'Mantener la base caliente o tibia lista para servir. Mantener cerrado.',
        critical: true,
        icon: 'heroicons:fire'
      },
      {
        name: 'Empaques Primarios & Tapas',
        location: 'Fila Trasera de Ensamble',
        purpose: 'Empaque primario. Asegurar el sellado hermético antes de rotular.',
        critical: false,
        icon: 'heroicons:archive-box'
      },
      {
        name: 'Dispensadores de Toppings & Crunch',
        location: 'Frente Derecho',
        purpose: 'Semillas, frutos secos y guarniciones secas dosificadas.',
        critical: false,
        icon: 'heroicons:sparkles'
      },
      {
        name: 'Zona de Despacho & Bolsas',
        location: 'Extremo Derecho',
        purpose: 'Bolsas con fuelle, kits de cubiertos biodegradables y stickers de comanda.',
        critical: false,
        icon: 'heroicons:check-badge'
      }
    ]
  },
  {
    id: 'fridge1',
    title: 'Nevera 1: Proteínas & Congelador',
    subtitle: 'Zona Fría de Carnes & Porcionado Crudo',
    icon: 'heroicons:cube-transparent',
    accentColor: 'rose',
    badge: 'Cadena de Frío',
    temp: '2°C a 4°C / -18°C Congelador',
    description: 'Exclusiva para proteínas crudas y porcionadas. Evita al 100% la contaminación cruzada con vegetales listos para comer.',
    items: [
      {
        name: 'Proteínas Marinadas (Mise en Place)',
        location: 'Bandeja Media - Insertos GN con Tapa',
        purpose: 'Porciones estándar rotuladas con fecha y hora de preparación. Vida útil máx: 3 días refrigerado.',
        critical: true,
        icon: 'heroicons:tag'
      },
      {
        name: 'Stock Porcionado Congelado',
        location: 'Congelador Superior (-18°C)',
        purpose: 'Stock de seguridad porcionado al vacío o en bolsa sellada. Bajar a refrigeración con 12h de anticipación.',
        critical: false,
        icon: 'heroicons:inbox-stack'
      },
      {
        name: 'Materia Prima Cruda de Reserva',
        location: 'Cajón Inferior Frío Máximo',
        purpose: 'Materia prima para corte diario en tabla roja (carnes crudas).',
        critical: true,
        icon: 'heroicons:shield-exclamation'
      }
    ]
  },
  {
    id: 'fridge2',
    title: 'Nevera 2: Vegetales & Biberones de Salsa',
    subtitle: 'Zona Fría de Frescos Listos para Consumo',
    icon: 'heroicons:beaker',
    accentColor: 'emerald',
    badge: 'Listos para Consumo',
    temp: '4°C a 6°C',
    description: 'Insumos que van directo al plato sin cocción posterior, más salsas caseras dosificadas.',
    items: [
      {
        name: 'Biberones de Salsas de la Casa',
        location: 'Puerta Nevera / Estante Medio',
        purpose: 'Dosificadores con pico limpio y rotulado. Agitar siempre antes de dosificar.',
        critical: true,
        icon: 'heroicons:beaker'
      },
      {
        name: 'Insertos de Vegetales Frescos Picados',
        location: 'Bandeja Media - Recipientes Sellados',
        purpose: 'Vegetales limpios y sanitizados listos para servicio. Mantener escurridos sin agua estancada.',
        critical: true,
        icon: 'heroicons:leaf'
      },
      {
        name: 'Hierbas Frescas & Toppings Verdes',
        location: 'Bandeja Superior con Papel Secante',
        purpose: 'Topping final fresco. El papel secante absorbe humedad y alarga frescura.',
        critical: false,
        icon: 'heroicons:sparkles'
      }
    ]
  },
  {
    id: 'hot',
    title: 'Zona Caliente: Cocción, Plancha & Fuego',
    subtitle: 'Cocción Rápida y Sellado',
    icon: 'heroicons:fire',
    accentColor: 'amber',
    badge: 'Fuego Alto',
    temp: 'Alta Potencia (> 180°C)',
    description: 'Donde las proteínas y salteados pasan por cocción rápida al fuego para sellado y glaseado final.',
    items: [
      {
        name: 'Plancha / Sartén / Wok Principal',
        location: 'Quemador Principal',
        purpose: 'Precalentar antes de poner la porción. No sobrecargar para sellado parejo.',
        critical: true,
        icon: 'heroicons:fire'
      },
      {
        name: 'Dosificador de Grasa / Aceite',
        location: 'Costado del Quemador',
        purpose: 'Cantidad exacta por tanda. Solo lo justo para lubricar y dorar sin engrasar de más.',
        critical: false,
        icon: 'heroicons:beaker'
      },
      {
        name: 'Pinzas de Cocina & Espátulas',
        location: 'Porta-utensilios Caliente',
        purpose: 'Uso exclusivo para voltear alimentos calientes y transferir al mesón de ensamble.',
        critical: false,
        icon: 'heroicons:wrench-screwdriver'
      }
    ]
  }
];

const ACCENT_COLORS = [
  { id: 'indigo', label: 'Índigo', bg: 'bg-indigo-600', light: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'rose', label: 'Rosa / Rojo', bg: 'bg-rose-600', light: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-600', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'amber', label: 'Ámbar / Naranja', bg: 'bg-amber-600', light: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'purple', label: 'Púrpura', bg: 'bg-purple-600', light: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'blue', label: 'Azul', bg: 'bg-blue-600', light: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'slate', label: 'Gris Neutro', bg: 'bg-slate-700', light: 'bg-slate-100 text-slate-700 border-slate-200' }
];

const ICON_OPTIONS = [
  { id: 'heroicons:squares-plus', label: 'Ensamble / Mesón' },
  { id: 'heroicons:fire', label: 'Fuego / Caliente' },
  { id: 'heroicons:cube-transparent', label: 'Frío / Congelador' },
  { id: 'heroicons:beaker', label: 'Salsas / Líquidos' },
  { id: 'heroicons:scale', label: 'Báscula / Pesaje' },
  { id: 'heroicons:archive-box', label: 'Empaques / Almacén' },
  { id: 'heroicons:sparkles', label: 'Toppings / Especial' },
  { id: 'heroicons:leaf', label: 'Vegetales / Frescos' },
  { id: 'heroicons:shield-exclamation', label: 'Inocuidad / Alerta' },
  { id: 'heroicons:wrench-screwdriver', label: 'Utensilios' },
  { id: 'heroicons:tag', label: 'Rotulado' },
  { id: 'heroicons:check-badge', label: 'Despacho' }
];

export function KitchenStationLayout({ onSelectIngredient = null }) {
  const { activeBrand } = useAuth();
  const brandId = activeBrand?.id;

  const [zones, setZones] = useState([]);
  const [activeZone, setActiveZone] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Modales
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZoneIndex, setEditingZoneIndex] = useState(null); // null = new
  const [zoneFormData, setZoneFormData] = useState({
    title: '',
    subtitle: '',
    accentColor: 'indigo',
    badge: 'Estación Activa',
    temp: 'Ambiente',
    icon: 'heroicons:squares-plus',
    description: ''
  });

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [targetZoneIdForItem, setTargetZoneIdForItem] = useState(null);
  const [editingItemIndex, setEditingItemIndex] = useState(null); // null = new
  const [itemFormData, setItemFormData] = useState({
    name: '',
    location: '',
    purpose: '',
    critical: false,
    icon: 'heroicons:scale'
  });

  // Cargar layout desde restaurant_settings
  useEffect(() => {
    if (!brandId) return;
    loadLayout();
  }, [brandId]);

  const loadLayout = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('kitchen_stations_layout')
        .eq('brand_id', brandId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching stations layout:', error);
      }

      if (data?.kitchen_stations_layout && Array.isArray(data.kitchen_stations_layout) && data.kitchen_stations_layout.length > 0) {
        setZones(data.kitchen_stations_layout);
      } else {
        // Fallback a plantilla recomendada
        setZones(DEFAULT_STATIONS_TEMPLATE);
      }
      setHasChanges(false);
    } catch (err) {
      console.error('Error loading kitchen layout:', err);
      setZones(DEFAULT_STATIONS_TEMPLATE);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!brandId) {
      toast('Error: No hay marca activa.');
      return;
    }
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('restaurant_settings')
        .update({ kitchen_stations_layout: zones })
        .eq('brand_id', brandId);

      if (error) throw error;
      setHasChanges(false);
      toast('Distribución de cocina guardada con éxito.');
    } catch (err) {
      console.error('Error saving kitchen layout:', err);
      toast('Error al guardar distribución: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToTemplate = () => {
    if (window.confirm('¿Restablecer la distribución de cocina a la plantilla estándar sugerida? Perderás los cambios no guardados.')) {
      setZones(DEFAULT_STATIONS_TEMPLATE);
      setHasChanges(true);
      toast('Plantilla restaurada. Recuerda guardar los cambios.');
    }
  };

  // ── Gestores de Estación / Zona
  const openNewZoneModal = () => {
    setEditingZoneIndex(null);
    setZoneFormData({
      title: '',
      subtitle: '',
      accentColor: 'indigo',
      badge: 'Estación Activa',
      temp: 'Ambiente',
      icon: 'heroicons:squares-plus',
      description: ''
    });
    setIsZoneModalOpen(true);
  };

  const openEditZoneModal = (zoneIndex) => {
    setEditingZoneIndex(zoneIndex);
    const z = zones[zoneIndex];
    setZoneFormData({
      title: z.title || '',
      subtitle: z.subtitle || '',
      accentColor: z.accentColor || 'indigo',
      badge: z.badge || 'Estación Activa',
      temp: z.temp || 'Ambiente',
      icon: z.icon || 'heroicons:squares-plus',
      description: z.description || ''
    });
    setIsZoneModalOpen(true);
  };

  const handleSaveZone = (e) => {
    e.preventDefault();
    if (!zoneFormData.title.trim()) {
      toast('El título de la estación es obligatorio.');
      return;
    }

    if (editingZoneIndex !== null) {
      // Editar
      setZones(prev => {
        const next = [...prev];
        next[editingZoneIndex] = {
          ...next[editingZoneIndex],
          ...zoneFormData,
          title: zoneFormData.title.trim(),
          subtitle: zoneFormData.subtitle.trim(),
          description: zoneFormData.description.trim()
        };
        return next;
      });
      toast('Estación actualizada.');
    } else {
      // Nueva
      const newZone = {
        id: `zone-${Date.now()}`,
        ...zoneFormData,
        title: zoneFormData.title.trim(),
        subtitle: zoneFormData.subtitle.trim(),
        description: zoneFormData.description.trim(),
        items: []
      };
      setZones(prev => [...prev, newZone]);
      toast('Nueva estación agregada.');
    }

    setHasChanges(true);
    setIsZoneModalOpen(false);
  };

  const handleDeleteZone = (zoneIndex) => {
    const zoneName = zones[zoneIndex]?.title || 'esta estación';
    if (window.confirm(`¿Seguro que deseas eliminar "${zoneName}" y todos sus equipos/insumos?`)) {
      setZones(prev => prev.filter((_, idx) => idx !== zoneIndex));
      setHasChanges(true);
      toast('Estación eliminada.');
    }
  };

  const handleMoveZone = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= zones.length) return;
    setZones(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
    setHasChanges(true);
  };

  // ── Gestores de Items / Insumos
  const openNewItemModal = (zoneId) => {
    setTargetZoneIdForItem(zoneId);
    setEditingItemIndex(null);
    setItemFormData({
      name: '',
      location: '',
      purpose: '',
      critical: false,
      icon: 'heroicons:scale'
    });
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (zoneId, itemIndex) => {
    setTargetZoneIdForItem(zoneId);
    setEditingItemIndex(itemIndex);
    const zone = zones.find(z => z.id === zoneId);
    const item = zone?.items?.[itemIndex];
    if (item) {
      setItemFormData({
        name: item.name || '',
        location: item.location || '',
        purpose: item.purpose || '',
        critical: Boolean(item.critical),
        icon: item.icon || 'heroicons:scale'
      });
      setIsItemModalOpen(true);
    }
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!itemFormData.name.trim()) {
      toast('El nombre del equipo/insumo es obligatorio.');
      return;
    }

    setZones(prev => {
      return prev.map(zone => {
        if (zone.id !== targetZoneIdForItem) return zone;
        const currentItems = [...(zone.items || [])];

        const newItemData = {
          name: itemFormData.name.trim(),
          location: itemFormData.location.trim(),
          purpose: itemFormData.purpose.trim(),
          critical: Boolean(itemFormData.critical),
          icon: itemFormData.icon || 'heroicons:scale'
        };

        if (editingItemIndex !== null) {
          currentItems[editingItemIndex] = newItemData;
        } else {
          currentItems.push(newItemData);
        }

        return { ...zone, items: currentItems };
      });
    });

    setHasChanges(true);
    setIsItemModalOpen(false);
    toast(editingItemIndex !== null ? 'Elemento actualizado.' : 'Elemento agregado a la estación.');
  };

  const handleDeleteItem = (zoneId, itemIndex) => {
    setZones(prev => {
      return prev.map(zone => {
        if (zone.id !== zoneId) return zone;
        const currentItems = (zone.items || []).filter((_, idx) => idx !== itemIndex);
        return { ...zone, items: currentItems };
      });
    });
    setHasChanges(true);
    toast('Elemento eliminado.');
  };

  const filteredZones = activeZone === 'all' 
    ? zones 
    : zones.filter(z => z.id === activeZone);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-sm font-medium">
        Cargando estaciones de cocina...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Banner Informativo Operativo & Acciones de Edición */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1.5">
                <Icon icon="heroicons:map-pin" className="text-xs" />
                Mapeo de Cocina {activeBrand?.name ? `• ${activeBrand.name}` : ''}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md text-xs font-semibold">
                Layout 100% Personalizable
              </span>
              {hasChanges && (
                <span className="bg-amber-500 text-slate-900 px-2.5 py-0.5 rounded-md text-xs font-bold animate-pulse">
                  ⚠️ Cambios sin guardar
                </span>
              )}
            </div>
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-1.5">
              Layout Visual de Estaciones, Neveras y Mesón
            </h3>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal">
              Organiza la ubicación fija de cada equipo, insumo y herramienta en tu cocina. 
              Personaliza las zonas según el espacio físico de tu local para agilizar los tiempos y evitar la contaminación cruzada.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={openNewZoneModal}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <Icon icon="heroicons:plus" className="text-sm" />
              <span>Nueva Estación</span>
            </button>

            <button
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                hasChanges
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/50'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <Icon icon={isSaving ? "heroicons:arrow-path" : "heroicons:check"} className={`text-sm ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>

            <button
              onClick={handleResetToTemplate}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-all border border-slate-700"
              title="Restaurar plantilla sugerida"
            >
              <Icon icon="heroicons:arrow-path" className="text-xs" />
              <span className="hidden sm:inline">Plantilla Base</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtro de Estaciones */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveZone('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeZone === 'all' 
                ? 'bg-white text-slate-900 shadow-sm font-bold' 
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            Todas ({zones.length})
          </button>
          {zones.map(z => (
            <button
              key={z.id}
              onClick={() => setActiveZone(z.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeZone === z.id 
                  ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <Icon icon={z.icon || 'heroicons:squares-plus'} className="text-sm" />
              <span>{z.title.split(':')[0]}</span>
              <span className="text-[10px] opacity-80">({z.items?.length || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Regla de Oro / Buenas Prácticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex items-start gap-3.5">
          <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <Icon icon="heroicons:scale" className="text-base" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">Gramera Obligatoria</h4>
            <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
              Nunca calcular a ojo. El plato o empaque se coloca en la báscula y se tara a 0g antes de cada ingrediente.
            </p>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-4 flex items-start gap-3.5">
          <div className="w-8 h-8 bg-rose-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <Icon icon="heroicons:shield-exclamation" className="text-base" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">Inocuidad & Sin Cruce</h4>
            <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
              Carnes crudas y frescos listos jamás intercambian recipientes ni pinzas. Tablas identificadas por color.
            </p>
          </div>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 flex items-start gap-3.5">
          <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <Icon icon="heroicons:arrow-path" className="text-base" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">Sistema FIFO / PEPS</h4>
            <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
              Lo primero que entra es lo primero que sale. Todo inserto y biberón debe tener fecha de lote visible.
            </p>
          </div>
        </div>
      </div>

      {/* ── Zonas Mapeadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredZones.map((zone, zIndex) => {
          const originalIndex = zones.findIndex(z => z.id === zone.id);
          const colorObj = ACCENT_COLORS.find(c => c.id === zone.accentColor) || ACCENT_COLORS[0];

          return (
            <div 
              key={zone.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col hover:border-slate-300 transition-all relative group"
            >
              {/* Header de la Zona */}
              <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm ${colorObj.bg}`}>
                    <Icon icon={zone.icon || 'heroicons:squares-plus'} className="text-xl" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 tracking-tight">{zone.title}</h4>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">{zone.subtitle}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-1">
                    {/* Botones de Orden */}
                    <button
                      onClick={() => handleMoveZone(originalIndex, -1)}
                      disabled={originalIndex === 0}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                      title="Mover arriba"
                    >
                      <Icon icon="heroicons:chevron-up" className="text-xs" />
                    </button>
                    <button
                      onClick={() => handleMoveZone(originalIndex, 1)}
                      disabled={originalIndex === zones.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                      title="Mover abajo"
                    >
                      <Icon icon="heroicons:chevron-down" className="text-xs" />
                    </button>
                    {/* Editar Estación */}
                    <button
                      onClick={() => openEditZoneModal(originalIndex)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      title="Editar datos de estación"
                    >
                      <Icon icon="heroicons:pencil-square" className="text-sm" />
                    </button>
                    {/* Eliminar Estación */}
                    <button
                      onClick={() => handleDeleteZone(originalIndex)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Eliminar estación"
                    >
                      <Icon icon="heroicons:trash" className="text-sm" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono">
                      {zone.temp}
                    </span>
                    <p className="text-[11px] font-bold text-indigo-600 mt-0.5">{zone.badge}</p>
                  </div>
                </div>
              </div>

              {zone.description && (
                <p className="text-xs text-slate-600 leading-relaxed mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {zone.description}
                </p>
              )}

              {/* Lista de Insumos y Equipos en la Zona */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between px-1 mb-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Contenido & Disposición ({zone.items?.length || 0})
                  </p>
                  <button
                    onClick={() => openNewItemModal(zone.id)}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
                  >
                    <Icon icon="heroicons:plus" className="text-xs" />
                    <span>Agregar Elemento</span>
                  </button>
                </div>

                {(zone.items || []).length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-medium">
                    No hay equipos o insumos en esta estación aún.
                  </div>
                ) : (
                  zone.items.map((item, itemIdx) => (
                    <div 
                      key={itemIdx}
                      className="p-3 rounded-lg border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex items-start gap-3 group/item"
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                        item.critical ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon icon={item.icon || 'heroicons:scale'} className="text-base" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-900 group-hover/item:text-indigo-600 transition-colors">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-1">
                            {item.critical && (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                Crítico
                              </span>
                            )}
                            <button
                              onClick={() => openEditItemModal(zone.id, itemIdx)}
                              className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity"
                              title="Editar elemento"
                            >
                              <Icon icon="heroicons:pencil-square" className="text-xs" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(zone.id, itemIdx)}
                              className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                              title="Eliminar elemento"
                            >
                              <Icon icon="heroicons:trash" className="text-xs" />
                            </button>
                          </div>
                        </div>
                        {item.location && (
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs font-medium text-indigo-600">
                            <Icon icon="heroicons:map-pin" className="text-xs" />
                            <span>{item.location}</span>
                          </div>
                        )}
                        {item.purpose && (
                          <p className="text-xs text-slate-500 mt-1 leading-normal font-normal">
                            {item.purpose}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MODAL: Crear / Editar Estación ── */}
      {isZoneModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {editingZoneIndex !== null ? 'Editar Estación de Cocina' : 'Nueva Estación de Cocina'}
                </h3>
                <button
                  onClick={() => setIsZoneModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                >
                  <Icon icon="heroicons:x-mark" className="text-lg" />
                </button>
              </div>

              <form onSubmit={handleSaveZone} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre / Título de la Estación *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Plancha & Freidora, Mesón de Ensamble, Barra..."
                    value={zoneFormData.title}
                    onChange={e => setZoneFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subtítulo / Área</label>
                  <input
                    type="text"
                    placeholder="Ej. Zona Central - Despacho, Zona Caliente..."
                    value={zoneFormData.subtitle}
                    onChange={e => setZoneFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Temperatura / Clima</label>
                    <input
                      type="text"
                      placeholder="Ej. 2°C a 4°C, Ambiente (20°C)"
                      value={zoneFormData.temp}
                      onChange={e => setZoneFormData(prev => ({ ...prev, temp: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Etiqueta / Badge</label>
                    <input
                      type="text"
                      placeholder="Ej. Estación Crítica, Cadena de Frío"
                      value={zoneFormData.badge}
                      onChange={e => setZoneFormData(prev => ({ ...prev, badge: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Color Distintivo</label>
                    <select
                      value={zoneFormData.accentColor}
                      onChange={e => setZoneFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {ACCENT_COLORS.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Icono</label>
                    <select
                      value={zoneFormData.icon}
                      onChange={e => setZoneFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {ICON_OPTIONS.map(ic => (
                        <option key={ic.id} value={ic.id}>{ic.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descripción / Regla Operativa</label>
                  <textarea
                    rows={3}
                    placeholder="Describe el propósito de esta estación y las reglas de higiene o ensamble..."
                    value={zoneFormData.description}
                    onChange={e => setZoneFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsZoneModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                  >
                    {editingZoneIndex !== null ? 'Guardar Cambios' : 'Crear Estación'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ── MODAL: Crear / Editar Item de Estación ── */}
      {isItemModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {editingItemIndex !== null ? 'Editar Elemento de Estación' : 'Agregar Elemento a la Estación'}
                </h3>
                <button
                  onClick={() => setIsItemModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                >
                  <Icon icon="heroicons:x-mark" className="text-lg" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Equipo / Insumo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Báscula Gramera, Inserto GN 1/3 Pollo, Biberón Sriracha..."
                    value={itemFormData.name}
                    onChange={e => setItemFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ubicación Física Exacta</label>
                  <input
                    type="text"
                    placeholder="Ej. Centro del mesón, Estante superior, Puerta nevera..."
                    value={itemFormData.location}
                    onChange={e => setItemFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Propósito / Protocolo de Uso</label>
                  <textarea
                    rows={2}
                    placeholder="Instrucción estándar de gramaje, rotulado, fecha de vencimiento..."
                    value={itemFormData.purpose}
                    onChange={e => setItemFormData(prev => ({ ...prev, purpose: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Icono</label>
                    <select
                      value={itemFormData.icon}
                      onChange={e => setItemFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {ICON_OPTIONS.map(ic => (
                        <option key={ic.id} value={ic.id}>{ic.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={itemFormData.critical}
                        onChange={e => setItemFormData(prev => ({ ...prev, critical: e.target.checked }))}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-rose-700">Elemento Crítico</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsItemModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                  >
                    {editingItemIndex !== null ? 'Guardar Cambios' : 'Agregar Elemento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

export default KitchenStationLayout;
