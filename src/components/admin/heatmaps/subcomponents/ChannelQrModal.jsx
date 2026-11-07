import { QRCode } from 'react-qr-code';
import { X, Download, Copy } from 'lucide-react';
import { toast } from '../../../Toast';
import { CHANNEL_STYLES } from '../helpers/heatmapsHelpers';

export default function ChannelQrModal({
  channel,
  onClose,
  baseUrl,
  brandSlug,
  brandName,
  handleDownloadChannelQr,
}) {
  if (!channel) return null;

  const style = CHANNEL_STYLES[channel.key] || CHANNEL_STYLES.default;
  const modalUrl = `${baseUrl}/${brandSlug}/?src=${encodeURIComponent(channel.key)}`;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200 overflow-hidden relative">
        {/* Top gradient bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${style.topBar}`}
        />

        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{channel.icon || '🎯'}</span>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                {channel.name}
              </h3>
              <p className="text-[11px] text-gray-400">Código QR y Enlace de Campaña</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Center Box */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-xs flex flex-col items-center">
            <QRCode
              id={`channel-modal-qr-svg-${channel.key}`}
              value={modalUrl}
              size={180}
              level="H"
            />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">
              {brandName || 'Boku Bento'} • {channel.name}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => handleDownloadChannelQr(channel, modalUrl)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#2f4131] hover:bg-[#253527] text-white text-xs font-bold transition-all shadow-md shadow-[#2f4131]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Imagen PNG</span>
            </button>
          </div>

          {/* Clean URL copiable */}
          <div className="space-y-1.5 w-full text-left">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Enlace Directo para Redes (Limpio & Corto)
            </label>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl p-1.5">
              <input
                readOnly
                value={modalUrl}
                className="w-full bg-transparent px-2 text-xs font-mono text-gray-800 focus:outline-hidden select-all"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(modalUrl);
                  toast.success(`Enlace de ${channel.name} copiado`);
                }}
                className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Copy className="w-3 h-3" />
                <span>Copiar</span>
              </button>
            </div>
          </div>

          {/* Métricas en vivo del canal */}
          <div className="grid grid-cols-3 gap-2 w-full pt-1">
            <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 text-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Escaneos</p>
              <p className="text-base font-black text-gray-900">{channel.visits}</p>
            </div>
            <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 text-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Pedidos</p>
              <p className="text-base font-black text-emerald-700">{channel.orders}</p>
            </div>
            <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 text-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Conversión</p>
              <p className="text-base font-black text-indigo-600">
                {channel.visits > 0
                  ? `${Math.round((channel.orders / channel.visits) * 100)}%`
                  : '0%'}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 bg-amber-50/60 border border-amber-200/50 p-2.5 rounded-xl text-center leading-relaxed">
            💡 Al escanear este QR o abrir este link, el cliente entra al menú para{' '}
            <strong>Domicilio o Para Llevar</strong> y el sistema sabe automáticamente que vino de{' '}
            <strong>{channel.name}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
