import { useState, useEffect } from 'react';
import { supabase } from '../../../../config/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { toast } from '../../../Toast';
import { DEFAULT_STATIONS_TEMPLATE } from '../stationTemplates';

export function useKitchenStationLayout() {
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
        .order('location_id', { ascending: true, nullsFirst: true })
        .limit(1)
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

  return {
    brandId,
    activeBrand,
    zones,
    activeZone,
    setActiveZone,
    loading,
    isSaving,
    hasChanges,
    filteredZones,

    // Zone Modal
    isZoneModalOpen,
    setIsZoneModalOpen,
    editingZoneIndex,
    zoneFormData,
    setZoneFormData,
    openNewZoneModal,
    openEditZoneModal,
    handleSaveZone,
    handleDeleteZone,
    handleMoveZone,

    // Item Modal
    isItemModalOpen,
    setIsItemModalOpen,
    editingItemIndex,
    itemFormData,
    setItemFormData,
    openNewItemModal,
    openEditItemModal,
    handleSaveItem,
    handleDeleteItem,

    // Global actions
    handleSaveToDatabase,
    handleResetToTemplate
  };
}
