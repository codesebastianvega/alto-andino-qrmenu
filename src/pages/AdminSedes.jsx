import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PageHeader, PrimaryButton, FormField, TextInput } from '../components/admin/ui';
import { Icon } from '@iconify-icon/react';
import { toast as toastFn } from '../components/Toast';
import { supabase } from '../config/supabase';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export default function AdminSedes({ isEmbedded = false }) {
  const { ownedBrands, activeBrand, switchBrand, activePlan } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Sede Details form state
  const [sedeForm, setSedeForm] = useState({
    address: '',
    phone: '',
    google_maps_url: '',
    description: ''
  });

  // Sync form with active brand data
  useEffect(() => {
    if (activeBrand) {
      setSedeForm({
        address: activeBrand.address || '',
        phone: activeBrand.phone || '',
        google_maps_url: activeBrand.google_maps_url || '',
        description: activeBrand.description || ''
      });
    }
  }, [activeBrand]);

  const handleSaveSedeInfo = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('brands')
        .update({
          address: sedeForm.address,
          phone: sedeForm.phone,
          google_maps_url: sedeForm.google_maps_url,
          description: sedeForm.description,
          updated_at: new Date()
        })
        .eq('id', activeBrand.id);

      if (error) throw error;
      toast.success('Información de la sede actualizada');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar información');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Feature gating logic for adding new sedes
  const canAddSede = activePlan?.name !== 'Emprendedor';

  const handleAddSede = () => {
    if (!canAddSede) {
      toast.error('Tu plan actual no permite múltiples sedes. ¡Actualiza para expandir tu negocio!');
      return;
    }
    // Implementation for adding a sede would go here
    toast.success('Funcionalidad de nueva sede próximamente');
  };

  return (
    <div className={isEmbedded ? "space-y-10" : "p-8 max-w-7xl mx-auto space-y-10"}>
      {!isEmbedded && (
        <PageHeader
          badge="Administración"
          title="Sedes y Locales"
          subtitle="Gestiona los diferentes puntos de venta de tu negocio."
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active Sede Info Form */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-8">
           <section className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2f4131]/10 flex items-center justify-center text-[#2f4131]">
                       <Icon icon="heroicons:home-modern" className="text-xl" />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-gray-900 leading-tight">Información de esta Sede</h3>
                       <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-0.5">Datos públicos para tus clientes</p>
                    </div>
                 </div>
                 <PrimaryButton 
                   onClick={handleSaveSedeInfo} 
                   disabled={isSubmitting}
                   className="py-1.5 px-4 text-xs rounded-lg"
                 >
                   {isSubmitting ? 'Guardando...' : 'Guardar Info'}
                 </PrimaryButton>
              </div>

              <div className="p-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Dirección Física">
                       <TextInput 
                          value={sedeForm.address}
                          onChange={(e) => setSedeForm({...sedeForm, address: e.target.value})}
                          placeholder="Ej. Calle 123 #45-67, Ciudad"
                       />
                    </FormField>
                    <FormField label="Teléfono de Contacto">
                       <TextInput 
                          value={sedeForm.phone}
                          onChange={(e) => setSedeForm({...sedeForm, phone: e.target.value})}
                          placeholder="Ej. +57 300 000 0000"
                       />
                    </FormField>
                    <div className="md:col-span-2">
                       <FormField label="Enlace de Google Maps (URL)">
                          <TextInput 
                             value={sedeForm.google_maps_url}
                             onChange={(e) => setSedeForm({...sedeForm, google_maps_url: e.target.value})}
                             placeholder="https://goo.gl/maps/..."
                          />
                       </FormField>
                    </div>
                    <div className="md:col-span-2">
                       <FormField label="Breve Descripción / Bio">
                          <textarea 
                             value={sedeForm.description}
                             onChange={(e) => setSedeForm({...sedeForm, description: e.target.value})}
                             className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-[#2f4131]/10 outline-none transition-all placeholder:text-gray-300 min-h-[100px]"
                             placeholder="Cuéntale a tus clientes algo especial sobre este local..."
                          />
                       </FormField>
                    </div>
                 </div>
              </div>
           </section>

           <div className="space-y-6">
             <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest pl-4">Cambiar entre sedes</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Sede Card */}
        {ownedBrands.map((brand) => (
          <div 
            key={brand.id}
            className={`group relative bg-white rounded-3xl border-2 transition-all p-6 ${
              activeBrand?.id === brand.id 
                ? 'border-[#2f4131] shadow-xl shadow-[#2f4131]/10 bg-gradient-to-br from-white to-[#F4F4F2]' 
                : 'border-transparent shadow-sm hover:shadow-md hover:border-gray-200'
            }`}
          >
            {activeBrand?.id === brand.id && (
              <div className="absolute top-4 right-4 bg-[#2f4131] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                Activa
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2 overflow-hidden shrink-0 shadow-inner">
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain" />
                ) : (
                  <Icon icon="heroicons:building-storefront" className="text-2xl text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-gray-900 uppercase tracking-tight italic truncate">
                  {brand.name}
                </h3>
                <p className="text-[11px] text-gray-400 font-medium truncate uppercase tracking-widest">
                  {brand.slug}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-[12px] text-gray-500 font-medium">
                <Icon icon="heroicons:map-pin" className="text-gray-300" />
                <span className="truncate italic">Ubicación configurada</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-gray-500 font-medium">
                <Icon icon="heroicons:qr-code" className="text-gray-300" />
                <span>QR Menú Activo</span>
              </div>
            </div>

            <div className="flex gap-2">
              {activeBrand?.id !== brand.id ? (
                <button 
                  onClick={() => switchBrand(brand)}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold text-xs py-2.5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Gestionar sede
                </button>
              ) : (
                <button 
                  disabled
                  className="flex-1 bg-[#2f4131]/10 text-[#2f4131] font-bold text-xs py-2.5 rounded-xl cursor-default"
                >
                  Sede en curso
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add Sede Placeholder / Upsell */}
        <div 
          onClick={handleAddSede}
          className={`group flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 cursor-pointer transition-all ${
            canAddSede 
              ? 'border-gray-200 hover:border-[#2f4131]/30 hover:bg-white' 
              : 'border-gray-100 bg-gray-50/50 opacity-60 grayscale'
          }`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all ${
            canAddSede ? 'bg-gray-50 text-gray-400 group-hover:bg-[#2f4131] group-hover:text-white' : 'bg-gray-100 text-gray-300'
          }`}>
            <Icon icon={canAddSede ? "heroicons:plus" : "heroicons:lock-closed"} className="text-2xl" />
          </div>
          <p className={`text-sm font-bold tracking-tight uppercase italic ${canAddSede ? 'text-gray-500 group-hover:text-gray-900' : 'text-gray-400'}`}>
            {canAddSede ? 'Agregar Nueva Sede' : 'Expande tu negocio'}
          </p>
          {!canAddSede && (
            <p className="text-[10px] text-amber-600 font-black uppercase mt-2 text-center max-w-[140px] leading-tight">
              Disponible en Plan Profesional
            </p>
          )}
        </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
