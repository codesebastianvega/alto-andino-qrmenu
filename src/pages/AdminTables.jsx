import { useState, useEffect } from 'react';
import QRCode from "react-qr-code";
import { supabase } from '../config/supabase';
import { toast as toastFn } from '../components/Toast';
import {
  PageHeader, PrimaryButton, SecondaryButton, Badge,
  TableContainer, Th, Modal, ModalHeader, FormField, TextInput
} from '../components/admin/ui';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableForm, setTableForm] = useState({ table_number: '' });
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  // QR Modal
  const [qrTable, setQrTable] = useState(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      const { data, error } = await supabase.from('restaurant_tables').select('*').order('table_number');
      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar mesas');
    } finally {
      setLoadingTables(false);
    }
  };

  const openCreate = () => {
    setEditingTable(null);
    setTableForm({ table_number: '' });
    setIsFormOpen(true);
  };

  const openEdit = (table) => {
    setEditingTable(table);
    setTableForm({ table_number: table.table_number });
    setIsFormOpen(true);
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    if (!tableForm.table_number) return toast.error('Ingresa el identificador de la mesa');

    setIsSubmittingTable(true);
    try {
      if (editingTable) {
        const { error } = await supabase.from('restaurant_tables')
          .update({ table_number: tableForm.table_number, updated_at: new Date() })
          .eq('id', editingTable.id);
        if (error) throw error;
        toast.success('Mesa actualizada');
      } else {
        const { error } = await supabase.from('restaurant_tables')
          .insert([{ table_number: tableForm.table_number }]);
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
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        badge="Negocio"
        title="Gestión de Mesas"
        subtitle="Define las mesas físicas del local para tomar pedidos a ellas y generar códigos QR."
      >
        <PrimaryButton onClick={openCreate}>+ Nueva mesa</PrimaryButton>
      </PageHeader>

      <TableContainer>
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              <Th>Identificador</Th>
              <Th>Estado</Th>
              <Th right>Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tables.length === 0 ? (
              <tr><td colSpan={3} className="px-5 py-14 text-center text-sm text-gray-400 font-medium">No hay mesas configuradas.</td></tr>
            ) : tables.map((table) => (
              <tr key={table.id} className="group hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-gray-900">{table.table_number}</div>
                </td>
                <td className="px-5 py-3.5">
                  <button onClick={() => toggleTableActive(table)}>
                    <Badge variant={table.is_active ? 'green' : 'gray'}>
                      {table.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </button>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setQrTable(table)}
                      className="px-3 py-1.5 text-[12px] font-semibold text-purple-600 hover:bg-purple-50 rounded-lg transition-all">
                      Ver QR
                    </button>
                    <button onClick={() => openEdit(table)}
                      className="px-3 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      Editar
                    </button>
                    <button onClick={() => handleDeleteTable(table.id)}
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
    </div>
  );
}
