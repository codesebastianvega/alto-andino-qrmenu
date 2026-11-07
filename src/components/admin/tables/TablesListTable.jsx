import React from 'react';
import { TableContainer, Th, Badge } from '../ui';
import { Table, MapPin, Layers, QrCode, Edit3, Trash2, Sparkles, Loader2 } from 'lucide-react';

export default function TablesListTable({
  tables = [],
  tableMetrics = {},
  isAllLocations = false,
  isBulkCreating = false,
  handleBulkCreateTables,
  toggleTableActive,
  openQr,
  openEdit,
  handleDeleteTable
}) {
  return (
    <TableContainer>
      <table className="w-full min-w-[600px] border-collapse">
        <thead>
          <tr>
            <Th>Identificador</Th>
            <Th>Salón / Entorno</Th>
            <Th>Métricas del QR (En Vivo)</Th>
            <Th>Estado</Th>
            <Th right>Acciones</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {tables.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 sm:p-12 text-center bg-gradient-to-b from-gray-50/80 to-white rounded-3xl border border-dashed border-gray-200">
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
          ) : tables.map((table) => {
            const m = tableMetrics[table.id] || { scans: 0, orders: 0, revenue: 0, conversionRate: 0 };
            const hasActivity = m.scans > 0 || m.orders > 0;

            return (
              <tr key={table.id} className="group hover:bg-gray-50/60 transition-all duration-300">
                <td className="px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#2f4131] group-hover:bg-[#2f4131] group-hover:text-white group-hover:border-[#2f4131] group-hover:shadow-[0_8px_16px_-4px_rgba(47,65,49,0.2)] transition-all duration-500">
                      <Table size={20} className={table.is_active ? "" : "opacity-30"} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-gray-900 text-base tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                        {table.table_number}
                      </div>
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
                {/* Métricas en Vivo de la Mesa / QR */}
                <td className="px-6 py-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                        m.scans > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60' : 'bg-gray-100 text-gray-500'
                      }`} title="Dispositivos distintos que han abierto este QR">
                        <span>📱</span>
                        <span>{m.scans} {m.scans === 1 ? 'escaneo' : 'escaneos'}</span>
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                        m.orders > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs' : 'bg-gray-100 text-gray-400'
                      }`} title="Pedidos generados">
                        <span>🛍️</span>
                        <span>{m.orders} {m.orders === 1 ? 'pedido' : 'pedidos'}</span>
                      </span>
                    </div>
                    {hasActivity ? (
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium pt-0.5">
                        <span className="font-black text-emerald-800">${Number(m.revenue).toLocaleString('es-CO')} COP</span>
                        <span>•</span>
                        <span className="font-bold text-gray-400">{m.conversionRate}% éxito</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Listo para escanear</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-6">
                  <button onClick={() => toggleTableActive(table)} className="active:scale-95 transition-transform cursor-pointer">
                    <Badge variant={table.is_active ? 'green' : 'gray'}>
                      {table.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </button>
                </td>
                <td className="px-6 py-6 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button 
                      onClick={() => openQr(table)}
                      className="p-2.5 text-indigo-600 hover:bg-white hover:shadow-md hover:border-indigo-100 rounded-2xl transition-all border border-transparent flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider cursor-pointer"
                    >
                      <QrCode size={18} />
                      <span className="hidden sm:inline">QR</span>
                    </button>
                    <div className="w-px h-6 bg-gray-100 mx-1" />
                    <button 
                      onClick={() => openEdit(table)}
                      className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-white hover:shadow-md hover:border-gray-200 rounded-2xl transition-all border border-transparent cursor-pointer"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteTable(table.id)}
                      className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50/50 rounded-2xl transition-all border border-transparent cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableContainer>
  );
}
