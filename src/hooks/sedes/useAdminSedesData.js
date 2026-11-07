import { useState } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLocations } from '../../context/LocationContext';
import { toast as toastFn } from '../../components/Toast';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

export function useAdminSedesData() {
  const { isFeatureLocked, activeBrand } = useAuth();
  const { locations, loading, createLocation, updateLocation, deleteLocation } = useLocations();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [qrLocation, setQrLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  const [hours, setHours] = useState([]);
  const [loadingHours, setLoadingHours] = useState(false);

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    whatsapp: '',
    maps_url: '',
    is_main: false,
    is_active: true,
    operational_modes: ['dine_in', 'takeaway', 'delivery'],
    delivery_radius_km: 5,
    delivery_fee: 0,
    independent_payments: false,
    latitude: null,
    longitude: null,
    base_delivery_distance_km: 3,
    extra_km_fee: 1000,
    free_delivery_threshold: 0
  });

  const fetchHours = async (locationId = null) => {
    setLoadingHours(true);
    try {
      let query = supabase
        .from('business_hours')
        .select('*')
        .eq('brand_id', activeBrand?.id);

      if (locationId) {
        query = query.eq('location_id', locationId);
      } else {
        query = query.is('location_id', null);
      }

      const { data, error } = await query.order('day_of_week', { ascending: true });
      if (error) throw error;
      
      let loadedHours = data || [];
      if (loadedHours.length === 0) {
        loadedHours = Array.from({ length: 7 }, (_, i) => ({
          day_of_week: i,
          open_time: '08:00',
          close_time: '22:00',
          is_closed: false
        }));
      } else if (!locationId) {
        loadedHours = loadedHours.map(h => ({ ...h, id: undefined, location_id: undefined }));
      }
      setHours(loadedHours);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar horarios');
    } finally {
      setLoadingHours(false);
    }
  };

  const handleUpdateHour = (index, field, value) => {
    const newHours = [...hours];
    newHours[index] = { ...newHours[index], [field]: value };
    setHours(newHours);
  };

  const handleOpenModal = (loc = null) => {
    setActiveTab('info');
    fetchHours(loc?.id);
    const mainLocation = locations.find(l => l.is_main);
    
    if (loc) {
      setEditingLocation(loc);
      setForm({
        name: loc.name || '',
        address: loc.address || '',
        phone: loc.phone || '',
        whatsapp: loc.whatsapp || '',
        maps_url: loc.maps_url || '',
        is_main: loc.is_main || false,
        is_active: loc.is_active ?? true,
        operational_modes: loc.operational_modes || ['dine_in', 'takeaway'],
        delivery_radius_km: loc.delivery_radius_km != null ? Number(loc.delivery_radius_km) : 5,
        delivery_fee: loc.delivery_fee != null ? Number(loc.delivery_fee) : 0,
        independent_payments: loc.independent_payments || false,
        latitude: loc.latitude != null ? Number(loc.latitude) : null,
        longitude: loc.longitude != null ? Number(loc.longitude) : null,
        base_delivery_distance_km: loc.base_delivery_distance_km != null ? Number(loc.base_delivery_distance_km) : 3,
        extra_km_fee: loc.extra_km_fee != null ? Number(loc.extra_km_fee) : 1000,
        free_delivery_threshold: loc.free_delivery_threshold != null ? Number(loc.free_delivery_threshold) : 0
      });
    } else {
      setEditingLocation(null);
      setForm({
        name: '',
        address: activeBrand?.address || mainLocation?.address || '',
        phone: activeBrand?.phone || mainLocation?.phone || '',
        whatsapp: activeBrand?.whatsapp || mainLocation?.whatsapp || '',
        maps_url: activeBrand?.google_maps_url || mainLocation?.maps_url || '',
        is_main: locations.length === 0,
        is_active: true,
        operational_modes: ['dine_in', 'takeaway', 'delivery'],
        delivery_radius_km: 5,
        delivery_fee: 0,
        independent_payments: false,
        latitude: null,
        longitude: null,
        base_delivery_distance_km: 3,
        extra_km_fee: 1000,
        free_delivery_threshold: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCaptureSedeGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no soportada en este navegador');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6))
        }));
        toast.success(`GPS capturado: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      () => {
        toast.error('No se pudo obtener la ubicación GPS');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let res;
      let locationId;
      if (editingLocation) {
        res = await updateLocation(editingLocation.id, form);
        if (res.error) throw res.error;
        locationId = editingLocation.id;
        toast.success('Sede actualizada');
      } else {
        res = await createLocation(form);
        if (res.error) throw res.error;
        locationId = res.data?.id;
        toast.success('Sede creada correctamente');
      }

      if (locationId && hours.length > 0) {
        const toUpdate = [];
        const toInsert = [];

        hours.forEach(h => {
          const payload = {
            brand_id: activeBrand.id,
            location_id: locationId,
            day_of_week: h.day_of_week,
            open_time: h.open_time,
            close_time: h.close_time,
            is_closed: h.is_closed,
            updated_at: new Date().toISOString()
          };
          if (h.id) {
            toUpdate.push({ ...payload, id: h.id });
          } else {
            toInsert.push(payload);
          }
        });

        if (toInsert.length > 0) {
          const { error } = await supabase.from('business_hours').insert(toInsert);
          if (error) console.error("Error inserting hours:", error);
        }
        if (toUpdate.length > 0) {
          const { error } = await supabase.from('business_hours').upsert(toUpdate, { onConflict: 'id' });
          if (error) console.error("Error updating hours:", error);
        }
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar sede');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta sede?')) return;
    try {
      const { error } = await deleteLocation(id);
      if (error) throw error;
      toast.success('Sede eliminada');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo eliminar la sede');
    }
  };

  const getLocationUrl = (location) => {
    const slug = activeBrand?.slug;
    const baseUrl = window.location.origin;
    return slug ? `${baseUrl}/${slug}/?loc=${location.id}` : `${baseUrl}?loc=${location.id}`;
  };

  const handleCopyLocationUrl = (location) => {
    navigator.clipboard.writeText(getLocationUrl(location));
    toast.success('Enlace de la sede copiado al portapapeles');
  };

  const handleDownloadLocationQr = () => {
    if (!qrLocation) return;
    const svg = document.getElementById(`qr-code-location-${qrLocation.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_Sede_${qrLocation.name.replace(/\s+/g, '_')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const isMultiLocationLocked = isFeatureLocked('multi_location');
  const canAddMore = !isMultiLocationLocked || locations.length === 0;

  const handleAddSedeClick = () => {
    if (!canAddMore) {
      toast.error('Tu plan actual incluye 1 sede física. Para habilitar sucursales adicionales, actualiza a Plan Profesional.');
      return;
    }
    handleOpenModal();
  };

  return {
    activeBrand,
    locations,
    loading,
    isModalOpen,
    setIsModalOpen,
    isSubmitting,
    editingLocation,
    qrLocation,
    setQrLocation,
    activeTab,
    setActiveTab,
    hours,
    loadingHours,
    form,
    setForm,
    canAddMore,
    handleOpenModal,
    handleCaptureSedeGPS,
    handleUpdateHour,
    handleSubmit,
    handleDelete,
    getLocationUrl,
    handleCopyLocationUrl,
    handleDownloadLocationQr,
    handleAddSedeClick
  };
}
