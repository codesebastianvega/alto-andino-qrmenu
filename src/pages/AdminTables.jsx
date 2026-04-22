import { useState, useEffect } from 'react';
import QRCode from "react-qr-code";
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useLocations } from '../context/LocationContext';
import { toast as toastFn } from '../components/Toast';
import {
  PageHeader, PrimaryButton, SecondaryButton, Badge,
  TableContainer, Th, Modal, ModalHeader, FormField, TextInput, SelectInput
} from '../components/admin/ui';

import { 
  Plus, LayoutGrid, MapPin, QrCode, Edit3, Trash2, 
  ChevronRight, Layers, Table
} from 'lucide-react';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

export default function AdminTables({ isEmbedded = false }) {
  const { profile } = useAuth();
  const { activeLocationId, isAllLocations } = useLocations();
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableForm, setTableForm] = useState({ table_number: '', area_id: '' });
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  // Areas Management
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [isSubmittingArea, setIsSubmittingArea] = useState(false);

  // QR Modal
  const [qrTable, setQrTable] = useState(null);

  useEffect(() => {
    if (profile?.brand_id) {
      fetchTables();
      fetchAreas();
    }
  }, [profile?.brand_id, activeLocationId, isAllLocations]);

  const fetchAreas = async () => {
    setLoadingAreas(true);
    try {
      let query = supabase
        .from('table_areas')
        .select('*, locations(name)')
        .eq('brand_id', profile.brand_id)
        .order('sort_order', { ascending: true });

      if (!isAllLocations && activeLocationId) {
        query = query.eq('location_id', activeLocationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAreas(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAreas(false);
    }
  };

  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      let query = supabase
        .from('restaurant_tables')
        .select('*, table_areas(name), locations(name)')
        .eq('brand_id', profile.brand_id)
        .order('table_number');
      
      if (!isAllLocations && activeLocationId) {
        query = query.eq('location_id', activeLocationId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar mesas');
    } finally {
      setLoadingTables(false);
    }
  };

  const handleCreateArea = async (e) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    if (isAllLocations || !activeLocationId) {
      return toast.error('Selecciona una sede específica para crear un salón');
    }
    setIsSubmittingArea(true);
    try {
      const { error } = await supabase.from('table_areas').insert([{
        name: newAreaName.trim(),
        brand_id: profile.brand_id,
        location_id: activeLocationId,
        sort_order: areas.length
      }]);
      if (error) throw error;
      setNewAreaName('');
      fetchAreas();
      toast.success('Área creada');
    } catch (err) {
      console.error(err);
      toast.error('Error al crear área');
    } finally {
      setIsSubmittingArea(false);
    }
  };

  const handleDeleteArea = async (id) => {
    if (!window.confirm('¿Seguro? Se desvincularán las mesas de este salón.')) return;
    try {
      const { error } = await supabase.from('table_areas').delete().eq('id', id);
      if (error) throw error;
      fetchAreas();
      fetchTables();
      toast.success('Área eliminada');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar área');
    }
  };

  const openCreate = () => {
    if (isAllLocations || !activeLocationId) {
      return toast.error('Selecciona una sede específica para crear una mesa');
    }
    setEditingTable(null);
    setTableForm({ table_number: '', area_id: '' });
    setIsFormOpen(true);
  };

  const openEdit = (table) => {
    setEditingTable(table);
    setTableForm({ 
      table_number: table.table_number,
      area_id: table.area_id || ''
    });
    setIsFormOpen(true);
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    if (!tableForm.table_number) return toast.error('Ingresa el identificador de la mesa');

    setIsSubmittingTable(true);
    try {
      if (editingTable) {
        const { error } = await supabase.from('restaurant_tables')
          .update({ 
            table_number: tableForm.table_number, 
            area_id: tableForm.area_id || null,
            updated_at: new Date() 
          })
          .eq('id', editingTable.id);
        if (error) throw error;
        toast.success('Mesa actualizada');
      } else {
        const { error } = await supabase.from('restaurant_tables')
          .insert([{ 
            table_number: tableForm.table_number,
            area_id: tableForm.area_id || null,
            brand_id: profile.brand_id,
            location_id: activeLocationId
          }]);
        if (error) throw error;
        toast.success('Mesa creada');
      }
      setIsFormOpen(false);
      setEditingTable(null);
      fetchTables();
    } catch (err) {
      console.error(err);
      toast.error('Error guardando mesa. Puede que el nombre ya exista.');
    } finally {
      setIsSubmittingTable(false);
    }
  };

  const handleDeleteTable = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta mesa?')) return;
    try {
      const { error } = await supabase.from('restaurant_tables').delete().eq('id', id);
      if (error) throw error;
      toast.success('Mesa eliminada');
      fetchTables();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  const toggleTableActive = async (table) => {
    try {
      const { error } = await supabase.from('restaurant_tables')
        .update({ is_active: !table.is_active })
        .eq('id', table.id);
      if (error) throw error;
      fetchTables();
    } catch (err) {
      console.error(err);
      toast.error('Error actualizando estado');
    }
  };

  const getTableUrl = (table) => {
    return `${window.location.origin}?mesa=${encodeURIComponent(table.table_number)}`;
  };

  const handleCopyUrl = (table) => {
    navigator.clipboard.writeText(getTableUrl(table));
    toast.success('Enlace copiado al portapapeles');
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById(`qr-code-${qrTable.id}`);
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
      downloadLink.download = `QR_Mesa_${qrTable.table_number}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loadingTables) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">Cargando…</div>
  );

  return (
    <div className={isEmbedded ? "" : "p-8 max-w-7xl mx-auto space-y-6"}>
      {!isEmbedded && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-xl shadow-gray-200/40 mb-8">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <Table className="w-3.5 h-3.5 text-[#2f4131]" />
                <h3 className="text-[10px] font-black text-[#2f4131] uppercase tracking-[0.3em]">Negocio / Activos</h3>
             </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Gestión de Mesas</h2>
            <p className="text-xs text-gray-400 font-medium">Controla tus ubicaciones físicas y descarga sus códigos QR únicos.</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <SecondaryButton onClick={() => setIsAreaModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6">
              <Layers size={16} />
              Gestionar Salones
            </SecondaryButton>
            <PrimaryButton onClick={openCreate} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 shadow-lg shadow-[#2f4131]/20">
              <Plus size={18} />
              Nueva Mesa
            </PrimaryButton>
          </div>
        </div>
      )}

      {isEmbedded && (
        <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200/50">
           <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight italic">Listado de Mesas</h2>
           </div>
           <div className="flex gap-2">
             <SecondaryButton onClick={() => setIsAreaModalOpen(true)} className="px-4 py-2 text-xs rounded-xl">Salones</SecondaryButton>
             <PrimaryButton onClick={openCreate} className="px-6 py-2 text-xs rounded-xl">+ Nueva mesa</PrimaryButton>
           </div>
        </div>
      )}

      <TableContainer>
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              <Th>Identificador</Th>
              <Th>Salón / Entorno</Th>
              <Th>Estado</Th>
              <Th right>Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tables.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-20 text-center text-sm text-gray-300 font-medium italic">No hay mesas configuradas aún. Empieza agregando una nueva mesa.</td></tr>
            ) : tables.map((table) => (
              <tr key={table.id} className="group hover:bg-gray-50/80 transition-all duration-200">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400 group-hover:bg-[#2f4131] group-hover:text-white group-hover:border-[#2f4131] transition-all duration-300">
                       <MapPin size={18} />
                    </div>
                    <div className="font-bold text-gray-900 group-hover:translate-x-1 transition-transform">{table.table_number}</div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                        table.table_areas?.name 
                          ? 'bg-[#2f4131]/5 border-[#2f4131]/10 text-[#2f4131]/70' 
                          : 'bg-gray-50 border-gray-100 text-gray-400 italic font-medium lowercase tracking-normal'
                      }`}>
                        {table.table_areas?.name || 'sin salón'}
                      </div>
                    </div>
                    {isAllLocations && table.locations?.name && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-0.5">
                        <MapPin size={10} className="text-gray-300" />
                        {table.locations.name}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <button onClick={() => toggleTableActive(table)} className="active:scale-95 transition-transform">
                    <Badge variant={table.is_active ? 'green' : 'gray'}>
                      {table.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </button>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <button onClick={() => setQrTable(table)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider">
                      <QrCode size={16} />
                      QR
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <button onClick={() => openEdit(table)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider">
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => handleDeleteTable(table.id)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={15} />
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
            title={editingTable ? 'Editar Mesa' : 'Nueva Mesa'} 
            subtitle="Identifica la mesa para luego vincularla a un código QR."
            onClose={() => setIsFormOpen(false)} 
          />
          <form onSubmit={handleSaveTable} className="p-7 space-y-6">
            <div className="space-y-4">
              <FormField>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Identificador de Mesa</label>
                <TextInput
                  value={tableForm.table_number}
                  onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
                  placeholder="Ej. Mesa 1, Sala Principal, VIP..."
                  required
                />
              </FormField>

              <FormField label="Salón / Entorno">
                <SelectInput
                  value={tableForm.area_id}
                  onChange={(e) => setTableForm({ ...tableForm, area_id: e.target.value })}
                >
                  <option value="">Sin salón específico</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </SelectInput>
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
                  disabled={isSubmittingTable}
                  className="w-full justify-center"
                >
                  {isSubmittingTable ? 'Guardando...' : editingTable ? 'Guardar Cambios' : 'Crear Mesa'}
                </PrimaryButton>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {qrTable && (
        <Modal onClose={() => setQrTable(null)}>
          <ModalHeader 
            title={`Código QR - ${qrTable.table_number}`}
            subtitle="Los clientes pueden escanear este código para abrir el menú de esta mesa."
            onClose={() => setQrTable(null)} 
          />
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
              <QRCode 
                id={`qr-code-${qrTable.id}`}
                value={getTableUrl(qrTable)} 
                size={220}
                level="H"
                className="w-full h-auto"
              />
            </div>
            
            <div className="flex flex-col gap-3 w-full max-w-sm">
              <PrimaryButton onClick={handleDownloadQr} className="w-full justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar QR (PNG)
              </PrimaryButton>
              <SecondaryButton onClick={() => handleCopyUrl(qrTable)} className="w-full justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Copiar Enlace Directo
              </SecondaryButton>
            </div>
          </div>
        </Modal>
      )}

      {isAreaModalOpen && (
        <Modal onClose={() => setIsAreaModalOpen(false)}>
          <ModalHeader 
            title="Gestionar Salones / Áreas" 
            subtitle="Crea entornos para organizar tus mesas (ej. Terraza, VIP)."
            onClose={() => setIsAreaModalOpen(false)} 
          />
          <div className="p-7 space-y-6">
            <form onSubmit={handleCreateArea} className="flex gap-2">
              <div className="flex-1">
                <TextInput 
                  placeholder="Nuevo salón (ej. Terraza)"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                />
              </div>
              <PrimaryButton type="submit" disabled={isSubmittingArea}>
                {isSubmittingArea ? '...' : 'Añadir'}
              </PrimaryButton>
            </form>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {areas.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-4 italic">No hay salones creados.</p>
              ) : areas.map(area => (
                <div key={area.id} className="flex flex-col gap-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{area.name}</span>
                    <button onClick={() => handleDeleteArea(area.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                  {isAllLocations && area.locations?.name && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <MapPin size={10} className="text-gray-300" />
                      {area.locations.name}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2">
              <SecondaryButton onClick={() => setIsAreaModalOpen(false)} className="w-full justify-center">
                Listo
              </SecondaryButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
