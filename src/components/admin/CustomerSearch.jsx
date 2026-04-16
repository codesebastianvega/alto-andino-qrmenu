import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  Modal, ModalHeader, SearchInput, PrimaryButton, SecondaryButton, TextInput, FormField 
} from './ui';
import { User, Phone, Plus, Search, Check, X, UserPlus, Loader2, ArrowRight } from 'lucide-react';
import { toast } from '../Toast';

export default function CustomerSearch({ open, onSelect, onClose, brandId }) {
  const { activeBrand } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const searchInputRef = useRef(null);

  // Use the passed brandId or fallback to auth context
  const targetBrandId = brandId || activeBrand?.id;

  // Focus search input on mount
  useEffect(() => {
    if (open && !newCustomerMode) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open, newCustomerMode]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 3) {
        searchCustomers();
      } else if (searchTerm.trim().length === 0) {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!open) return null;

  const searchCustomers = async () => {
    if (!targetBrandId) {
      console.warn('CustomerSearch: targetBrandId missing');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('brand_id', targetBrandId)
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error('Error searching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!targetBrandId) {
      toast('Error: No se identificó la marca', { type: 'error' });
      return;
    }
    
    // Validar teléfono básico
    if (form.phone.length < 7) {
      toast('Teléfono inválido', { type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // Usar un query más robusto para verificar duplicados
      const { data: existing, error: checkError } = await supabase
        .from('customers')
        .select('id, name, phone')
        .eq('brand_id', targetBrandId)
        .eq('phone', form.phone);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        toast('Este teléfono ya está registrado', { type: 'error' });
        setResults(existing);
        setNewCustomerMode(false);
        setLoading(false);
        return;
      }

      // Insertar y solicitar retorno de datos
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          brand_id: targetBrandId,
          name: form.name.trim(),
          phone: form.phone.trim()
        }])
        .select();

      if (error) {
        // Capturar errores específicos de PostgREST
        if (error.code === '23505') {
          toast('Este cliente ya existe', { type: 'error' });
        } else {
          throw error;
        }
      }
      
      const newCustomer = data?.[0];
      if (!newCustomer) throw new Error('No se pudo recuperar el cliente creado');

      toast('Cliente creado con éxito', { type: 'success' });
      onSelect(newCustomer);
    } catch (err) {
      console.error('Error creating customer:', err);
      toast('Error al guardar. Verifica conexión o permisos.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Modal onClose={onClose}>
      <ModalHeader 
        title={newCustomerMode ? "Nuevo Cliente" : "Identificar Cliente"} 
        subtitle={newCustomerMode ? "Regístralo para su programa de lealtad" : "Selecciona una mesa y busca al cliente (opcional)"}
        onClose={onClose}
      />

      <div className="p-7 space-y-6">
        {!newCustomerMode ? (
          <>
            {/* OPCIÓN RÁPIDA: Saltar identificación */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between group hover:border-brand-primary transition-all">
              <div className="flex-1">
                <p className="text-sm font-black text-gray-900 leading-tight">Cliente Invitado / Anónimo</p>
                <p className="text-[11px] text-gray-500 font-medium">Omitir identificación y tomar orden ahora</p>
              </div>
              <PrimaryButton 
                onClick={() => onSelect(null)}
                className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white px-4 py-2 text-xs font-black h-auto"
              >
                Saltar <ArrowRight size={14} className="ml-1" />
              </PrimaryButton>
            </div>

            <div className="relative">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={18} />
               </div>
               <input 
                 ref={searchInputRef}
                 type="text"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Buscar por nombre o celular..."
                 className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all shadow-sm"
               />
            </div>

            <div className="space-y-3 min-h-[160px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Loader2 className="animate-spin mb-2" />
                  <p className="text-xs font-medium">Buscando en la base de datos...</p>
                </div>
              ) : results.length > 0 ? (
                results.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelect(c)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-left group shadow-sm bg-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm uppercase">
                        {c.name ? c.name.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-brand-primary transition-colors">{c.name || 'Sin nombre'}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <Phone size={10} /> {c.phone}
                        </p>
                      </div>
                    </div>
                    <Check className="text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                  </button>
                ))
              ) : searchTerm.length >= 3 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-400 mb-4 font-medium italic">No se encontraron clientes.</p>
                  <SecondaryButton onClick={() => setNewCustomerMode(true)} className="bg-white">
                    <Plus size={16} className="mr-2" /> Registrar "{searchTerm}"
                  </SecondaryButton>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 opacity-30">
                  <Search size={32} className="mx-auto mb-3" />
                  <p className="text-[11px] font-bold uppercase tracking-widest">Escribe para buscar</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-center">
               <button 
                 onClick={() => setNewCustomerMode(true)}
                 className="text-xs font-black text-brand-primary hover:underline flex items-center justify-center gap-2 group"
               >
                 <UserPlus size={16} className="group-hover:scale-110 transition-transform" />
                 <span>CREAR NUEVO CLIENTE MANUALMENTE</span>
               </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <FormField label="Nombre Completo">
              <TextInput 
                required
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Juan Perez"
              />
            </FormField>
            <FormField label="Teléfono / WhatsApp">
              <TextInput 
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Ej: 3001234567"
              />
            </FormField>

            <div className="pt-6 flex gap-3">
              <SecondaryButton 
                className="flex-1 h-14 rounded-2xl font-bold"
                onClick={() => setNewCustomerMode(false)}
              >
                Cancelar
              </SecondaryButton>
              <PrimaryButton 
                type="submit"
                className="flex-1 h-14 rounded-2xl font-black"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Crear y Continuar"}
              </PrimaryButton>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
