import React from 'react';
import { QRCode } from 'react-qr-code';
import { Modal, ModalHeader, PrimaryButton, SecondaryButton } from '../ui';
import { toast as toastFn } from '../../Toast';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

export default function CampaignQrModal({
  isCampaignQrModalOpen,
  setIsCampaignQrModalOpen,
  campaignChannel,
  setCampaignChannel,
  campaignCustomName,
  setCampaignCustomName,
  activeBrand
}) {
  if (!isCampaignQrModalOpen) return null;

  const finalChannel = campaignChannel === 'custom' 
    ? (campaignCustomName.trim().toLowerCase().replace(/\s+/g, '_') || 'campana_especial')
    : campaignChannel;
  const campaignUrl = `${window.location.origin}/${activeBrand?.slug || 'boku-bento'}/?src=${encodeURIComponent(finalChannel)}`;

  const handleDownloadCampaignQr = () => {
    const svg = document.getElementById('tables-campaign-qr');
    if (!svg) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      canvas.width = 500;
      canvas.height = 580;
      img.onload = () => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 400, 400);
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 20px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(activeBrand?.name || 'Menú Digital', 250, 490);
        ctx.fillStyle = '#6B7280';
        ctx.font = 'normal 15px system-ui';
        ctx.fillText(`Campaña: ${finalChannel}`, 250, 520);
        const link = document.createElement('a');
        link.download = `QR_${activeBrand?.slug || 'menu'}_${finalChannel}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('QR descargado');
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch {
      toast.error('Error al descargar QR');
    }
  };

  return (
    <Modal onClose={() => setIsCampaignQrModalOpen(false)}>
      <ModalHeader 
        title="Generador de QRs para Volantes & Campañas" 
        onClose={() => setIsCampaignQrModalOpen(false)} 
      />
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">Atribución Inteligente de Ventas</h4>
          <p className="text-xs text-amber-900/80 leading-relaxed">
            Genera QRs especiales para imprimir en volantes callejeros, stickers de empaque o links de Instagram. Aluna y Clarity medirán cuántas personas escanean cada uno y cuánto dinero te generaron.
          </p>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
            Selecciona el Tipo de Campaña:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'volante_calle', label: '📄 Volante Calle' },
              { id: 'instagram_bio', label: '📸 Instagram Bio' },
              { id: 'whatsapp', label: '💬 WhatsApp' },
              { id: 'empaque_delivery', label: '🛍️ Empaque' },
              { id: 'custom', label: '✨ Personalizado' }
            ].map(ch => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setCampaignChannel(ch.id)}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left cursor-pointer ${
                  campaignChannel === ch.id 
                    ? 'bg-[#2f4131] text-white border-[#2f4131]' 
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>

          {campaignChannel === 'custom' && (
            <input
              type="text"
              placeholder="Nombre de campaña (ej: volante_octubre)"
              value={campaignCustomName}
              onChange={(e) => setCampaignCustomName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-hidden"
            />
          )}

          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs shrink-0">
              <QRCode id="tables-campaign-qr" value={campaignUrl} size={130} level="H" />
            </div>
            <div className="space-y-3 flex-1 w-full">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Enlace con Atribución:</span>
                <code className="block text-xs font-mono text-gray-800 break-all bg-white p-2 rounded-lg border border-gray-200">
                  {campaignUrl}
                </code>
              </div>
              <div className="flex gap-2">
                <PrimaryButton 
                  onClick={handleDownloadCampaignQr}
                  className="text-xs py-2 px-4 flex-1 justify-center"
                >
                  Descargar PNG
                </PrimaryButton>
                <SecondaryButton 
                  onClick={() => {
                    navigator.clipboard.writeText(campaignUrl);
                    toast.success('Enlace copiado');
                  }}
                  className="text-xs py-2 px-4 flex-1 justify-center"
                >
                  Copiar Enlace
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
