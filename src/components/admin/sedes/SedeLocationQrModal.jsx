import React from 'react';
import { QRCode } from 'react-qr-code';
import { Modal, ModalHeader, PrimaryButton, SecondaryButton } from '../ui';

export default function SedeLocationQrModal({
  qrLocation,
  setQrLocation,
  getLocationUrl,
  handleDownloadLocationQr,
  handleCopyLocationUrl
}) {
  if (!qrLocation) return null;

  return (
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
  );
}
