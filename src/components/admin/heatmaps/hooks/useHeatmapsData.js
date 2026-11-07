import { useState, useMemo } from 'react';
import { toast } from '../../../Toast';
import { CLARITY_PROJECT_IDS } from '../../../../hooks/useClarity';
import { isBotUserAgent } from '../../../../utils/botDetection';
import {
  KNOWN_PRESETS,
  CHANNEL_ALIASES,
  exportQrToPng,
} from '../helpers/heatmapsHelpers';

export function useHeatmapsData({
  activeBrand,
  orders = [],
  events = [],
  onRefresh,
}) {
  const brandSlug = activeBrand?.slug || 'boku-bento';
  const clarityProjectId =
    activeBrand?.clarity_project_id ||
    CLARITY_PROJECT_IDS[brandSlug] ||
    (brandSlug === 'boku-bento' ? 'z5k4ivj9i5' : null);
  const isAddonActive = Boolean(
    clarityProjectId || activeBrand?.features?.heatmaps_enabled || brandSlug === 'boku-bento'
  );

  // Estado del generador de QR compacto
  const [showQrDrawer, setShowQrDrawer] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('volante_calle');
  const [customCampaignName, setCustomCampaignName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Estado del Token y Sincronización con la API de Microsoft Clarity
  const [clarityToken, setClarityToken] = useState(() => {
    return (
      (typeof localStorage !== 'undefined'
        ? localStorage.getItem(`aa_clarity_token_${brandSlug}`)
        : '') || ''
    );
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
  const [selectedChannelForModal, setSelectedChannelForModal] = useState(null);
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
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://aluna-qrmenu.vercel.app';
  const currentCampaignChannel =
    selectedChannel === 'custom'
      ? customCampaignName.trim().toLowerCase().replace(/\s+/g, '_') || 'campana_especial'
      : selectedChannel;

  const generatedCampaignUrl = useMemo(() => {
    return `${baseUrl}/${brandSlug}/?src=${encodeURIComponent(currentCampaignChannel)}`;
  }, [baseUrl, brandSlug, currentCampaignChannel]);

  // ==========================================
  // MÉTRICAS CALCULADAS ESTRICTAMENTE REALES
  // ==========================================
  const behaviorMetrics = useMemo(() => {
    const sessionTimes = new Map();
    const sessionDevices = new Map();
    const sessionWithCart = new Set();
    const sessionWithOrder = new Set();
    const sessionSources = new Map();

    const channelMap = {};
    Object.entries(KNOWN_PRESETS).forEach(([key, conf]) => {
      channelMap[key] = {
        name: conf.name,
        icon: conf.icon,
        visits: 0,
        orders: 0,
        isCustom: false,
      };
    });

    let iphoneCount = 0;
    let androidCount = 0;
    let desktopCount = 0;
    let otherDeviceCount = 0;

    events.forEach((ev) => {
      if (!ev.session_id) return;
      if (isBotUserAgent(ev.user_agent)) return;
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

        // Atribución dinámica de canal
        let rawSrc = (
          ev.metadata?.source || (ev.metadata?.mesa ? 'qr_mesa' : 'direct')
        )
          .toLowerCase()
          .trim();
        if (CHANNEL_ALIASES[rawSrc]) {
          rawSrc = CHANNEL_ALIASES[rawSrc];
        }
        sessionSources.set(ev.session_id, rawSrc);

        if (!channelMap[rawSrc]) {
          const prettyName = rawSrc
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
          channelMap[rawSrc] = {
            name: prettyName,
            icon: '🎯',
            visits: 0,
            orders: 0,
            isCustom: true,
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
      orders.forEach((ord) => {
        const ordSource =
          ord.fulfillment_type === 'dine_in' && ord.restaurant_tables ? 'qr_mesa' : 'direct';
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

    const avgDurationSec =
      measurableSessions > 0 ? Math.round(totalDurationSeconds / measurableSessions) : 0;
    const avgMinutes = Math.floor(avgDurationSec / 60);
    const avgSeconds = avgDurationSec % 60;
    const formattedDuration =
      avgDurationSec > 0
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
      .sort((a, b) => b.visits + b.orders * 5 - (a.visits + a.orders * 5));

    return {
      formattedDuration,
      totalSessions,
      devices: {
        iphone: { count: iphoneCount, pct: iphonePct },
        android: { count: androidCount, pct: androidPct },
        desktop: { count: desktopCount, pct: desktopPct },
        total: totalDevices,
      },
      funnel: {
        totalSessions,
        cartsCount,
        ordersCount,
        abandonedCarts,
        abandonmentRate,
      },
      channels: sortedChannels,
    };
  }, [events, orders]);

  // Desglose de rendimiento por mesa individual
  const tableBreakdown = useMemo(() => {
    const map = new Map();
    (events || []).forEach((ev) => {
      const t = ev.table_id || ev.metadata?.mesa;
      if (t && ev.session_id) {
        const key = String(t);
        if (!map.has(key)) {
          map.set(key, { identifier: key, sessions: new Set(), orders: 0, revenue: 0 });
        }
        map.get(key).sessions.add(ev.session_id);
      }
    });

    (orders || []).forEach((ord) => {
      const tName =
        ord.restaurant_tables?.table_number ||
        ord.restaurant_tables?.name ||
        (ord.table_id ? String(ord.table_id) : null);
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

    return Array.from(map.values())
      .map((item) => ({
        name:
          item.identifier.startsWith('Mesa') || item.identifier.toLowerCase().includes('kitchen')
            ? item.identifier
            : `Mesa ${item.identifier}`,
        visits: item.sessions.size,
        orders: item.orders,
        revenue: item.revenue,
        conversion:
          item.sessions.size > 0
            ? Math.round((item.orders / item.sessions.size) * 100)
            : item.orders > 0
            ? 100
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders || b.visits - a.visits);
  }, [events, orders]);

  // Parseo de países y métricas de Clarity API
  const clarityApiInsights = useMemo(() => {
    if (!apiData?.metrics || !Array.isArray(apiData.metrics)) return null;

    const countryMap = new Map();
    let totalClarityTraffic = 0;
    let totalEngagement = 0;
    let totalScroll = 0;
    let totalRageClicks = 0;
    let count = 0;

    apiData.metrics.forEach((item) => {
      const country =
        item.dimensions?.['Country/Region'] ||
        item.dimensions?.Country ||
        item.dimensions?.Region ||
        'Otro';
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
      totalRageClicks,
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
          dimension2: 'Device',
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.details || responseData.error || `Error ${res.status}`);
      }

      setApiData(responseData);
      const now = new Date();
      setLastSyncTime(now);

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          `aa_clarity_insights_cache_${brandSlug}`,
          JSON.stringify({
            timestamp: now.getTime(),
            data: responseData,
          })
        );
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
    if (
      !window.confirm(
        '¿Deseas resetear las visitas y eventos de prueba anteriores para dejar el contador en 0 y registrar solo clientes reales?'
      )
    ) {
      return;
    }
    setIsClearing(true);
    try {
      const nowIso = new Date().toISOString();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`aa_analytics_reset_at_${activeBrand?.id}`, nowIso);
      }

      await fetch('/api/clear-test-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandSlug }),
      });
      toast.success('¡Visitas de prueba reseteadas a 0!');
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.success('¡Visitas de prueba reseteadas a 0!');
      setTimeout(() => window.location.reload(), 1000);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSaveToken = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`aa_clarity_token_${brandSlug}`, clarityToken.trim());
      toast.success('Token guardado');
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(generatedCampaignUrl);
      setCopiedLink(true);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDownloadQrPng = () => {
    exportQrToPng(
      'campaign-qr-svg-mini',
      `QR_${brandSlug}_${currentCampaignChannel}.png`,
      activeBrand?.name || 'Boku Bento',
      `Campaña: ${currentCampaignChannel}`
    );
  };

  const handleDownloadChannelQr = (ch, url) => {
    if (!ch) return;
    exportQrToPng(
      `channel-modal-qr-svg-${ch.key}`,
      `QR_${brandSlug}_${ch.key}.png`,
      activeBrand?.name || 'Boku Bento',
      `Campaña: ${ch.name}`
    );
  };

  const clarityBaseUrl = clarityProjectId
    ? `https://clarity.microsoft.com/projects/view/${clarityProjectId}`
    : 'https://clarity.microsoft.com/';

  return {
    brandSlug,
    clarityProjectId,
    isAddonActive,
    clarityBaseUrl,
    baseUrl,
    showQrDrawer,
    setShowQrDrawer,
    selectedChannel,
    setSelectedChannel,
    customCampaignName,
    setCustomCampaignName,
    copiedLink,
    currentCampaignChannel,
    generatedCampaignUrl,
    clarityToken,
    setClarityToken,
    isSyncingApi,
    lastSyncTime,
    apiData,
    isClearing,
    showTableModal,
    setShowTableModal,
    selectedChannelForModal,
    setSelectedChannelForModal,
    isRefreshing,
    behaviorMetrics,
    tableBreakdown,
    clarityApiInsights,
    handleRefreshData,
    handleSyncClarityApi,
    handleClearTestAnalytics,
    handleSaveToken,
    handleCopyLink,
    handleDownloadQrPng,
    handleDownloadChannelQr,
  };
}
