import React from 'react';
import { QRCode } from 'react-qr-code';
import { Modal, ModalHeader, PrimaryButton } from '../ui';
import { Printer } from 'lucide-react';

export default function PrintSheetModal({
  isPrintSheetOpen,
  setIsPrintSheetOpen,
  tables = [],
  getTableUrl,
  activeBrand
}) {
  if (!isPrintSheetOpen) return null;

  return (
    <Modal onClose={() => setIsPrintSheetOpen(false)}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          #printable-qr-sheet, #printable-qr-sheet * { visibility: visible !important; }
          #printable-qr-sheet { position: absolute; left: 0; top: 0; width: 100%; display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 24px !important; padding: 20px !important; }
        }
      `}} />
      <ModalHeader 
        title="Plantilla Imprimible de Mesas" 
        onClose={() => setIsPrintSheetOpen(false)} 
      />
      <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
          <div>
            <h4 className="text-sm font-bold text-emerald-950">Tarjetas listas para imprimir y colocar en tus mesas</h4>
            <p className="text-xs text-emerald-700">Imprime en papel o cartulina para recortar. Cada código abre la carta asignando la comanda a su mesa.</p>
          </div>
          <PrimaryButton onClick={() => window.print()} className="gap-2 px-5 py-2.5 shadow-md whitespace-nowrap cursor-pointer">
            <Printer size={16} />
            Imprimir Hoja
          </PrimaryButton>
        </div>

        <div id="printable-qr-sheet" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {tables.map(table => (
            <div key={table.id} className="p-5 bg-white border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center text-center space-y-2.5 break-inside-avoid">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#2f4131] bg-[#2f4131]/5 px-2.5 py-0.5 rounded-full">
                {activeBrand?.name || 'Menú Digital'}
              </span>
              <div className="text-xl font-black text-gray-900 tracking-tight">{table.table_number}</div>
              <div className="p-2.5 bg-white rounded-xl shadow-xs border border-gray-100">
                <QRCode value={getTableUrl(table)} size={130} level="M" />
              </div>
              <p className="text-[10px] text-gray-500 font-medium">Escanea aquí con tu celular para ver la carta y pedir</p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
