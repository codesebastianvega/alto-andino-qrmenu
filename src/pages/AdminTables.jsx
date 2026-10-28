import { useState, useEffect } from 'react';
import { QRCode } from "react-qr-code";
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import { useLocations } from '../context/LocationContext';
import { useAdminModalBack } from '../hooks/useAdminModalBack';
import { toast as toastFn } from '../components/Toast';
import {
  PageHeader, PrimaryButton, SecondaryButton, Badge,
  TableContainer, Th, Modal, ModalHeader, FormField, TextInput, SelectInput
} from '../components/admin/ui';

import { 
  Plus, LayoutGrid, MapPin, QrCode, Edit3, Trash2, Sparkles, Loader2, 
  ChevronRight, Layers, Table, ExternalLink
} from 'lucide-react';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

export default function AdminTables({ isEmbedded = false }) {
  const { profile, activeBrand } = useAuth();
  const { brand: brandFromContext } = useBrand();
  const { activeLocationId, isAllLocations, locations } = useLocations();
  const brandId = activeBrand?.id || brandFromContext?.id || profile?.brand_id || localStorage.getItem('aa_active_brand_id');
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableForm, setTableForm] = useState({ table_number: '', area_id: '' });
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);
  const [modalTab, setModalTab] = useState('datos');

  // Areas Management
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);

  useAdminModalBack(isFormOpen, () => setIsFormOpen(false));
  useAdminModalBack(isAreaModalOpen, () => setIsAreaModalOpen(false));
  const [newAreaName, setNewAreaName] = useState('');
  const [isSubmittingArea, setIsSubmittingArea] = useState(false);
  const [isBulkCreating, setIsBulkCreating] = useState(false);

  const handleBulkCreateTables = async (customCount) => {
    const inputCount = customCount || parseInt(document.getElementById('bulk-table-count')?.value || '6', 10);
    const count = Math.min(Math.max(1, isNaN(inputCount) ? 6 : inputCount), 50);

    setIsBulkCreating(true);
    try {
      let targetLocId = (!isAllLocations && activeLocationId && activeLocationId !== 'all')
        ? activeLocationId
        : (locations?.find(l => l.is_main)?.id || locations?.[0]?.id);

      if (!targetLocId) {
        const { data: dbLocs } = await supabase.from('locations').select('id').eq('brand_id', brandId).limit(1);
        if (dbLocs && dbLocs.length > 0) {
          targetLocId = dbLocs[0].id;
        } else {
          const { data: newLoc } = await supabase.from('locations').insert([{
            brand_id: brandId,
            name: 'Sede Principal',
            is_main: true,
            is_active: true,
            operational_modes: ['dine_in', 'takeaway', 'delivery']
          }]).select().single();
          targetLocId = newLoc?.id;
        }
      }

      if (!targetLocId) {
        toast.error('No se pudo determinar la sede para las mesas');
        return;
      }

      const existingNumbers = new Set(tables.map(t => t.table_number.toLowerCase().trim()));
      const newRows = [];
      let num = 1;
      while (newRows.length < count && num <= 100) {
        const name = `Mesa ${num}`;
        if (!existingNumbers.has(name.toLowerCase())) {
          newRows.push({
            table_number: name,
            brand_id: brandId,
            location_id: targetLocId,
            is_active: true
          });
        }
        num++;
      }

      if (newRows.length === 0) {
        toast.error('Ya existen mesas con esos identificadores');
        return;
      }

      const { error } = await supabase.from('restaurant_tables').insert(newRows);
      if (error) throw error;

      toast.success(`¡${newRows.length} mesas creadas al instante!`);
      fetchTables();
    } catch (err) {
      console.error('Error in bulk table creation:', err);
      toast.error('Error al generar mesas en lote');
    } finally {
      setIsBulkCreating(false);
    }
  };

  useEffect(() => {
    if (brandId) {
      fetchTables();
      fetchAreas();
    }
  }, [brandId, activeLocationId, isAllLocations]);

  const fetchAreas = async () => {
    setLoadingAreas(true);
    try {
      let query = supabase
        .from('table_areas')
        .select('*, locations(name)')
        .eq('brand_id', brandId)
        .order('sort_order', { ascending: true });

      if (!isAllLocations && activeLocationId) {
        query = query.or(`location_id.eq.${activeLocationId},location_id.is.null`);
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
        .eq('brand_id', brandId)
        .order('table_number');
      
      if (!isAllLocations && activeLocationId) {
        query = query.or(`location_id.eq.${activeLocationId},location_id.is.null`);
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

    let targetLocationId = (!isAllLocations && activeLocationId && activeLocationId !== 'all')
      ? activeLocationId
      : (tableForm.location_id || locations?.find(l => l.is_main)?.id || locations?.[0]?.id);

    if (!targetLocationId) {
      try {
        const { data: dbLocs } = await supabase.from('locations').select('id').eq('brand_id', brandId).limit(1);
        if (dbLocs && dbLocs.length > 0) {
          targetLocationId = dbLocs[0].id;
        } else {
          const { data: newLoc } = await supabase.from('locations').insert([{
            brand_id: brandId,
            name: 'Sede Principal',
            is_main: true,
            is_active: true,
            operational_modes: ['dine_in', 'takeaway', 'delivery']
          }]).select().single();
          targetLocationId = newLoc?.id;
        }
      } catch (errLoc) {
        console.error('Error auto-creating location for area:', errLoc);
      }
    }

    if (!targetLocationId) {
      return toast.error('Por favor crea primero una sede en la sección de Sedes');
    }

    setIsSubmittingArea(true);
    try {
      const { error } = await supabase.from('table_areas').insert([{
        name: newAreaName.trim(),
        brand_id: brandId,
        location_id: targetLocationId,
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
    setEditingTable(null);
    const defaultLocationId = (!isAllLocations && activeLocationId && activeLocationId !== 'all')
      ? activeLocationId
      : (locations?.find(l => l.is_main)?.id || locations?.[0]?.id || '');
    setTableForm({ 
      table_number: '', 
      area_id: '',
      location_id: defaultLocationId 
    });
    setModalTab('datos');
    setIsFormOpen(true);
  };

  const openEdit = (table) => {
    setEditingTable(table);
    setTableForm({ 
      table_number: table.table_number,
      area_id: table.area_id || ''
    });
    setModalTab('datos');
    setIsFormOpen(true);
  };

  const openQr = (table) => {
    setEditingTable(table);
    setTableForm({ 
      table_number: table.table_number,
      area_id: table.area_id || ''
    });
    setModalTab('qr');
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
        let effectiveLocationId = (!isAllLocations && activeLocationId && activeLocationId !== 'all')
          ? activeLocationId
          : (tableForm.location_id || locations?.find(l => l.is_main)?.id || locations?.[0]?.id);

        if (!effectiveLocationId) {
          try {
            const { data: dbLocs } = await supabase.from('locations').select('id').eq('brand_id', brandId).limit(1);
            if (dbLocs && dbLocs.length > 0) {
              effectiveLocationId = dbLocs[0].id;
            } else {
              const { data: newLoc } = await supabase.from('locations').insert([{
                brand_id: brandId,
                name: 'Sede Principal',
                is_main: true,
                is_active: true,
                operational_modes: ['dine_in', 'takeaway', 'delivery']
              }]).select().single();
              effectiveLocationId = newLoc?.id;
            }
          } catch (errLoc) {
            console.error('Error auto-creating location for table:', errLoc);
          }
        }

        if (!effectiveLocationId) {
          toast.error('Por favor crea primero una sede en la sección de Sedes');
          setIsSubmittingTable(false);
          return;
        }

        const { error } = await supabase.from('restaurant_tables')
          .insert([{ 
            table_number: tableForm.table_number,
            area_id: tableForm.area_id || null,
            brand_id: brandId,
            location_id: effectiveLocationId
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
    const slug = activeBrand?.slug;
    const baseUrl = window.location.origin;
    return slug 
      ? `${baseUrl}/${slug}/?mesa=${encodeURIComponent(table.table_number)}&loc=${table.location_id}`
      : `${baseUrl}?mesa=${encodeURIComponent(table.table_number)}&loc=${table.location_id}`;
  };

  const handleCopyUrl = (table) => {
    navigator.clipboard.writeText(getTableUrl(table));
    toast.success('Enlace copiado al portapapeles');
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById(`qr-code-${editingTable.id}`);
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
      downloadLink.download = `QR_Mesa_${editingTable.table_number}.png`;
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
              <tr>
                <td colSpan={4} className="p-8 sm:p-12 text-center bg-gradient-to-b from-gray-50/80 to-white rounded-3xl border border-dashed border-gray-200">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#2f4131] text-white flex items-center justify-center shadow-lg shadow-[#2f4131]/20">
                      <Table size={28} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">¿Cuántas mesas tienes en tu local?</h4>
                      <p className="text-xs text-gray-500 mt-1">Generaremos tus códigos QR individuales listos para descargar e imprimir con un solo clic.</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <input 
                        type="number" 
                        min="1" 
                        max="50" 
                        defaultValue="6"
                        id="bulk-table-count"
                        className="w-20 px-3 py-2 text-center text-sm font-bold bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2f4131] outline-none"
                      />
                      <button
                        onClick={() => handleBulkCreateTables()}
                        disabled={isBulkCreating}
                        className="px-5 py-2.5 text-xs font-bold bg-[#2f4131] hover:bg-[#243326] text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isBulkCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                        <span>Crear Mesas al Instante</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : tables.map((table) => (
              <tr key={table.id} className="group hover:bg-gray-50/60 transition-all duration-300">
                <td className="px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#2f4131] group-hover:bg-[#2f4131] group-hover:text-white group-hover:border-[#2f4131] group-hover:shadow-[0_8px_16px_-4px_rgba(47,65,49,0.2)] transition-all duration-500">
                       <Table size={20} className={table.is_active ? "" : "opacity-30"} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-gray-900 text-base tracking-tight group-hover:translate-x-1 transition-transform duration-300">{table.table_number}</div>
                      {isAllLocations && table.locations?.name && (
                        <div className="flex items-center gap-1.5 py-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2f4131]/5 text-[#2f4131] text-[9px] font-black uppercase tracking-wider border border-[#2f4131]/10">
                            <MapPin size={8} />
                            {table.locations.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
                      table.table_areas?.name 
                        ? 'bg-indigo-50/50 border-indigo-100 text-indigo-600' 
                        : 'bg-gray-50 border-gray-100 text-gray-400 italic font-medium lowercase tracking-normal'
                    }`}>
                      {table.table_areas?.name ? (
                        <>
                          <Layers size={10} className="mr-1.5" />
                          {table.table_areas.name}
                        </>
                      ) : 'sin salón'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <button onClick={() => toggleTableActive(table)} className="active:scale-95 transition-transform">
                    <Badge variant={table.is_active ? 'green' : 'gray'}>
                      {table.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </button>
                </td>
                <td className="px-6 py-6 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button onClick={() => openQr(table)}
                      className="p-2.5 text-indigo-600 hover:bg-white hover:shadow-md hover:border-indigo-100 rounded-2xl transition-all border border-transparent flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider">
                      <QrCode size={18} />
                      <span className="hidden sm:inline">QR</span>
                    </button>
                    <div className="w-px h-6 bg-gray-100 mx-1" />
                    <button onClick={() => openEdit(table)}
                      className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-white hover:shadow-md hover:border-gray-200 rounded-2xl transition-all border border-transparent flex items-center gap-1.5">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => handleDeleteTable(table.id)}
                      className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50/50 rounded-2xl transition-all border border-transparent">
                      <Trash2 size={18} />
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
            title={editingTable ? `Gestionar Mesa — ${editingTable.table_number}` : 'Nueva Mesa'} 
            subtitle={editingTable ? 'Edita la configuración o descarga el código QR de esta mesa.' : 'Identifica la mesa para luego vincularla a un código QR.'}
            onClose={() => setIsFormOpen(false)} 
          />

          {/* Tabs — solo visibles en modo edición */}
          {editingTable && (
            <div className="flex px-7 gap-1 border-b border-gray-100 bg-gray-50/50">
              {[
                { id: 'datos', label: 'Datos', icon: <Edit3 size={14} /> },
                { id: 'qr', label: 'QR & Enlace', icon: <QrCode size={14} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${
                    modalTab === tab.id 
                      ? 'border-[#2f4131] text-[#2f4131]' 
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Tab: Datos */}
          {(modalTab === 'datos' || !editingTable) && (
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

                {isAllLocations && !editingTable && locations.length > 1 && (
                  <FormField label="Sede">
                    <SelectInput
                      value={tableForm.location_id || ''}
                      onChange={(e) => setTableForm({ ...tableForm, location_id: e.target.value, area_id: '' })}
                      required
                    >
                      <option value="" disabled>Seleccionar Sede...</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </SelectInput>
                  </FormField>
                )}

                <FormField label="Salón / Entorno">
                  <SelectInput
                    value={tableForm.area_id}
                    onChange={(e) => setTableForm({ ...tableForm, area_id: e.target.value })}
                  >
                    <option value="">Sin salón específico</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>
                        {area.name} {isAllLocations && area.locations?.name ? `(${area.locations.name})` : ''}
                      </option>
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
          )}

          {/* Tab: QR & Enlace */}
          {modalTab === 'qr' && editingTable && (
            <div className="p-7 flex flex-col items-center justify-center space-y-6">
              {/* Sede info */}
              {editingTable.locations?.name && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <MapPin size={12} />
                  {editingTable.locations.name}
                </div>
              )}

              {/* QR Code */}
              <div className="bg-white p-5 rounded-2xl shadow-lg shadow-gray-100 border border-gray-100">
                <QRCode 
                  id={`qr-code-${editingTable.id}`}
                  value={getTableUrl(editingTable)} 
                  size={220}
                  level="H"
                  className="w-full h-auto"
                />
              </div>

              {/* URL preview */}
              <div className="w-full max-w-sm bg-gray-50 rounded-xl border border-gray-100 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Enlace del Menú</p>
                <p className="text-[11px] font-mono text-gray-600 break-all leading-relaxed select-all">{getTableUrl(editingTable)}</p>
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-col gap-3 w-full max-w-sm">
                {/* Ver Menú — abre en nueva pestaña */}
                <a 
                  href={getTableUrl(editingTable)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full px-6 py-3.5 bg-[#2f4131] text-white rounded-xl font-bold text-[12px] uppercase tracking-widest shadow-lg shadow-[#2f4131]/20 hover:bg-[#3d5440] hover:shadow-xl active:scale-[0.98] transition-all"
                >
                  <ExternalLink size={16} />
                  Ver Menú
                </a>

                <div className="flex gap-3">
                  <PrimaryButton onClick={handleDownloadQr} className="flex-1 justify-center text-[11px]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar QR
                  </PrimaryButton>
                  <SecondaryButton onClick={() => handleCopyUrl(editingTable)} className="flex-1 justify-center text-[11px]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Copiar URL
                  </SecondaryButton>
                </div>
              </div>
            </div>
          )}
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
            <form onSubmit={handleCreateArea} className="space-y-3">
              <div className="flex gap-2">
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
              </div>
              
              {isAllLocations && locations.length > 1 && (
                <div className="px-1">
                  <SelectInput
                    value={tableForm.location_id || ''}
                    onChange={(e) => setTableForm({ ...tableForm, location_id: e.target.value })}
                    className="text-[10px] font-bold h-9"
                    required
                  >
                    <option value="" disabled>Sede para el salón...</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </SelectInput>
                </div>
              )}
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
