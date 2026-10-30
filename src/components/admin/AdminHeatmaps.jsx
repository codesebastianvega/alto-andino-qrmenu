import React, { useState, useMemo, useRef } from 'react';
import { QRCode } from 'react-qr-code';
import { motion } from 'framer-motion';
import { 
  Flame, 
  PlayCircle, 
  QrCode, 
  Download, 
  Copy, 
  ExternalLink, 
  Smartphone, 
  Monitor, 
  ShoppingBag, 
  TrendingUp, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Users, 
  Clock, 
  ArrowUpRight,
  HelpCircle,
  Megaphone,
  Share2,
  FileText
} from 'lucide-react';
import { toast } from '../Toast';
import { CLARITY_PROJECT_IDS } from '../../hooks/useClarity';

export default function AdminHeatmaps({ 
  activeBrand, 
  orders = [], 
  events = [], 
  formatCurrency = (val) => `$${val?.toLocaleString('es-CO') || 0}` 
}) {
  const brandSlug = activeBrand?.slug || 'boku-bento';
  const clarityProjectId = activeBrand?.clarity_project_id || CLARITY_PROJECT_IDS[brandSlug] || (brandSlug === 'boku-bento' ? 'z5k4ivj9i5' : null);
  
  // Si la marca tiene ID configurado o es Boku Bento, el Addon está activo
  const isAddonActive = Boolean(clarityProjectId || activeBrand?.features?.heatmaps_enabled || brandSlug === 'boku-bento');

  // Estado del Generador de QRs de Campañas
  const [selectedChannel, setSelectedChannel] = useState('volante_calle');
  const [customCampaignName, setCustomCampaignName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const qrRef = useRef(null);

  // URL base del menú público
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aluna-qrmenu.vercel.app';
  
  const currentCampaignChannel = selectedChannel === 'custom' 
    ? (customCampaignName.trim().toLowerCase().replace(/\s+/g, '_') || 'campana_especial') 
    : selectedChannel;

  const generatedCampaignUrl = useMemo(() => {
    return `${baseUrl}/${brandSlug}/?src=${encodeURIComponent(currentCampaignChannel)}`;
  }, [baseUrl, brandSlug, currentCampaignChannel]);

  // Análisis de Atribución cruzando eventos y pedidos
  const attributionStats = useMemo(() => {
    const channelMap = {
      volante_calle: { name: 'Volantes Físicos (Calle)', icon: FileText, visits: 0, orders: 0, revenue: 0 },
      instagram_bio: { name: 'Instagram & TikTok (Bio)', icon: Share2, visits: 0, orders: 0, revenue: 0 },
      whatsapp: { name: 'WhatsApp & Estados', icon: Megaphone, visits: 0, orders: 0, revenue: 0 },
      qr_mesa: { name: 'QRs en Mesas del Local', icon: QrCode, visits: 0, orders: 0, revenue: 0 },
      direct: { name: 'Enlace Directo / Navegador', icon: ExternalLink, visits: 0, orders: 0, revenue: 0 },
      otros: { name: 'Otras Campañas / Personalizadas', icon: Sparkles, visits: 0, orders: 0, revenue: 0 },
    };

    // 1. Contar sesiones/visitas por canal desde events
    const sessionChannelMap = new Map();
    events.forEach(ev => {
      const src = ev.metadata?.source || (ev.metadata?.mesa ? 'qr_mesa' : 'direct');
      if (ev.session_id && !sessionChannelMap.has(ev.session_id)) {
        sessionChannelMap.set(ev.session_id, src);
      }
    });

    sessionChannelMap.forEach((src) => {
      if (channelMap[src]) {
        channelMap[src].visits += 1;
      } else {
        channelMap.otros.visits += 1;
      }
    });

    // 2. Cruzar pedidos por canal de origen
    orders.forEach(order => {
      const src = order.metadata?.source || (order.table_number ? 'qr_mesa' : 'direct');
      const total = Number(order.total_amount || order.total || 0);

      if (channelMap[src]) {
        channelMap[src].orders += 1;
        channelMap[src].revenue += total;
      } else {
        channelMap.otros.orders += 1;
        channelMap.otros.revenue += total;
      }
    });

    const totalVisits = Math.max(sessionChannelMap.size, 1);
    const totalOrdersCount = orders.length;

    return {
      channels: Object.entries(channelMap).map(([key, data]) => ({
        key,
        ...data,
        conversionRate: data.visits > 0 ? ((data.orders / data.visits) * 100).toFixed(1) : '0.0',
        share: ((data.visits / totalVisits) * 100).toFixed(0)
      })),
      totalVisits: sessionChannelMap.size,
      totalOrdersCount,
      globalConversion: totalVisits > 0 ? ((totalOrdersCount / totalVisits) * 100).toFixed(1) : '0.0'
    };
  }, [events, orders]);

  // Copiar enlace al portapapeles
  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(generatedCampaignUrl);
      setCopiedLink(true);
      toast.success('Enlace de campaña copiado al portapapeles');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Descargar código QR para imprenta en formato PNG de alta resolución
  const handleDownloadQrPng = () => {
    const svg = document.getElementById('campaign-qr-svg');
    if (!svg) {
      toast.error('No se pudo generar el archivo');
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      const qrSize = 600;
      const padding = 60;
      canvas.width = qrSize + (padding * 2);
      canvas.height = qrSize + (padding * 2) + 100; // espacio para label inferior

      img.onload = () => {
        // Fondo blanco nítido
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar QR
        ctx.drawImage(img, padding, padding, qrSize, qrSize);

        // Texto informativo en el pie
        ctx.fillStyle = '#1A1A1A';
        ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(activeBrand?.name || 'Menú Digital', canvas.width / 2, qrSize + padding + 40);

        ctx.fillStyle = '#6B7280';
        ctx.font = 'normal 18px system-ui, -apple-system, sans-serif';
        ctx.fillText(`Campaña: ${currentCampaignChannel}`, canvas.width / 2, qrSize + padding + 75);

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `QR_${brandSlug}_${currentCampaignChannel}.png`;
        link.href = pngUrl;
        link.click();
        toast.success('QR en alta resolución descargado');
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      console.error(e);
      toast.error('Error exportando QR');
    }
  };

  // Enlaces directos a Clarity
  const clarityBaseUrl = clarityProjectId 
    ? `https://clarity.microsoft.com/projects/view/${clarityProjectId}`
    : 'https://clarity.microsoft.com/';

  const clarityHeatmapsUrl = `${clarityBaseUrl}/heatmaps`;
  const clarityRecordingsUrl = `${clarityBaseUrl}/recordings`;
  const clarityDashboardUrl = `${clarityBaseUrl}/dashboard`;

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header & Status Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-950 to-neutral-900 p-6 md:p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-gradient-to-br from-amber-500/20 to-rose-500/20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-amber-400 text-gray-950 shadow-sm">
                <Flame className="w-3.5 h-3.5 fill-current" />
                ADDON INTELIGENCIA PRO
              </span>
              {isAddonActive ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Telemetría Activa en Producción
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Addon Opcional
                </span>
              )}
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Mapas de Calor, Grabaciones & Atribución de Tráfico
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
              Descubre exactamente cómo navegan tus comensales: dónde hacen clic con el dedo, qué platos ignoran, qué volantes callejeros generan más ventas y reproduce las grabaciones de carritos abandonados.
            </p>
          </div>

          {/* Clarity Direct Link */}
          {isAddonActive && clarityProjectId && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <a
                href={clarityDashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-gray-950 font-black text-xs uppercase tracking-wider hover:bg-gray-100 transition-all shadow-lg hover:shadow-white/10 active:scale-95"
              >
                Abrir Consola Clarity
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 2. Tarjetas de Acceso Rápido a Microsoft Clarity */}
      {isAddonActive ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card Heatmaps */}
          <motion.div
            whileHover={{ y: -3 }}
            className="group relative rounded-3xl p-6 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                <Flame className="w-6 h-6 fill-amber-500/30" />
              </div>
              <h3 className="text-base font-black text-gray-900 tracking-tight">
                Mapas de Calor (Heatmaps)
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Descubre en color rojo las zonas más tocadas de la carta y el mapa de scroll para ver cuántos comensales llegan al final del menú.
              </p>
            </div>
            <a
              href={clarityHeatmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs uppercase tracking-wider hover:bg-amber-600 transition-all shadow-sm"
            >
              <span>Ver Mapa de Calor</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Card Recordings */}
          <motion.div
            whileHover={{ y: -3 }}
            className="group relative rounded-3xl p-6 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-600 flex items-center justify-center font-bold">
                <PlayCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-gray-900 tracking-tight">
                Grabaciones en Video
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Reproduce la experiencia del comensal como un video en alta fidelidad. Mira cada toque, deslizamiento y duda en tiempo real.
              </p>
            </div>
            <a
              href={clarityRecordingsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-sm"
            >
              <span>Ver Grabaciones</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Card Abandoned Carts */}
          <motion.div
            whileHover={{ y: -3 }}
            className="group relative rounded-3xl p-6 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/20 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-gray-900 tracking-tight">
                Carritos con Prioridad VIP
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Grabaciones 100% priorizadas de comensales que agregaron platos al carrito o iniciaron el checkout para entender por qué se salieron.
              </p>
            </div>
            <a
              href={clarityRecordingsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-rose-700 transition-all shadow-sm"
            >
              <span>Filtrar Carritos</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      ) : (
        /* Teaser para marcas sin Addon */
        <div className="rounded-3xl p-8 bg-gradient-to-br from-amber-500/10 via-white to-gray-50 border border-amber-500/30 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-700 flex items-center justify-center mx-auto">
            <Flame className="w-8 h-8 fill-amber-500/30" />
          </div>
          <h2 className="text-xl font-black text-gray-900">
            ¿Quieres saber exactamente qué hacen tus clientes en tu menú?
          </h2>
          <p className="text-xs text-gray-600 max-w-xl mx-auto leading-relaxed">
            Activa el Addon de Mapas de Calor y Grabaciones en Vivo para tu restaurante. Conoce qué platos llaman la atención, cuántos clientes abandonan el carrito y qué campañas en redes o volantes te dan dinero real.
          </p>
          <div className="pt-2">
            <a
              href={`https://wa.me/573000000000?text=${encodeURIComponent(`Hola, quiero activar el Addon de Mapas de Calor y Grabaciones para mi restaurante ${activeBrand?.name || ''}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2f4131] text-white font-black text-xs uppercase tracking-widest hover:bg-[#253527] transition-all shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Solicitar Activación de Addon ($49.000 COP / mes)
            </a>
          </div>
        </div>
      )}

      {/* 3. Generador de Códigos QR para Volantes & Campañas */}
      <div className="rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#2f4131]/10 text-[#2f4131]">
                <QrCode className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                Generador de QRs para Volantes & Campañas con Atribución
              </h2>
            </div>
            <p className="text-xs text-gray-500">
              Genera códigos QR específicos para cada canal. Aluna y Clarity sabrán si el cliente llegó por un volante callejero, Instagram o una mesa física.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Opciones de Canal / Campaña */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                Selecciona el Canal o Campaña:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'volante_calle', label: '📄 Volante Calle', desc: 'Reparto impreso' },
                  { id: 'instagram_bio', label: '📸 Instagram Bio', desc: 'Link en perfil' },
                  { id: 'whatsapp', label: '💬 WhatsApp Chat', desc: 'Estados / Difusión' },
                  { id: 'qr_mesa', label: '🪑 Mesas del Local', desc: 'Comedor físico' },
                  { id: 'empaque_delivery', label: '🛍️ Sticker Empaque', desc: 'En bolsa delivery' },
                  { id: 'custom', label: '✨ Personalizado', desc: 'Campaña especial' }
                ].map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel.id)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      selectedChannel === channel.id
                        ? 'bg-[#2f4131]/10 border-[#2f4131] text-[#2f4131] shadow-xs ring-2 ring-[#2f4131]/20'
                        : 'bg-gray-50/50 border-gray-200/80 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <p className="text-xs font-black">{channel.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{channel.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Input para Campaña personalizada */}
            {selectedChannel === 'custom' && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="text-xs font-bold text-gray-700">
                  Nombre de tu campaña o evento:
                </label>
                <input
                  type="text"
                  placeholder="Ej: volante_parque_octubre, feria_universidad"
                  value={customCampaignName}
                  onChange={(e) => setCustomCampaignName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#2f4131] focus:outline-hidden"
                />
              </div>
            )}

            {/* Enlace generado */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Enlace Inteligente Generado:
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <code className="text-xs text-gray-800 break-all font-mono flex-1">
                  {generatedCampaignUrl}
                </code>
                <button
                  onClick={handleCopyLink}
                  className="p-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-xs shrink-0 flex items-center gap-1.5 text-xs font-bold"
                  title="Copiar enlace"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Beneficio de Atribución */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-amber-900 space-y-1">
              <p className="text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                ¿Cómo funciona la atribución en tu menú?
              </p>
              <p className="text-[11px] text-amber-800/80 leading-relaxed">
                Cuando alguien escanee el QR del volante, Aluna registrará la etiqueta <code className="font-mono bg-amber-200/50 px-1 rounded">src={currentCampaignChannel}</code>. Si ese cliente agrega platos al carrito o pide, sabrás con total precisión que esa venta provino de ese volante específico.
              </p>
            </div>
          </div>

          {/* Vista Previa del QR y Descarga para Imprenta */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-white rounded-3xl border border-gray-200/80 text-center space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#2f4131] bg-[#2f4131]/10 px-3 py-1 rounded-full">
              {activeBrand?.name || 'Boku Bento'} · {currentCampaignChannel}
            </span>

            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 inline-block">
              <QRCode
                id="campaign-qr-svg"
                value={generatedCampaignUrl}
                size={180}
                level="H"
              />
            </div>

            <p className="text-[11px] text-gray-500 max-w-xs">
              Listo para enviar al diseñador, pegar en Photoshop/Canva o imprimir directamente.
            </p>

            <button
              onClick={handleDownloadQrPng}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-2xl bg-[#2f4131] text-white font-black text-xs uppercase tracking-wider hover:bg-[#253527] transition-all shadow-md active:scale-95"
            >
              <Download className="w-4 h-4" />
              Descargar QR en Alta Calidad (PNG)
            </button>
          </div>
        </div>
      </div>

      {/* 4. Métricas de Rendimiento por Canal (Atribución Real) */}
      <div className="rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                Rendimiento de Canales & Atribución de Ventas
              </h2>
            </div>
            <p className="text-xs text-gray-500">
              Compara el impacto de tus volantes vs redes sociales vs mesas físicas.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            <span>Conversión Global:</span>
            <span className="text-emerald-600 font-black">{attributionStats.globalConversion}%</span>
          </div>
        </div>

        {/* Canales Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attributionStats.channels.map(channel => {
            const Icon = channel.icon;
            return (
              <div
                key={channel.key}
                className="p-5 rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-gray-100 text-gray-700">
                      <Icon className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-black text-gray-900 leading-tight">
                      {channel.name}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">
                    {channel.share}% visitas
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Visitas</p>
                    <p className="text-sm font-black text-gray-900 mt-0.5">{channel.visits}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Pedidos</p>
                    <p className="text-sm font-black text-emerald-600 mt-0.5">{channel.orders}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Conv.</p>
                    <p className="text-sm font-black text-indigo-600 mt-0.5">{channel.conversionRate}%</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium text-[11px]">Ventas Atribuidas:</span>
                  <span className="font-black text-gray-900">{formatCurrency(channel.revenue)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Guía Táctica: Cómo interpretar tu Mapa de Calor para Ganar Dinero */}
      <div className="rounded-3xl bg-neutral-900 text-white p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight">
              Guía Táctica: Cómo interpretar tus Mapas de Calor para Facturar Más
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Consejos prácticos para tomar decisiones con la analítica visual de Microsoft Clarity.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-gray-300">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <p className="font-bold text-amber-300 flex items-center gap-1.5">
              🔴 1. Zonas Rojas (Puntos Calientes)
            </p>
            <p className="leading-relaxed text-gray-400">
              Donde hay más rojo o amarillo es donde los ojos y dedos de los clientes van primero. Pon ahí tus platos con mayor margen de ganancia o tus combos insignia.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <p className="font-bold text-indigo-300 flex items-center gap-1.5">
              📉 2. Mapa de Scroll (Profundidad)
            </p>
            <p className="leading-relaxed text-gray-400">
              Si el mapa de scroll muestra que el 70% de la gente abandona antes de la mitad de la carta, significa que los platos de abajo están invisibles. Sube las bebidas o postres a zonas más visibles.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <p className="font-bold text-rose-300 flex items-center gap-1.5">
              ⚡ 3. Clics de Frustración (Rage Clicks)
            </p>
            <p className="leading-relaxed text-gray-400">
              Clarity te avisa cuando un usuario toca varias veces seguidas un elemento creyendo que es un botón. Si tocan mucho una foto estática, añade un modal con fotos más grandes y descripción.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
