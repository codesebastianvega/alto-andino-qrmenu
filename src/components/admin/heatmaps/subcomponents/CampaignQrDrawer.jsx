import { QRCode } from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Download } from 'lucide-react';

const CAMPAIGN_PRESETS = [
  { id: 'whatsapp', label: '💬 WhatsApp' },
  { id: 'instagram_bio', label: '📸 Instagram' },
  { id: 'facebook', label: '👥 Facebook Ads' },
  { id: 'tiktok', label: '🎵 TikTok' },
  { id: 'volante_calle', label: '📄 Volante' },
  { id: 'qr_mesa', label: '🍽️ Mesa QR' },
  { id: 'custom', label: '✨ Otra Campaña' },
];

export default function CampaignQrDrawer({
  show,
  selectedChannel,
  setSelectedChannel,
  customCampaignName,
  setCustomCampaignName,
  generatedCampaignUrl,
  copiedLink,
  handleCopyLink,
  handleDownloadQrPng,
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#2f4131]" />
                Generador Rápido de QR para Volantes & Redes (Atribución)
              </h3>
              <span className="text-[11px] text-gray-400">Ligado a tu módulo de mesas</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              <div className="md:col-span-8 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {CAMPAIGN_PRESETS.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChannel(ch.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        selectedChannel === ch.id
                          ? 'bg-[#2f4131] text-white border-[#2f4131]'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>

                {selectedChannel === 'custom' && (
                  <div className="space-y-1 animate-fade-in">
                    <input
                      type="text"
                      placeholder="Escribe el nombre de tu campaña (ej: promo_almuerzo, volante_oficinas, influencer_juan)"
                      value={customCampaignName}
                      onChange={(e) => setCustomCampaignName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-amber-300 bg-amber-50/30 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-medium"
                    />
                    <p className="text-[11px] text-amber-800">
                      💡 Este nombre aparecerá directamente en tu tablero de atribución con sus
                      visitas y ventas separadas.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <code className="text-[11px] text-gray-700 font-mono flex-1 truncate">
                    {generatedCampaignUrl}
                  </code>
                  <button
                    onClick={handleCopyLink}
                    className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100"
                  >
                    {copiedLink ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="md:col-span-4 flex items-center justify-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div className="bg-white p-2 rounded-lg border border-gray-200 shrink-0">
                  <QRCode
                    id="campaign-qr-svg-mini"
                    value={generatedCampaignUrl}
                    size={80}
                    level="M"
                  />
                </div>
                <button
                  onClick={handleDownloadQrPng}
                  className="px-3 py-2 rounded-xl bg-[#2f4131] text-white font-bold text-xs hover:bg-[#253527] transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PNG</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
