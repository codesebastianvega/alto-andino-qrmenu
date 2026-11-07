import React from 'react';
import { QRCode } from 'react-qr-code';
import { Plus, Download, Copy } from 'lucide-react';
import { toast as toastFn } from '../../Toast';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

const MARKETING_CHANNELS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Directo',
    icon: '💬',
    channel: 'whatsapp',
    desc: 'Para estados de WhatsApp o mensajes a clientes',
    gradient: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-200 hover:border-emerald-500'
  },
  {
    id: 'instagram_bio',
    name: 'Instagram Bio / Historias',
    icon: '📸',
    channel: 'instagram_bio',
    desc: 'Para el enlace de tu perfil de Instagram o historias',
    gradient: 'from-[#833AB4] via-[#FD1D1D] to-[#FCB045]',
    border: 'border-pink-200 hover:border-pink-500'
  },
  {
    id: 'facebook',
    name: 'Facebook Ads / Página',
    icon: '📘',
    channel: 'facebook',
    desc: 'Para anuncios pagados o botón de tu Fanpage',
    gradient: 'from-[#1877F2] to-[#0A54BD]',
    border: 'border-blue-200 hover:border-blue-500'
  },
  {
    id: 'tiktok',
    name: 'TikTok Bio',
    icon: '🎵',
    channel: 'tiktok',
    desc: 'Para tu biografía o videos de TikTok',
    gradient: 'from-gray-900 via-neutral-800 to-black',
    border: 'border-neutral-300 hover:border-neutral-900'
  },
  {
    id: 'volante_calle',
    name: 'Volantes Calle / Flyers',
    icon: '📄',
    channel: 'volante_calle',
    desc: 'Para volantes impresos a repartir en la calle',
    gradient: 'from-amber-500 to-orange-600',
    border: 'border-amber-200 hover:border-amber-500'
  },
  {
    id: 'empaque_delivery',
    name: 'Stickers de Empaque',
    icon: '🛍️',
    channel: 'empaque_delivery',
    desc: 'Para pegar en las bolsas o cajas de comida',
    gradient: 'from-rose-500 to-pink-600',
    border: 'border-rose-200 hover:border-rose-500'
  }
];

export default function MarketingCampaignQrsTab({
  activeBrand,
  marketingMetrics = {},
  setIsCampaignQrModalOpen,
  handleDownloadAnyQr
}) {
  return (
    <div className="space-y-6">
      {/* Banner Explicativo */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-5 rounded-3xl border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚀</span>
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950">
              QRs y Enlaces de Campaña para Domicilios
            </h3>
          </div>
          <p className="text-xs text-emerald-900/80 leading-relaxed max-w-2xl">
            A diferencia de las mesas físicas, estos QRs y enlaces están optimizados para poner en tus <strong>redes sociales, volantes o chats de WhatsApp</strong>. Abren el menú en modo Domicilio / Para Llevar y miden exactamente cuántas ventas te genera cada canal.
          </p>
        </div>
        <button
          onClick={() => setIsCampaignQrModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#2f4131] hover:bg-[#253527] text-white text-xs font-bold transition-all shadow-md shadow-[#2f4131]/20 shrink-0 flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          <span>+ Campaña Personalizada</span>
        </button>
      </div>

      {/* Grid de Canales Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MARKETING_CHANNELS.map(ch => {
          const chUrl = `${window.location.origin}/${activeBrand?.slug || 'boku-bento'}/?src=${encodeURIComponent(ch.channel)}`;
          const m = marketingMetrics[ch.channel] || { scans: 0, orders: 0, revenue: 0, conversionRate: 0 };
          const qrId = `marketing-card-qr-${ch.id}`;

          return (
            <div 
              key={ch.id} 
              className={`bg-white rounded-3xl p-5 border shadow-sm transition-all duration-200 space-y-4 relative overflow-hidden flex flex-col justify-between ${ch.border}`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${ch.gradient}`} />

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{ch.icon}</span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-gray-900">{ch.name}</h4>
                      <p className="text-[10px] text-gray-400">{ch.desc}</p>
                    </div>
                  </div>
                </div>

                {/* QR Preview Center */}
                <div className="p-3 bg-gray-50/70 rounded-2xl border border-gray-100 flex items-center justify-center">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                    <QRCode
                      id={qrId}
                      value={chUrl}
                      size={130}
                      level="M"
                    />
                  </div>
                </div>

                {/* Métricas del canal */}
                <div className="grid grid-cols-3 gap-1.5 text-center bg-gray-50/80 p-2 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Escaneos</p>
                    <p className="text-xs font-black text-gray-900">{m.scans}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Pedidos</p>
                    <p className="text-xs font-black text-emerald-700">{m.orders}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Ventas</p>
                    <p className="text-xs font-black text-gray-900">${Number(m.revenue).toLocaleString('es-CO')}</p>
                  </div>
                </div>

                {/* Enlace limpio */}
                <div className="space-y-1">
                  <code className="block text-[10px] font-mono text-gray-700 bg-gray-50 border border-gray-200 p-2 rounded-lg truncate select-all" title={chUrl}>
                    {chUrl}
                  </code>
                </div>
              </div>

              {/* Acciones del QR */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleDownloadAnyQr(qrId, `QR_${activeBrand?.slug || 'menu'}_${ch.channel}`, activeBrand?.name, `Campaña: ${ch.name}`)}
                  className="py-2 px-3 rounded-xl bg-[#2f4131] hover:bg-[#253527] text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Descargar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(chUrl);
                    toast.success(`Enlace de ${ch.name} copiado`);
                  }}
                  className="py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy size={14} />
                  <span>Copiar Link</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
