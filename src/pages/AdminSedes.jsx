import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useLocations } from '../hooks/useLocations';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useLocationPayments } from '../hooks/useLocationPayments';
import { toast as toastFn } from '../components/Toast';
import { PageHeader, PrimaryButton, FormField, TextInput, SecondaryButton, Switch, Modal, ModalHeader } from '../components/admin/ui';
import { Icon } from '@iconify/react';
import CoverageMap from '../components/maps/CoverageMap';
import { Loader2, MapPin, Phone, Building2, ExternalLink, Trash2, QrCode } from 'lucide-react';
import { QRCode } from "react-qr-code";

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

export default function AdminSedes({ isEmbedded = false }) {
  const { isFeatureLocked, activeBrand } = useAuth();
  const { locations, loading, createLocation, updateLocation, deleteLocation } = useLocations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [qrLocation, setQrLocation] = useState(null);

  const [hours, setHours] = useState([]);
  const [loadingHours, setLoadingHours] = useState(false);

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

  // Global brand payment methods
  const { paymentMethods: brandPaymentMethods } = usePaymentMethods();
  
  // Location-specific payment methods
  const { 
    locationPayments, 
    togglePaymentMethod, 
    updateLocationPaymentConfig 
  } = useLocationPayments(editingLocation?.id);

  const [activeTab, setActiveTab] = useState('info');
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    whatsapp: '',
    maps_url: '',
    is_main: false,
    is_active: true,
    operational_modes: ['dine_in', 'takeaway'],
    delivery_radius_km: 5,
    delivery_fee: 0,
    independent_payments: false
  });

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
        delivery_radius_km: loc.delivery_radius_km || 5,
        delivery_fee: loc.delivery_fee || 0,
        independent_payments: loc.independent_payments || false
      });
    } else {
      setEditingLocation(null);
      setForm({
        name: '',
        address: '',
        phone: mainLocation?.phone || '',
        whatsapp: mainLocation?.whatsapp || '',
        maps_url: '',
        is_main: locations.length === 0,
        is_active: true,
        operational_modes: ['dine_in', 'takeaway'],
        delivery_radius_km: 5,
        delivery_fee: 0,
        independent_payments: false
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
      (err) => {
        toast.error('No se pudo obtener la ubicación GPS');
      },
      { enableHighAccuracy: true }
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
    const svg = document.getElementById(`qr-code-location-${qrLocation.id}`);
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40; // Add padding
      canvas.height = img.height + 40;
      ctx.fillStyle = "white"; // White background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20); // Draw image with 20px offset for padding
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

  if (loading && locations.length === 0) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando sedes...
    </div>
  );

  return (
    <div className={isEmbedded ? "animate-fadeUp" : "p-4 sm:p-10 max-w-[1600px] mx-auto space-y-10"}>
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fadeUp">
          <PageHeader
            badge="Infraestructura"
            title="Sedes y Locales"
            subtitle="Gestiona las ubicaciones físicas de tu marca y centraliza tu operación."
          />
          <div className="flex flex-col items-end gap-3 self-start md:self-auto">
            <PrimaryButton 
              onClick={() => handleOpenModal()} 
              disabled={!canAddMore}
              className="rounded-[1.5rem] px-8 py-4 shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-[12px]"
            >
              <Icon icon="solar:shop-2-bold" className="w-5 h-5" />
              Nueva Sede
            </PrimaryButton>
            {!canAddMore && (
              <p className="text-[10px] font-black text-amber-500 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-100 flex items-center gap-2 uppercase tracking-tight italic animate-pulse">
                <Icon icon="solar:lock-bold" /> Tu plan Pro permite sedes ilimitadas
              </p>
            )}
          </div>
        </div>
      )}

      {isEmbedded && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">Tus Puntos de Venta</h3>
            <p className="text-[12px] text-gray-400 font-medium">Controla la información y visibilidad de cada sede.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <PrimaryButton 
              onClick={() => handleOpenModal()} 
              disabled={!canAddMore}
              className="rounded-2xl py-3 px-6 shadow-lg shadow-gray-100 text-[11px] font-black uppercase tracking-widest transition-transform active:scale-95"
            >
              <Icon icon="solar:add-circle-bold" className="w-4 h-4" />
              Añadir Sede
            </PrimaryButton>
            {!canAddMore && (
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter italic">Mejorar plan para más sedes</span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {locations.map((loc) => (
          <div key={loc.id} className={`glass-glow bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-50/50 hover:shadow-2xl hover:shadow-gray-200/50 transition-all group overflow-hidden flex flex-col relative ${!loc.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}>
            
            {/* Status Floating Badge */}
            <div className="absolute top-6 right-6 z-10">
               <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm ${
                  loc.is_active ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-200 text-gray-400'
               }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${loc.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                  {loc.is_active ? 'Activa' : 'Inactiva'}
               </div>
            </div>

            <div className="p-8 flex-1 space-y-6">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-inner relative transition-transform group-hover:scale-110 duration-500 ${loc.is_main ? 'bg-gray-900 text-white shadow-xl rotate-3' : 'bg-indigo-50 text-indigo-600'}`}>
                  <Building2 size={24} />
                  {loc.is_main && (
                    <div className="absolute -bottom-2 -right-2 bg-indigo-500 text-white p-1.5 rounded-full border-4 border-white shadow-lg">
                      <Icon icon="solar:star-bold" className="text-[12px]" />
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  <h4 className="text-lg font-black text-gray-900 leading-none uppercase italic tracking-tight mb-2 pr-12">{loc.name}</h4>
                  {loc.is_main && (
                    <span className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.2em]">Sede Principal</span>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-50 group-hover:bg-white group-hover:border-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                    <MapPin size={16} />
                  </div>
                  <p className="text-[13px] text-gray-500 font-black leading-tight">{loc.address || 'Sin dirección registrada'}</p>
                </div>

                {loc.phone && (
                  <div className="flex items-center gap-4 px-4">
                    <div className="w-8 h-8 rounded-xl bg-transparent flex items-center justify-center text-gray-300">
                      <Phone size={16} />
                    </div>
                    <p className="text-[13px] text-gray-400 font-bold tracking-widest">{loc.phone}</p>
                  </div>
                )}

                {loc.whatsapp && (
                  <div className="flex items-center gap-4 px-4">
                    <div className="w-8 h-8 rounded-xl bg-transparent flex items-center justify-center text-emerald-400">
                      <Icon icon="solar:whatsapp-bold" width="18" />
                    </div>
                    <p className="text-[13px] text-emerald-600 font-black tracking-widest">{loc.whatsapp}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between group-hover:bg-gray-50 transition-colors">
               <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenModal(loc)} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-900 hover:text-white rounded-xl text-gray-600 text-[11px] font-black uppercase tracking-widest transition-all shadow-sm border border-gray-100"
                  >
                    <Icon icon="solar:pen-new-square-linear" className="text-lg" />
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(loc.id)} 
                    className="p-2.5 bg-white hover:bg-rose-50 rounded-xl text-gray-300 hover:text-rose-500 transition-all border border-gray-100"
                  >
                    <Trash2 size={18} />
                  </button>
               </div>

               <div className="flex gap-2">
                 <button 
                    onClick={() => setQrLocation(loc)} 
                    className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-500 hover:text-white hover:scale-110 active:scale-90 transition-all shadow-lg shadow-indigo-100/50"
                    title="Generar QR de la Sede"
                 >
                    <QrCode size={18} />
                 </button>

                 {loc.maps_url && (
                    <a 
                      href={loc.maps_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:scale-110 active:scale-90 transition-all shadow-lg shadow-emerald-100/50"
                      title="Abrir en Google Maps"
                    >
                      <ExternalLink size={18} />
                    </a>
                 )}
               </div>
            </div>
          </div>
        ))}

        {locations.length === 0 && (
          <div className="col-span-full glass-glow bg-white rounded-[3rem] border-4 border-dashed border-gray-50 p-20 flex flex-col items-center justify-center text-center group">
             <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mb-8 shadow-inner ring-8 ring-white group-hover:scale-110 transition-transform duration-500">
                <Icon icon="solar:map-point-remove-broken" className="text-gray-300" width="48" />
             </div>
             <h4 className="text-2xl font-black text-gray-400 uppercase tracking-tighter italic">No hay sedes operativas</h4>
             <p className="text-sm text-gray-400 mt-4 max-w-[320px] font-medium leading-relaxed italic uppercase tracking-tighter">Centraliza tus inventarios y pedidos añadiendo la ubicación física de tu punto de venta.</p>
             <button onClick={() => handleOpenModal()} className="mt-10 bg-gray-900 text-white font-black py-4 px-10 rounded-[1.5rem] shadow-2xl shadow-gray-200 hover:bg-indigo-600 transition-all text-[12px] uppercase tracking-widest">Crear Sede Principal</button>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-[9999] animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
              {/* Header */}
              <div className="px-6 sm:px-8 py-5 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#2f4131]/10 text-[#2f4131] flex items-center justify-center shrink-0">
                       <Icon icon="solar:shop-2-bold" className="text-xl" />
                    </div>
                    <div>
                       <div className="flex items-center gap-2">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                            {editingLocation ? 'Gestionar Sede' : 'Nueva Sede'}
                          </h3>
                          {editingLocation?.is_main && (
                             <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200/60 uppercase tracking-wider">
                               Principal
                             </span>
                          )}
                       </div>
                       <p className="text-xs text-gray-500 mt-0.5">
                         Configuración de contacto, horarios y logística de entrega por punto de venta.
                       </p>
                    </div>
                 </div>
                 <button 
                   type="button"
                   onClick={() => setIsModalOpen(false)} 
                   className="w-9 h-9 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center"
                 >
                    <Icon icon="solar:close-circle-bold" className="text-2xl" />
                 </button>
              </div>

              {/* Tabs Navigation (Pills) */}
              <div className="px-6 sm:px-8 py-3 border-b border-gray-100 bg-gray-50/60 shrink-0">
                <div className="flex gap-1.5 p-1 bg-gray-200/50 rounded-2xl w-full sm:w-fit overflow-x-auto custom-scrollbar">
                  {[
                    { id: 'info', label: 'Información', icon: 'solar:info-circle-bold' },
                    { id: 'hours', label: 'Horarios', icon: 'solar:clock-circle-bold' },
                    { id: 'ops', label: 'Operación & Delivery', icon: 'solar:delivery-bold' },
                    { id: 'payments', label: 'Pagos', icon: 'solar:card-2-bold' }
                  ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                          isActive 
                            ? 'bg-[#2f4131] text-white shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
                        }`}
                      >
                        <Icon icon={tab.icon} className="text-base" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                 <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar pb-8">
                 {activeTab === 'info' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <FormField label="Identificación de la Sede *">
                            <TextInput 
                                value={form.name} 
                                onChange={(e) => setForm({...form, name: e.target.value})} 
                                placeholder="Ej. Sede Norte / Zipaquirá Centro"
                                required
                            />
                          </FormField>
                          <FormField label="WhatsApp de Pedidos *">
                            <TextInput 
                                value={form.whatsapp} 
                                onChange={(e) => setForm({...form, whatsapp: e.target.value})} 
                                placeholder="+57 321 456 7890"
                                required
                            />
                          </FormField>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField label="Teléfono Fijo / Local (Opcional)">
                          <TextInput 
                              value={form.phone} 
                              onChange={(e) => setForm({...form, phone: e.target.value})} 
                              placeholder="601 234 5678"
                          />
                        </FormField>
                        <FormField label="Enlace de Google Maps (Para compartir)">
                          <TextInput 
                              value={form.maps_url} 
                              onChange={(e) => setForm({...form, maps_url: e.target.value})} 
                              placeholder="https://maps.app.goo.gl/..."
                          />
                        </FormField>
                      </div>

                      <FormField label="Dirección Física">
                          <TextInput 
                            value={form.address} 
                            onChange={(e) => setForm({...form, address: e.target.value})} 
                            placeholder="Calle 123 # 45-67, Ciudad"
                          />
                      </FormField>

                      {/* Toggles: Operación Base & Estado Online */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div 
                          onClick={() => setForm({...form, is_main: !form.is_main})}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                            form.is_main 
                              ? 'bg-amber-50/60 border-amber-200 shadow-sm' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              form.is_main ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
                            }`}>
                              <Icon icon="solar:star-bold" className="text-xl" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 leading-tight">Sede Principal</p>
                              <p className="text-xs text-gray-500">Punto de venta base y predeterminado</p>
                            </div>
                          </div>
                          <Switch 
                            checked={form.is_main} 
                            onChange={(val) => setForm({...form, is_main: val})} 
                          />
                        </div>

                        <div 
                          onClick={() => setForm({...form, is_active: !form.is_active})}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                            form.is_active 
                              ? 'bg-emerald-50/60 border-emerald-200 shadow-sm' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              form.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                            }`}>
                              <Icon icon="solar:check-circle-bold" className="text-xl" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 leading-tight">Estado Online</p>
                              <p className="text-xs text-gray-500">Visible para clientes en el menú digital</p>
                            </div>
                          </div>
                          <Switch 
                            checked={form.is_active} 
                            onChange={(val) => setForm({...form, is_active: val})} 
                          />
                        </div>
                      </div>
                    </div>
                 )}

                 {activeTab === 'hours' && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">Horarios de Atención</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Configura los horarios de atención y turnos específicos para esta sede.</p>
                      </div>
                      {loadingHours ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                      ) : (
                        <div className="space-y-2.5">
                          {hours.map((h, index) => {
                            const isClosed = h.is_closed;
                            return (
                              <div key={h.day_of_week} 
                                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all gap-3 ${
                                  isClosed 
                                    ? 'bg-gray-50/60 border-gray-200/60 opacity-60' 
                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs'
                                }`}>
                                
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 font-bold text-xs uppercase tracking-wider ${isClosed ? 'text-gray-400' : 'text-gray-800'}`}>
                                    {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][h.day_of_week]?.substring(0, 3)}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="time" 
                                      value={h.open_time || '08:00'} 
                                      onChange={(e) => handleUpdateHour(index, 'open_time', e.target.value)}
                                      disabled={isClosed}
                                      className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#2f4131] outline-none disabled:opacity-30 tabular-nums w-24 text-center"
                                    />
                                    <span className="text-gray-300 text-xs">—</span>
                                    <input 
                                      type="time" 
                                      value={h.close_time || '22:00'} 
                                      onChange={(e) => handleUpdateHour(index, 'close_time', e.target.value)}
                                      disabled={isClosed}
                                      className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#2f4131] outline-none disabled:opacity-30 tabular-nums w-24 text-center"
                                    />
                                  </div>
                                </div>

                                <button 
                                  type="button"
                                  onClick={() => handleUpdateHour(index, 'is_closed', !isClosed)}
                                  className={`w-full sm:w-auto justify-center px-3.5 py-1.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                                    isClosed 
                                      ? 'bg-rose-50 border-rose-100 text-rose-600' 
                                      : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  <div className={`w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                  {isClosed ? 'Cerrado' : 'Abierto'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                 )}

                 {activeTab === 'ops' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/80">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                            <Icon icon="solar:delivery-bold" className="text-base text-gray-700" /> Modos de Operación Habilitados
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                             {[
                               { id: 'dine_in', label: 'En Mesa / Local', icon: 'solar:plate-bold' },
                               { id: 'takeaway', label: 'Para Llevar', icon: 'solar:bag-3-bold' },
                               { id: 'delivery', label: 'A Domicilio', icon: 'solar:delivery-bold' }
                             ].map(mode => {
                               const isSelected = form.operational_modes?.includes(mode.id);
                               return (
                                 <button
                                   key={mode.id}
                                   type="button"
                                   onClick={() => {
                                     const modes = form.operational_modes || [];
                                     if (modes.includes(mode.id)) {
                                       setForm({...form, operational_modes: modes.filter(m => m !== mode.id)});
                                     } else {
                                       setForm({...form, operational_modes: [...modes, mode.id]});
                                     }
                                   }}
                                   className={`flex items-center sm:flex-col justify-center gap-2.5 p-4 rounded-xl border transition-all ${
                                     isSelected
                                       ? 'bg-[#2f4131] border-[#2f4131] text-white shadow-md shadow-[#2f4131]/20 font-bold'
                                       : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 font-medium'
                                   }`}
                                 >
                                   <Icon icon={mode.icon} width="22" />
                                   <span className="text-xs">{mode.label}</span>
                                 </button>
                               );
                             })}
                          </div>
                        </div>

                        {/* Guía Rápida de Domicilios */}
                        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-5 text-xs text-emerald-950">
                           <div className="flex items-center gap-2 font-bold text-sm text-emerald-900 mb-2.5">
                             <Icon icon="solar:lightbulb-bold" className="text-lg text-emerald-600 shrink-0" />
                             <span>¿Cómo funciona el cálculo inteligente de domicilios?</span>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed text-emerald-900/90">
                             <div className="space-y-1.5">
                               <p>
                                 <strong>1. Ubicación de tu sede:</strong> En <em>Coordenadas GPS</em> (abajo), pulsa <strong>"Capturar mi GPS actual"</strong> para fijar el punto de partida de tus repartidores.
                               </p>
                               <p>
                                 <strong>2. Radio de cobertura:</strong> Define el alcance máximo en km. Si un cliente está más lejos, se le avisará amablemente que está fuera de zona.
                               </p>
                             </div>
                             <div className="space-y-1.5">
                               <p>
                                 <strong>3. Tarifa base y km extra:</strong> Cobras un valor base hasta cierta distancia (ej. 3 km) y un recargo por km adicional.
                               </p>
                               <p>
                                 <strong>4. GPS del comensal:</strong> Tu cliente pulsa <em>"Mi GPS"</em> al ordenar y el sistema calcula la tarifa exacta en segundos.
                               </p>
                             </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <FormField label="Tarifa Base de Domicilio ($ COP)">
                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 focus-within:border-[#2f4131] transition-all">
                               <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                                  <Icon icon="solar:dollar-bold" width="18" />
                               </div>
                               <input 
                                  type="number" 
                                  min="0" 
                                  step="500"
                                  value={form.delivery_fee}
                                  onChange={(e) => setForm({...form, delivery_fee: Math.max(0, parseInt(e.target.value) || 0)})}
                                  placeholder="Ej: 4000"
                                  className="flex-1 font-semibold text-gray-900 text-sm bg-transparent border-none outline-none focus:ring-0"
                               />
                               <span className="text-xs font-semibold text-gray-400">COP</span>
                            </div>
                          </FormField>

                          <FormField label="Distancia Cubierta por Tarifa Base (km)">
                             <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 focus-within:border-[#2f4131] transition-all">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 shrink-0">
                                   <Icon icon="solar:route-bold" width="18" />
                                </div>
                                <input 
                                   type="number" 
                                   min="0.5" 
                                   step="0.5"
                                   value={form.base_delivery_distance_km}
                                   onChange={(e) => setForm({...form, base_delivery_distance_km: Math.max(0.5, parseFloat(e.target.value) || 1)})}
                                   className="flex-1 font-semibold text-gray-900 text-sm bg-transparent border-none outline-none focus:ring-0"
                                />
                                <span className="text-xs font-semibold text-gray-400">km</span>
                             </div>
                          </FormField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                           <FormField label="Costo por Km Adicional ($ COP)">
                              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 focus-within:border-[#2f4131] transition-all">
                                 <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700 shrink-0">
                                    <Icon icon="solar:tag-price-bold" width="18" />
                                 </div>
                                 <input 
                                    type="number" 
                                    min="0" 
                                    step="200"
                                    value={form.extra_km_fee}
                                    onChange={(e) => setForm({...form, extra_km_fee: Math.max(0, parseInt(e.target.value) || 0)})}
                                    placeholder="Ej: 1500"
                                    className="flex-1 font-semibold text-gray-900 text-sm bg-transparent border-none outline-none focus:ring-0"
                                 />
                                 <span className="text-xs font-semibold text-gray-400">COP/km</span>
                              </div>
                           </FormField>

                           <FormField label="Envío Gratis por Compras Superiores a ($ COP, 0 = Inactivo)">
                              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 focus-within:border-[#2f4131] transition-all">
                                 <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
                                    <Icon icon="solar:gift-bold" width="18" />
                                 </div>
                                 <input 
                                    type="number" 
                                    min="0" 
                                    step="5000"
                                    value={form.free_delivery_threshold}
                                    onChange={(e) => setForm({...form, free_delivery_threshold: Math.max(0, parseInt(e.target.value) || 0)})}
                                    placeholder="Ej: 70000"
                                    className="flex-1 font-semibold text-gray-900 text-sm bg-transparent border-none outline-none focus:ring-0"
                                 />
                                 <span className="text-xs font-semibold text-gray-400">COP</span>
                              </div>
                           </FormField>
                        </div>

                        <FormField label="Coordenadas GPS de la Sede (Punto de Partida)">
                           <div className="p-4 bg-white rounded-2xl border border-gray-200 flex flex-col gap-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                 <span className="text-xs text-gray-600 font-medium">
                                    {form.latitude && form.longitude 
                                      ? `📍 Lat: ${Number(form.latitude).toFixed(6)}, Lng: ${Number(form.longitude).toFixed(6)}` 
                                      : "Sin coordenadas configuradas"}
                                 </span>
                                 <button
                                    type="button"
                                    onClick={handleCaptureSedeGPS}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-200/60"
                                 >
                                    <Icon icon="solar:gps-bold" />
                                    Capturar mi GPS actual
                                 </button>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                 <input
                                    type="number"
                                    step="0.000001"
                                    placeholder="Latitud (ej: 5.0260)"
                                    value={form.latitude ?? ''}
                                    onChange={(e) => setForm({...form, latitude: e.target.value === '' ? null : parseFloat(e.target.value)})}
                                    className="p-2.5 bg-gray-50 rounded-xl text-xs font-semibold text-gray-800 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2f4131]"
                                 />
                                 <input
                                    type="number"
                                    step="0.000001"
                                    placeholder="Longitud (ej: -74.0040)"
                                    value={form.longitude ?? ''}
                                    onChange={(e) => setForm({...form, longitude: e.target.value === '' ? null : parseFloat(e.target.value)})}
                                    className="p-2.5 bg-gray-50 rounded-xl text-xs font-semibold text-gray-800 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2f4131]"
                                 />
                              </div>
                           </div>
                        </FormField>

                        <FormField label="Radio Máximo de Cobertura Delivery">
                           <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700 shrink-0">
                                 <Icon icon="solar:radius-bold" width="20" />
                              </div>
                              <input 
                                 type="range" 
                                 min="1" 
                                 max="50" 
                                 step="0.5"
                                 value={form.delivery_radius_km}
                                 onChange={(e) => setForm({...form, delivery_radius_km: parseFloat(e.target.value)})}
                                 className="flex-1 accent-[#2f4131] h-2 bg-gray-100 rounded-lg cursor-pointer"
                              />
                              <div className="w-16 text-right">
                                 <span className="text-base font-bold text-gray-900">{form.delivery_radius_km}</span>
                                 <span className="text-xs font-medium text-gray-500 ml-1">km</span>
                              </div>
                           </div>
                        </FormField>

                        <FormField label="Visualización de Cobertura en Mapa">
                           <CoverageMap
                             latitude={form.latitude}
                             longitude={form.longitude}
                             radiusKm={form.delivery_radius_km}
                             sedeName={form.name || "Nuestra Sede"}
                             onLocationChange={({ lat, lng }) => {
                               setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
                             }}
                           />
                        </FormField>
                    </div>
                 )}

                 {activeTab === 'payments' && (
                    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                       <div className={`p-5 rounded-2xl border transition-all ${
                         form.independent_payments 
                           ? 'bg-emerald-50/60 border-emerald-200' 
                           : 'bg-gray-50/70 border-gray-200'
                       }`}>
                          <div className="flex items-center justify-between gap-4">
                             <div className="flex-1">
                                <h4 className="text-sm font-bold text-gray-900 mb-0.5">Pagos Independientes</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                  {form.independent_payments 
                                   ? "Esta sede gestiona sus propios métodos de pago (cuentas bancarias, datáfonos locales)." 
                                   : "Esta sede utilizará los métodos de pago configurados a nivel general de la marca."}
                                </p>
                             </div>
                             <Switch 
                               checked={form.independent_payments} 
                               onChange={(val) => setForm({...form, independent_payments: val})} 
                             />
                          </div>
                       </div>

                       {form.independent_payments && (
                         <div className="space-y-4 animate-in fade-in duration-200">
                           <div className="flex items-center justify-between px-1">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Métodos Disponibles</h5>
                              <span className="text-[11px] text-gray-400">Activa los que aplican a esta sede</span>
                           </div>

                           <div className="grid grid-cols-1 gap-3">
                             {brandPaymentMethods.map(method => {
                               const locPay = locationPayments.find(lp => lp.payment_method_id === method.id);
                               const isEnabled = locPay?.is_active ?? false;

                               return (
                                 <div 
                                   key={method.id} 
                                   className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                     isEnabled 
                                       ? 'bg-white border-emerald-200 shadow-sm' 
                                       : 'bg-gray-50/50 border-gray-200/80 opacity-70'
                                   }`}
                                 >
                                   <div className="flex items-center gap-3.5">
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                       isEnabled ? 'bg-[#2f4131] text-white' : 'bg-gray-100 text-gray-400'
                                     }`}>
                                       <Icon icon={method.type === 'transfer' ? 'solar:card-transfer-bold' : 'solar:wad-of-money-bold'} width="20" />
                                     </div>
                                     <div>
                                       <h6 className="text-sm font-bold text-gray-900 leading-tight">{method.name}</h6>
                                       <p className="text-xs text-gray-400">{method.type === 'transfer' ? 'Transferencia QR / Cuenta' : 'Efectivo / Datáfono'}</p>
                                     </div>
                                   </div>

                                   <button
                                     type="button"
                                     onClick={() => togglePaymentMethod(method.id, !isEnabled)}
                                     className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                       isEnabled 
                                         ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                         : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800'
                                     }`}
                                   >
                                     <Icon icon={isEnabled ? 'solar:check-circle-bold' : 'solar:add-circle-bold'} className="text-sm" />
                                     {isEnabled ? 'Activo' : 'Activar'}
                                   </button>
                                 </div>
                               );
                             })}

                             {brandPaymentMethods.length === 0 && (
                               <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center">
                                 <Icon icon="solar:card-transfer-broken" width="36" className="text-gray-300 mb-2" />
                                 <p className="text-xs font-semibold text-gray-500">No hay métodos configurados en la marca.</p>
                               </div>
                             )}
                           </div>
                           
                           {locationPayments.some(lp => lp.is_active && lp.payment_method?.type === 'transfer') && (
                             <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                                   <Icon icon="solar:qr-code-bold" width="18" />
                                </div>
                                <div>
                                   <h6 className="text-xs font-bold text-amber-900 mb-0.5">Nota sobre QRs de Transferencia</h6>
                                   <p className="text-xs text-amber-800/80 leading-relaxed">
                                     Pronto podrás subir una imagen de QR específica para esta sede. Por ahora se usará el número de cuenta registrado en la marca.
                                   </p>
                                </div>
                             </div>
                           )}
                         </div>
                       )}
                    </div>
                 )}

                 </div>
                 {/* Footer Sticky */}
                 <div className="px-6 sm:px-8 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)} 
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                       Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2f4131] hover:bg-[#253527] text-white text-xs font-semibold shadow-md shadow-[#2f4131]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                       {isSubmitting ? (
                         <Loader2 className="w-4 h-4 animate-spin" />
                       ) : (
                         <>
                           <Icon icon="solar:diskette-bold-duotone" className="text-base" />
                           <span>{editingLocation ? 'Guardar Cambios' : 'Crear Sede'}</span>
                         </>
                       )}
                    </button>
                 </div>
              </form>
            </div>
        </div>,
        document.body
      )}

      {qrLocation && (
        <Modal onClose={() => setQrLocation(null)}>
          <ModalHeader 
            title={`Código QR - ${qrLocation.name}`}
            subtitle="Los clientes pueden escanear este código para acceder al menú de esta sede."
            onClose={() => setQrLocation(null)} 
          />
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
              <QRCode 
                id={`qr-code-location-${qrLocation.id}`}
                value={getLocationUrl(qrLocation)} 
                size={220}
                level="H"
                className="w-full h-auto"
              />
            </div>
            
            <div className="flex flex-col gap-3 w-full max-w-sm">
              <PrimaryButton onClick={handleDownloadLocationQr} className="w-full justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar QR (PNG)
              </PrimaryButton>
              <SecondaryButton onClick={() => handleCopyLocationUrl(qrLocation)} className="w-full justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Copiar Enlace Directo
              </SecondaryButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
