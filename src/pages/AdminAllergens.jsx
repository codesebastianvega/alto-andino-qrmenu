import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast as toastFn } from '../components/Toast';
import {
  PageHeader, PrimaryButton, SecondaryButton, Badge,
  TableContainer, Th, Modal, ModalHeader, FormField, TextInput
} from '../components/admin/ui';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export default function AdminAllergens() {
  const { activeBrand } = useAuth();
  const [allergens, setAllergens] = useState([]);
  const [loadingAllergens, setLoadingAllergens] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAllergen, setEditingAllergen] = useState(null);
  const [allergenForm, setAllergenForm] = useState({ name: '', emoji: '' });
  const [isSubmittingAllergen, setIsSubmittingAllergen] = useState(false);

  useEffect(() => {
    fetchAllergens();
  }, []);

  const fetchAllergens = async () => {
    setLoadingAllergens(true);
    try {
      if (!activeBrand) return;
      const { data, error } = await supabase
        .from('allergens')
        .select('*')
        .eq('brand_id', activeBrand.id)
        .order('name');
      if (error) throw error;
      setAllergens(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar alérgenos');
    } finally {
      setLoadingAllergens(false);
    }
  };

  const openCreate = () => {
    setEditingAllergen(null);
    setAllergenForm({ name: '', emoji: '' });
    setIsFormOpen(true);
  };

  const openEdit = (allergen) => {
    setEditingAllergen(allergen);
    setAllergenForm({ name: allergen.name, emoji: allergen.emoji });
    setIsFormOpen(true);
  };

  const handleSaveAllergen = async (e) => {
    e.preventDefault();
    if (!allergenForm.name || !allergenForm.emoji) return toast.error('Rellena todos los campos');

    setIsSubmittingAllergen(true);
    try {
      if (editingAllergen) {
        const { error } = await supabase
          .from('allergens')
          .update({ name: allergenForm.name, emoji: allergenForm.emoji, updated_at: new Date() })
          .eq('id', editingAllergen.id);
        if (error) throw error;
        toast.success('Alérgeno actualizado');
      } else {
        const { error } = await supabase
          .from('allergens')
          .insert([{ 
            name: allergenForm.name, 
            emoji: allergenForm.emoji,
            brand_id: activeBrand.id 
          }]);
        if (error) throw error;
        toast.success('Alérgeno creado');
      }
      setIsFormOpen(false);
      setEditingAllergen(null);
      fetchAllergens();
    } catch (err) {
      console.error(err);
      toast.error('Error guardando alérgeno');
    } finally {
      setIsSubmittingAllergen(false);
    }
  };

  const handleDeleteAllergen = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este alérgeno?')) return;
    try {
      const { error } = await supabase.from('allergens').delete().eq('id', id);
      if (error) throw error;
      toast.success('Alérgeno eliminado');
      fetchAllergens();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  if (loadingAllergens) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">Cargando…</div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        badge="Carta"
        title="Dietas y Alérgenos"
        subtitle="Configura las etiquetas que aparecerán en los productos."
      >
        <PrimaryButton onClick={openCreate}>+ Nueva etiqueta</PrimaryButton>
      </PageHeader>

      <TableContainer>
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              <Th>Icono</Th>
              <Th>Nombre</Th>
              <Th right>Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {allergens.length === 0 ? (
              <tr><td colSpan={3} className="px-5 py-14 text-center text-sm text-gray-400 font-medium">No hay etiquetas configuradas.</td></tr>
            ) : allergens.map((allergen) => (
              <tr key={allergen.id} className="group hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-3.5 w-20">
                  <span className="text-2xl bg-gray-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    {allergen.emoji}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-sm font-semibold text-gray-900">{allergen.name}</p>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(allergen)}
                      className="px-3 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      Editar
                    </button>
                    <button onClick={() => handleDeleteAllergen(allergen.id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>

      {isFormOpen && (
        <Modal onClose={() => setIsFormOpen(false)}>
          <ModalHeader 
            title={editingAllergen ? 'Editar Etiqueta' : 'Nueva Etiqueta'} 
            subtitle="Los cambios se reflejarán en todos los productos asociados."
            onClose={() => setIsFormOpen(false)} 
          />
          <form onSubmit={handleSaveAllergen} className="p-7 space-y-6">
            <div className="space-y-4">
              <FormField>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Nombre</label>
                <TextInput
                  value={allergenForm.name}
                  onChange={(e) => setAllergenForm({ ...allergenForm, name: e.target.value })}
                  placeholder="Ej. Vegano"
                  required
                />
              </FormField>

              <FormField>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Emoji (Icono)</label>
                <div className="flex gap-3 items-center">
                  <div className="text-3xl bg-gray-50 border border-gray-200 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                    {allergenForm.emoji || '🌱'}
                  </div>
                  <TextInput
                    value={allergenForm.emoji}
                    onChange={(e) => setAllergenForm({ ...allergenForm, emoji: e.target.value })}
                    placeholder="Ej. 🌱"
                    maxLength={5}
                    required
                  />
                </div>
              </FormField>
            </div>

            <div className="flex gap-3 pt-2">
              <div className="flex-1">
                <SecondaryButton 
                  onClick={() => setIsFormOpen(false)}
                  className="w-full justify-center"
                >
                  Cancelar
                </SecondaryButton>
              </div>
              <div className="flex-1">
                <PrimaryButton 
                  type="submit" 
                  disabled={isSubmittingAllergen}
                  className="w-full justify-center"
                >
                  {isSubmittingAllergen ? 'Guardando...' : editingAllergen ? 'Guardar Cambios' : 'Crear Etiqueta'}
                </PrimaryButton>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
