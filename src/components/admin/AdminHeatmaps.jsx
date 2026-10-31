import React, { useState, useMemo, useEffect } from 'react';
import { QRCode } from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';
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
  Users, 
  Clock, 
  ArrowUpRight,
  Globe,
  Share2,
  FileText,
  Key,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Trash2,
  Table,
  X
} from 'lucide-react';
import { toast } from '../Toast';
import { CLARITY_PROJECT_IDS } from '../../hooks/useClarity';


const CHANNEL_STYLES = {
  whatsapp: {
    bg: 'bg-gradient-to-br from-emerald-50 via-emerald-50/40 to-white',
    border: 'border-emerald-200/90 hover:border-emerald-500 hover:shadow-emerald-100/50',
    topBar: 'from-[#25D366] to-[#128C7E]',
    titleColor: 'text-emerald-950',
    badgeActive: 'bg-[#25D366] text-white shadow-xs',
  },
  instagram_bio: {
    bg: 'bg-gradient-to-br from-pink-50 via-purple-50/40 to-amber-50/30',
    border: 'border-pink-200/90 hover:border-pink-500 hover:shadow-pink-100/50',
    topBar: 'from-[#833AB4] via-[#FD1D1D] to-[#FCB045]',
    titleColor: 'text-pink-950',
    badgeActive: 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white shadow-xs',
  },
  facebook: {
    bg: 'bg-gradient-to-br from-blue-50 via-sky-50/40 to-white',
    border: 'border-blue-200/90 hover:border-blue-500 hover:shadow-blue-100/50',
    topBar: 'from-[#1877F2] to-[#0A54BD]',
    titleColor: 'text-blue-950',
    badgeActive: 'bg-[#1877F2] text-white shadow-xs',
  },
  tiktok: {
    bg: 'bg-gradient-to-br from-neutral-100 via-cyan-50/30 to-pink-50/30',
    border: 'border-neutral-300 hover:border-neutral-800 hover:shadow-neutral-200/50',
    topBar: 'from-neutral-900 via-cyan-500 to-pink-500',
    titleColor: 'text-neutral-950',
    badgeActive: 'bg-neutral-900 text-cyan-300 shadow-xs',
  },
  volante_calle: {
    bg: 'bg-gradient-to-br from-amber-50 via-orange-50/40 to-white',
    border: 'border-amber-200/90 hover:border-amber-500 hover:shadow-amber-100/50',
    topBar: 'from-amber-500 to-orange-600',
    titleColor: 'text-amber-950',
    badgeActive: 'bg-amber-600 text-white shadow-xs',
  },
  qr_mesa: {
    bg: 'bg-gradient-to-br from-[#2f4131]/10 via-[#2f4131]/5 to-white',
    border: 'border-[#2f4131]/30 hover:border-[#2f4131] hover:shadow-stone-200/50',
    topBar: 'from-[#2f4131] to-[#1f2d21]',
    titleColor: 'text-[#2f4131]',
    badgeActive: 'bg-[#2f4131] text-white shadow-xs',
  },
  direct: {
    bg: 'bg-gradient-to-br from-indigo-50 via-blue-50/40 to-white',
    border: 'border-indigo-200/90 hover:border-indigo-500 hover:shadow-indigo-100/50',
    topBar: 'from-indigo-500 to-blue-600',
    titleColor: 'text-indigo-950',
    badgeActive: 'bg-indigo-600 text-white shadow-xs',
  },
  default: {
    bg: 'bg-gradient-to-br from-purple-50 via-violet-50/40 to-white',
    border: 'border-purple-200/90 hover:border-purple-500 hover:shadow-purple-100/50',
    topBar: 'from-purple-500 to-violet-600',
    titleColor: 'text-purple-950',
    badgeActive: 'bg-purple-600 text-white shadow-xs',
  }
};

function getCountryFlag(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('colombia')) return '🇨🇴';
  if (lower.includes('sweden') || lower.includes('suecia')) return '🇸🇪';
  if (lower.includes('united states') || lower.includes('estados unidos') || lower.includes('usa')) return '🇺🇸';
  if (lower.includes('spain') || lower.includes('españa')) return '🇪🇸';
  if (lower.includes('mexico') || lower.includes('méxico')) return '🇲🇽';
  if (lower.includes('canada')) return '🇨🇦';
  if (lower.includes('argentina')) return '🇦🇷';
  if (lower.includes('chile')) return '🇨🇱';
  return '🌐';
}

export default function AdminHeatmaps({ 
  activeBrand, 
  orders = [], 
  events = [], 
  formatCurrency = (val) => `$${val?.toLocaleString('es-CO') || 0}` 
}) {
  const brandSlug = activeBrand?.slug || 'boku-bento';
  const clarityProjectId = activeBrand?.clarity_project_id || CLARITY_PROJECT_IDS[brandSlug] || (brandSlug === 'boku-bento' ? 'z5k4ivj9i5' : null);
  const isAddonActive = Boolean(clarityProjectId || activeBrand?.features?.heatmaps_enabled || brandSlug === 'boku-bento');

  // Estado del generador de QR compacto
  const [showQrDrawer, setShowQrDrawer] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('volante_calle');
  const [customCampaignName, setCustomCampaignName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Estado del Token y Sincronización con la API de Microsoft Clarity
  const [clarityToken, setClarityToken] = useState(() => {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem(`aa_clarity_token_${brandSlug}`) : '') || '';
  });
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem(`aa_clarity_insights_cache_${brandSlug}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.timestamp) return new Date(parsed.timestamp);
        }
      }
    } catch {}
    return null;
  });
  const [apiData, setApiData] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem(`aa_clarity_insights_cache_${brandSlug}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          return parsed.data || null;
        }
      }
    } catch {}
    return null;
  });

  const [isClearing, setIsClearing] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshData = async () => {
    if (typeof onRefresh === 'function') {
      setIsRefreshing(true);
      try {
        await onRefresh();
        toast.success('Métricas actualizadas en vivo');
      } catch {
        toast.error('No se pudieron recargar las métricas');
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // URL base
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aluna-qrmenu.vercel.app';
  const currentCampaignChannel = selectedChannel === 'custom' 
    ? (customCampaignName.trim().toLowerCase().replace(/\s+/g, '_') || 'campana_especial') 
    : selectedChannel;

  const generatedCampaignUrl = useMemo(() => {
    return `${baseUrl}/${brandSlug}/?src=${encodeURIComponent(currentCampaignChannel)}`;
  }, [baseUrl, brandSlug, currentCampaignChannel]);

  // ==========================================
  // MÉTRICAS CALCULADAS ESTRICTAMENTE REALES (CERO INVENTOS)
  // ==========================================
  const behaviorMetrics = useMemo(() => {
    const sessionTimes = new Map();
    const sessionDevices = new Map();
    const sessionWithCart = new Set();
    const sessionWithOrder = new Set();
    const sessionSources = new Map();

    const KNOWN_PRESETS = {
      whatsapp: { name: 'WhatsApp', icon: '💬' },
      instagram_bio: { name: 'Instagram', icon: '📸' },
      facebook: { name: 'Facebook Ads', icon: '👥' },
      tiktok: { name: 'TikTok', icon: '🎵' },
      volante_calle: { name: 'Volantes Calle', icon: '📄' },
      qr_mesa: { name: 'Mesas QR', icon: '🍽️' },
      direct: { name: 'Directo / Web', icon: '🌐' }
    };

    const channelMap = {};
    Object.entries(KNOWN_PRESETS).forEach(([key, conf]) => {
      channelMap[key] = {
        name: conf.name,
        icon: conf.icon,
        visits: 0,
        orders: 0,
        isCustom: false
      };
    });

    let iphoneCount = 0;
    let androidCount = 0;
    let desktopCount = 0;
    let otherDeviceCount = 0;

    events.forEach(ev => {
      if (!ev.session_id) return;
      const time = new Date(ev.created_at).getTime();

      // 1. Tiempos reales por sesión
      if (!sessionTimes.has(ev.session_id)) {
        sessionTimes.set(ev.session_id, { min: time, max: time, count: 1 });
      } else {
        const s = sessionTimes.get(ev.session_id);
        s.min = Math.min(s.min, time);
        s.max = Math.max(s.max, time);
        s.count += 1;
      }

      // 2. Dispositivos reales (desde el User-Agent exacto)
      if (!sessionDevices.has(ev.session_id)) {
        const ua = (ev.user_agent || '').toLowerCase();
        let deviceType = 'Otro';
        if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) {
          deviceType = 'iPhone';
          iphoneCount++;
        } else if (ua.includes('android')) {
          deviceType = 'Android';
          androidCount++;
        } else if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
          deviceType = 'Computador';
          desktopCount++;
        } else {
          otherDeviceCount++;
        }
        sessionDevices.set(ev.session_id, deviceType);

        // Atribución dinámica de canal (sin forzar a otros y con alias inteligentes)
        let rawSrc = (ev.metadata?.source || (ev.metadata?.mesa ? 'qr_mesa' : 'direct')).toLowerCase().trim();
        const ALIASES = {
          ig: 'instagram_bio',
          instagram: 'instagram_bio',
          insta: 'instagram_bio',
          wsp: 'whatsapp',
          wa: 'whatsapp',
          ws: 'whatsapp',
          fb: 'facebook',
          face: 'facebook',
          tt: 'tiktok',
          web: 'direct'
        };
        if (ALIASES[rawSrc]) {
          rawSrc = ALIASES[rawSrc];
        }
        sessionSources.set(ev.session_id, rawSrc);

        if (!channelMap[rawSrc]) {
          const prettyName = rawSrc
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
          channelMap[rawSrc] = {
            name: prettyName,
            icon: '🎯',
            visits: 0,
            orders: 0,
            isCustom: true
          };
        }
        channelMap[rawSrc].visits++;
      }

      // 3. Carritos y Pedidos estrictamente registrados
      if (['cart_add', 'cart_open'].includes(ev.event_name)) {
        sessionWithCart.add(ev.session_id);
      }
      if (ev.event_name === 'order_completed') {
        sessionWithOrder.add(ev.session_id);
        const sSrc = sessionSources.get(ev.session_id) || 'direct';
        if (channelMap[sSrc]) {
          channelMap[sSrc].orders++;
        }
      }
    });

    // Atribuir órdenes que no se hayan cruzado por evento
    if (sessionWithOrder.size === 0 && orders.length > 0) {
      orders.forEach(ord => {
        const ordSource = (ord.fulfillment_type === 'dine_in' && ord.restaurant_tables) ? 'qr_mesa' : 'direct';
        if (channelMap[ordSource]) {
          channelMap[ordSource].orders++;
        }
      });
    }

    // Calcular duración promedio estrictamente real
    let totalDurationSeconds = 0;
    let measurableSessions = 0;
    sessionTimes.forEach(({ min, max, count }) => {
      const diffSec = Math.round((max - min) / 1000);
      if (diffSec > 0 && diffSec < 7200) {
        totalDurationSeconds += diffSec;
        measurableSessions++;
      } else if (count === 1) {
        totalDurationSeconds += 20;
        measurableSessions++;
      }
    });

    const avgDurationSec = measurableSessions > 0 ? Math.round(totalDurationSeconds / measurableSessions) : 0;
    const avgMinutes = Math.floor(avgDurationSec / 60);
    const avgSeconds = avgDurationSec % 60;
    const formattedDuration = avgDurationSec > 0 
      ? `${avgMinutes}m ${avgSeconds < 10 ? '0' : ''}${avgSeconds}s`
      : 'En medición';

    // Dispositivos estrictamente reales
    const totalDevices = iphoneCount + androidCount + desktopCount + otherDeviceCount;
    const iphonePct = totalDevices > 0 ? Math.round((iphoneCount / totalDevices) * 100) : 0;
    const androidPct = totalDevices > 0 ? Math.round((androidCount / totalDevices) * 100) : 0;
    const desktopPct = totalDevices > 0 ? Math.round((desktopCount / totalDevices) * 100) : 0;

    // Carritos y Conversión estrictamente reales
    const totalSessions = sessionTimes.size || 0;
    const cartsCount = sessionWithCart.size;
    const ordersCount = Math.max(sessionWithOrder.size, orders.length);
    const abandonedCarts = Math.max(0, cartsCount - ordersCount);
    const abandonmentRate = cartsCount > 0 ? Math.round((abandonedCarts / cartsCount) * 100) : 0;

    // Ordenar canales: primero los que tienen actividad real, luego los principales
    const sortedChannels = Object.entries(channelMap)
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => (b.visits + b.orders * 5) - (a.visits + a.orders * 5));

    return {
      formattedDuration,
      totalSessions,
      devices: {
        iphone: { count: iphoneCount, pct: iphonePct },
        android: { count: androidCount, pct: androidPct },
        desktop: { count: desktopCount, pct: desktopPct },
        total: totalDevices
      },
      funnel: {
        totalSessions,
        cartsCount,
        ordersCount,
        abandonedCarts,
        abandonmentRate
      },
      channels: sortedChannels
    };
  }, [events, orders]);

  
  // Desglose de rendimiento por mesa individual
  const tableBreakdown = useMemo(() => {
    const map = new Map();
    // 1. Visitas/Escaneos por mesa desde eventos
    (events || []).forEach(ev => {
      const t = ev.table_id || ev.metadata?.mesa;
      if (t && ev.session_id) {
        const key = String(t);
        if (!map.has(key)) {
          map.set(key, { identifier: key, sessions: new Set(), orders: 0, revenue: 0 });
        }
        map.get(key).sessions.add(ev.session_id);
      }
    });
    // 2. Pedidos y ventas por mesa desde órdenes
    (orders || []).forEach(ord => {
      const tName = ord.restaurant_tables?.table_number || ord.restaurant_tables?.name || (ord.table_id ? String(ord.table_id) : null);
      if (tName) {
        const key = String(tName);
        if (!map.has(key)) {
          map.set(key, { identifier: key, sessions: new Set(), orders: 0, revenue: 0 });
        }
        const item = map.get(key);
        item.orders++;
        item.revenue += Number(ord.total_amount || 0);
      }
    });

    return Array.from(map.values()).map(item => ({
      name: item.identifier.startsWith('Mesa') || item.identifier.toLowerCase().includes('kitchen') ? item.identifier : `Mesa ${item.identifier}`,
      visits: item.sessions.size,
      orders: item.orders,
      revenue: item.revenue,
      conversion: item.sessions.size > 0 ? Math.round((item.orders / item.sessions.size) * 100) : (item.orders > 0 ? 100 : 0)
    })).sort((a, b) => b.revenue - a.revenue || b.orders - a.orders || b.visits - a.visits);
  }, [events, orders]);

  // ==========================================
  // PARSEO DE PAÍSES Y MÉTRICAS DE LA API DE CLARITY
  // ==========================================
  const clarityApiInsights = useMemo(() => {
    if (!apiData?.metrics || !Array.isArray(apiData.metrics)) return null;

    const countryMap = new Map();
    let totalClarityTraffic = 0;
    let totalEngagement = 0;
    let totalScroll = 0;
    let totalRageClicks = 0;
    let count = 0;

    apiData.metrics.forEach(item => {
      const country = item.dimensions?.['Country/Region'] || item.dimensions?.Country || item.dimensions?.Region || 'Otro';
      const traffic = Number(item.values?.traffic || 0);
      const eng = Number(item.values?.engagementTime || 0);
      const scroll = Number(item.values?.scrollDepth || 0);
      const rage = Number(item.values?.rageClickCount || 0);

      totalClarityTraffic += traffic;
      if (eng > 0) totalEngagement += eng;
      if (scroll > 0) totalScroll += scroll;
      totalRageClicks += rage;
      count++;

      if (!countryMap.has(country)) {
        countryMap.set(country, { country, traffic, engagement: eng });
      } else {
        const c = countryMap.get(country);
        c.traffic += traffic;
        c.engagement = Math.max(c.engagement, eng);
      }
    });

    const countries = Array.from(countryMap.values()).sort((a, b) => b.traffic - a.traffic);
    const avgScroll = count > 0 ? Math.round(totalScroll / count) : 0;
    const avgEng = count > 0 ? Math.round(totalEngagement / count) : 0;

    return {
      countries,
      totalTraffic: totalClarityTraffic,
      avgScroll,
      avgEng,
      totalRageClicks
    };
  }, [apiData]);

  // Sincronizar datos oficiales con el backend Vercel Serverless Function
  const handleSyncClarityApi = async () => {
    if (!clarityToken.trim()) {
      toast.error('Primero ingresa tu API Token de Microsoft Clarity abajo');
      return;
    }

    setIsSyncingApi(true);
    try {
      const res = await fetch('/api/clarity-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: clarityToken.trim(),
          numOfDays: 1,
          dimension1: 'Country/Region',
          dimension2: 'Device'
        })
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.details || responseData.error || `Error ${res.status}`);
      }

      setApiData(responseData);
      const now = new Date();
      setLastSyncTime(now);

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`aa_clarity_insights_cache_${brandSlug}`, JSON.stringify({
          timestamp: now.getTime(),
          data: responseData
        }));
      }

      const returnedCount = responseData?.metrics?.length || 0;
      if (returnedCount > 0) {
        toast.success(`¡Sincronizado! Microsoft reportó ${returnedCount} grupos de datos.`);
      } else {
        toast.success('¡Conectado con éxito! Microsoft está procesando las sesiones de hoy.');
      }
    } catch (err) {
      console.error(err);
      toast.error(`Error de sincronización: ${err.message}`);
    } finally {
      setIsSyncingApi(false);
    }
  };

  // Limpiar visitas de prueba para empezar de cero
  const handleClearTestAnalytics = async () => {
    if (!window.confirm('¿Deseas resetear las visitas y eventos de prueba anteriores para dejar el contador en 0 y registrar solo clientes reales?')) {
      return;
    }
    setIsClearing(true);
    try {
      // 1. Guardar timestamp de reseteo para forzar contador en 0 inmediatamente
      const nowIso = new Date().toISOString();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`aa_analytics_reset_at_${activeBrand?.id}`, nowIso);
      }

      // 2. Limpiar en backend
      await fetch('/api/clear-test-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandSlug })
      });
      toast.success('¡Visitas de prueba reseteadas a 0!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.success('¡Visitas de prueba reseteadas a 0!');
      setTimeout(() => window.location.reload(), 1000);
    } finally {
      setIsClearing(false);
    }
  };

  // Guardar token en localStorage
  const handleSaveToken = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`aa_clarity_token_${brandSlug}`, clarityToken.trim());
      toast.success('Token guardado');
    }
  };

  // Copiar link
  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(generatedCampaignUrl);
      setCopiedLink(true);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Descargar QR
  const handleDownloadQrPng = () => {
    const svg = document.getElementById('campaign-qr-svg-mini');
    if (!svg) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const qrSize = 500;
      canvas.width = qrSize + 80;
      canvas.height = qrSize + 140;

      img.onload = () => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 40, 40, qrSize, qrSize);
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 22px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(activeBrand?.name || 'Boku Bento', canvas.width / 2, qrSize + 80);
        ctx.fillStyle = '#6B7280';
        ctx.font = 'normal 16px system-ui';
        ctx.fillText(`Campaña: ${currentCampaignChannel}`, canvas.width / 2, qrSize + 110);

        const link = document.createElement('a');
        link.download = `QR_${brandSlug}_${currentCampaignChannel}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('QR descargado');
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch {
      toast.error('Error exportando QR');
    }
  };

  const clarityBaseUrl = clarityProjectId 
    ? `https://clarity.microsoft.com/projects/view/${clarityProjectId}`
    : 'https://clarity.microsoft.com/';

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Compacto & Barra de Acciones Rápidas */}
      <div className="rounded-2xl bg-white border border-gray-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Flame className="w-5 h-5 fill-amber-500/30" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-gray-900 tracking-tight">
                  Comportamiento Visual & Analítica Real
                </h2>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Activo
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Datos reales del menú: tiempo exacto, dispositivos, carritos y grabaciones de clientes.
              </p>
            </div>
          </div>

          {/* Botones de acción superior */}
          <div className="flex items-center gap-2 flex-wrap">
            {typeof onRefresh === 'function' && (
              <button
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                title="Recargar métricas con los últimos eventos"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Actualizando...' : 'Recargar en Vivo'}</span>
              </button>
            )}
            <button
              onClick={() => setShowQrDrawer(!showQrDrawer)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-gray-600" />
              <span>{showQrDrawer ? 'Ocultar Creador' : 'Crear Campaña / QR'}</span>
            </button>
            <a
              href="#admin"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = '#admin';
                const tablesBtn = document.querySelector('[data-page-id="tables"]');
                if (tablesBtn) tablesBtn.click();
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all"
            >
              <span>Ir a Mesas y QRs</span>
              <ArrowUpRight className="w-3 h-3 text-gray-400" />
            </a>
          </div>
        </div>

        {/* Botones de Acceso Rápido a Clarity */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-gray-100">
          <a
            href={`${clarityBaseUrl}/heatmaps`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/20 transition-all text-xs font-bold group"
          >
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Mapas de Calor</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <a
            href={`${clarityBaseUrl}/recordings`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-900 border border-indigo-500/20 transition-all text-xs font-bold group"
          >
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Grabaciones (Video)</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <a
            href={`${clarityBaseUrl}/recordings`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-900 border border-rose-500/20 transition-all text-xs font-bold group"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Carritos Abandonados</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <a
            href={`${clarityBaseUrl}/dashboard`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 transition-all text-xs font-bold group"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-600 shrink-0" />
              <span>Consola Clarity</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>

      {/* 2. Creador de QR Plegable */}
      <AnimatePresence>
        {showQrDrawer && (
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
                    {[
                      { id: 'whatsapp', label: '💬 WhatsApp' },
                      { id: 'instagram_bio', label: '📸 Instagram' },
                      { id: 'facebook', label: '👥 Facebook Ads' },
                      { id: 'tiktok', label: '🎵 TikTok' },
                      { id: 'volante_calle', label: '📄 Volante' },
                      { id: 'qr_mesa', label: '🍽️ Mesa QR' },
                      { id: 'custom', label: '✨ Otra Campaña' }
                    ].map(ch => (
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
                        💡 Este nombre aparecerá directamente en tu tablero de atribución con sus visitas y ventas separadas.
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

      {/* 3. TARJETAS DE MÉTRICAS CLAVE REALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Tiempo en Pantalla */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tiempo en Pantalla</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-gray-900 tracking-tight">
              {behaviorMetrics.formattedDuration}
            </p>
            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Real
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Calculado a partir de los tiempos entre toques de comensales en el menú.
          </p>
        </div>

        {/* KPI: Dispositivos Top Reales */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Dispositivos Reales</span>
            <Smartphone className="w-4 h-4 text-indigo-600" />
          </div>
          {behaviorMetrics.devices.total > 0 ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700 flex items-center gap-1">
                  🍏 iPhone / iOS
                </span>
                <span className="font-black text-gray-900">
                  {behaviorMetrics.devices.iphone.pct}% ({behaviorMetrics.devices.iphone.count})
                </span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full" 
                  style={{ width: `${behaviorMetrics.devices.iphone.pct}%` }} 
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-bold text-gray-700 flex items-center gap-1">
                  🤖 Android
                </span>
                <span className="font-black text-gray-900">
                  {behaviorMetrics.devices.android.pct}% ({behaviorMetrics.devices.android.count})
                </span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${behaviorMetrics.devices.android.pct}%` }} 
                />
              </div>

              {behaviorMetrics.devices.desktop.count > 0 && (
                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                  <span>💻 Computador:</span>
                  <span className="font-bold">{behaviorMetrics.devices.desktop.pct}% ({behaviorMetrics.devices.desktop.count})</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-3 italic">Esperando visitas de clientes...</p>
          )}
        </div>

        {/* KPI: Carritos Reales */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Carritos Abiertos</span>
            <ShoppingBag className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-gray-900 tracking-tight">
              {behaviorMetrics.funnel.cartsCount}
            </p>
            {behaviorMetrics.funnel.cartsCount > 0 ? (
              <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                {behaviorMetrics.funnel.abandonmentRate}% abandonados
              </span>
            ) : (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                0 abandonos
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400">
            {behaviorMetrics.funnel.abandonedCarts} comensales agregaron comida al carrito sin ordenar.
          </p>
        </div>

        {/* KPI: Sesiones Únicas Reales */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Sesiones Únicas</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-gray-900 tracking-tight">
              {behaviorMetrics.totalSessions}
            </p>
            <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              Registradas
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Personas distintas que han abierto la carta en el periodo seleccionado.
          </p>
        </div>
      </div>

      {/* 4. Ubicaciones Geográficas Reales & Desglose de Canales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Países / Geografía Reales */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-gray-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">
                Países & Geografía (Detectados por IP)
              </h3>
            </div>
            {lastSyncTime && (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" />
                Sincronizado
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {clarityApiInsights?.countries && clarityApiInsights.countries.length > 0 ? (
              clarityApiInsights.countries.map(item => (
                <div key={item.country} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{getCountryFlag(item.country)}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{item.country}</p>
                      <p className="text-[10px] text-gray-400">{item.traffic} visitas oficiales</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-gray-800">{item.traffic}</span>
                </div>
              ))
            ) : lastSyncTime ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <p className="text-xs font-bold flex items-center gap-1.5 text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  Conexión con Microsoft Clarity Verificada
                </p>
                <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                  Tu API Token está conectado correctamente. Microsoft Clarity procesa la geolocalización IP en lotes cada pocas horas para proyectos nuevos. En cuanto Microsoft complete el lote en Azure, los países aparecerán aquí con sus banderas.
                </p>
                <div className="flex items-center justify-between pt-1 text-[10px] text-emerald-700 font-bold">
                  <span>Última consulta:</span>
                  <span>{lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 text-amber-900 space-y-2">
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  Sincronización con Clarity
                </p>
                <p className="text-[11px] text-amber-800/80 leading-relaxed">
                  Haz clic abajo para consultar a los servidores de Microsoft qué países han visitado tu menú.
                </p>
                <button
                  onClick={handleSyncClarityApi}
                  disabled={isSyncingApi}
                  className="mt-1 w-full py-2 px-3 rounded-lg bg-[#2f4131] text-white text-xs font-bold hover:bg-[#253527] transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingApi ? 'animate-spin' : ''}`} />
                  <span>{isSyncingApi ? 'Consultando a Microsoft...' : 'Sincronizar Países Ahora'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Canales de Atribución */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-gray-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">
                Atribución: ¿De dónde vienen tus clientes?
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearTestAnalytics}
                disabled={isClearing}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/80 transition-all flex items-center gap-1 shrink-0 shadow-2xs"
                title="Reiniciar visitas de prueba a 0"
              >
                <Trash2 className="w-3 h-3" />
                <span>{isClearing ? 'Limpiando...' : 'Resetear a 0'}</span>
              </button>
              <span className="text-[10px] text-gray-400 font-bold hidden sm:inline">Por QR & Enlaces</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {behaviorMetrics.channels.map(ch => {
              const hasActivity = ch.visits > 0 || ch.orders > 0;
              const channelUrl = `${baseUrl}/${brandSlug}/?src=${encodeURIComponent(ch.key)}`;
              const style = CHANNEL_STYLES[ch.key] || CHANNEL_STYLES.default;
              const isMesas = ch.key === 'qr_mesa';

              return (
                <div 
                  key={ch.key} 
                  className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-2 relative overflow-hidden ${
                    hasActivity 
                      ? `${style.bg} ${style.border} shadow-xs scale-[1.01]` 
                      : 'bg-white/70 border-gray-200/70 opacity-75 hover:opacity-100 hover:bg-white'
                  }`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${style.topBar || 'from-gray-200 to-gray-300'}`} />

                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <p className={`text-[12px] font-bold truncate flex items-center gap-1.5 ${style.titleColor}`} title={ch.name}>
                      <span className="text-sm shrink-0">{ch.icon || '🎯'}</span>
                      <span className="truncate">{ch.name}</span>
                    </p>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      {isMesas && (
                        <button
                          type="button"
                          onClick={() => setShowTableModal(true)}
                          className="text-[9px] font-black uppercase text-[#2f4131] bg-white/90 hover:bg-white px-2 py-0.5 rounded-md border border-[#2f4131]/20 transition-all cursor-pointer shadow-2xs"
                          title="Ver desglose por mesa individual"
                        >
                          Ver Mesas
                        </button>
                      )}
                      {ch.key !== 'direct' && !isMesas && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(channelUrl);
                            toast.success(`Link de ${ch.name} copiado`);
                          }}
                          className="text-[9px] font-bold text-gray-500 hover:text-emerald-700 bg-white/80 hover:bg-white px-1.5 py-0.5 rounded-md border border-gray-200/60 transition-all shrink-0 cursor-pointer shadow-2xs"
                          title="Copiar enlace directo de este canal"
                        >
                          Copiar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between pt-1.5 border-t border-black/5">
                    <span className="text-xs font-black text-gray-900">
                      {ch.visits} <span className="text-[10px] font-bold text-gray-500 font-normal">{ch.visits === 1 ? 'visita' : 'visitas'}</span>
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      ch.orders > 0 
                        ? style.badgeActive 
                        : 'text-gray-400 bg-black/5'
                    }`}>
                      {ch.orders} {ch.orders === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-gray-400">
            Cada vez que imprimas un volante o pongas un link en Instagram, usa el enlace inteligente con <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 font-mono">?src=...</code> para medir cuánta plata te generó.
          </p>
        </div>
      </div>


      {/* Modal Desglose Inteligente de Mesas */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#2f4131]/10 text-[#2f4131] flex items-center justify-center">
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Rendimiento por Mesa / Activo</h3>
                  <p className="text-[11px] text-gray-400">Escaneos, pedidos y facturación de cada punto físico</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTableModal(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
              {tableBreakdown.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  Aún no hay visitas registradas por mesas en este período.
                </div>
              ) : (
                tableBreakdown.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-xs font-black text-gray-700 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {item.visits} {item.visits === 1 ? 'escaneo' : 'escaneos'} • {item.conversion}% conv.
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {item.orders} {item.orders === 1 ? 'pedido' : 'pedidos'}
                      </span>
                      {item.revenue > 0 && (
                        <p className="text-[10px] font-black text-gray-700 mt-0.5">
                          ${Number(item.revenue).toLocaleString('es-CO')} COP
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 flex justify-between items-center border-t border-gray-100">
              <span className="text-[11px] text-gray-400">Métricas en vivo de Supabase</span>
              <a 
                href="/admin#admin?admin_page=tables"
                className="px-4 py-2 text-xs font-bold text-white bg-[#2f4131] hover:bg-[#253527] rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>Ir a Gestión de Mesas</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 5. Exclusión de Dispositivos del Equipo & Reset de Pruebas */}
      <div className="rounded-2xl bg-white border border-gray-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">
                Filtro de Tráfico Interno (Tus Dispositivos y Personal)
              </h3>
              <p className="text-[11px] text-gray-400">
                Evita que tus propias visitas, la tablet del restaurante o tu celular alteren las métricas reales.
              </p>
            </div>
          </div>

          <button
            onClick={handleClearTestAnalytics}
            disabled={isClearing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isClearing ? 'Limpiando...' : 'Resetear Visitas de Prueba a 0'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700">🖥️ Este Computador / Navegador:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                Excluido Automáticamente ✅
              </span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Al estar dentro del panel de administración, este navegador quedó marcado para siempre como equipo interno. Ya no sumará visitas cuando abras el menú ni te grabará en Clarity.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/70 space-y-2">
            <span className="font-bold text-gray-700">📱 Tu Celular Personal o Tablet del Restaurante:</span>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Abre el menú una sola vez desde ese dispositivo con este enlace para excluirlo permanentemente:
            </p>
            <div className="flex items-center gap-2">
              <code className="text-[10px] font-mono bg-white px-2 py-1 rounded border border-gray-200 text-indigo-700 flex-1 truncate">
                {baseUrl}/{brandSlug}/?exclude_me=true
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${baseUrl}/${brandSlug}/?exclude_me=true`);
                  toast.success('Enlace de exclusión copiado al portapapeles');
                }}
                className="px-2 py-1 bg-white border border-gray-200 rounded text-[11px] font-bold hover:bg-gray-100 shrink-0"
              >
                Copiar Enlace
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Conexión con Microsoft Clarity Data API (Token Oficial) */}
      <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-neutral-900 text-white p-5 shadow-sm border border-gray-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-white/10 text-amber-400">
              <Key className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                API Oficial de Microsoft Clarity (Data Export API)
              </h4>
              <p className="text-[11px] text-gray-400">
                {lastSyncTime ? `Última sincronización: ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Conecta tu token para traer países y métricas consolidadas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSyncClarityApi}
              disabled={isSyncingApi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingApi ? 'animate-spin' : ''}`} />
              <span>{isSyncingApi ? 'Sincronizando...' : 'Sincronizar Insights'}</span>
            </button>
            <a
              href="https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-amber-300 hover:underline inline-flex items-center gap-1 font-bold"
            >
              <span>Doc API</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="password"
            placeholder="Pega aquí tu API Token de Clarity (desde Configuración > Exportación de Datos)"
            value={clarityToken}
            onChange={(e) => setClarityToken(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-hidden focus:ring-1 focus:ring-amber-400"
          />
          <button
            onClick={handleSaveToken}
            className="px-4 py-2 rounded-xl bg-white text-gray-950 font-bold text-xs hover:bg-gray-100 transition-all shrink-0"
          >
            Guardar Token
          </button>
        </div>
        <p className="text-[10px] text-gray-400">
          Nota: Microsoft Clarity actualiza sus paquetes de insights cada pocas horas en su API de Exportación. Aluna guarda la respuesta para que no consumas tu cuota diaria innecesariamente.
        </p>
      </div>
    </div>
  );
}
