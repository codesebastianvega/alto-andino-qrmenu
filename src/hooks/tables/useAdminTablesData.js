import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { useLocations } from '../../context/LocationContext';
import { useAdminModalBack } from '../useAdminModalBack';
import { toast as toastFn } from '../../components/Toast';
import { isBotUserAgent } from '../../utils/botDetection';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

export function useAdminTablesData() {
  const { profile, activeBrand } = useAuth();
  const { brand: brandFromContext } = useBrand();
  const { activeLocationId, isAllLocations, locations } = useLocations();
  const brandId = activeBrand?.id || brandFromContext?.id || profile?.brand_id || localStorage.getItem('aa_active_brand_id');

  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [tableMetrics, setTableMetrics] = useState({});
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [activeTab, setActiveTab] = useState('tables'); // 'tables' | 'marketing'
  const [marketingMetrics, setMarketingMetrics] = useState({});

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableForm, setTableForm] = useState({ table_number: '', area_id: '' });
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);
  const [modalTab, setModalTab] = useState('datos');

  // Areas Management
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);

  const [newAreaName, setNewAreaName] = useState('');
  const [isSubmittingArea, setIsSubmittingArea] = useState(false);
  const [isBulkCreating, setIsBulkCreating] = useState(false);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);
  const [isCampaignQrModalOpen, setIsCampaignQrModalOpen] = useState(false);
  const [campaignChannel, setCampaignChannel] = useState('volante_calle');
  const [campaignCustomName, setCampaignCustomName] = useState('');

  useAdminModalBack(isFormOpen, () => setIsFormOpen(false));
  useAdminModalBack(isAreaModalOpen, () => setIsAreaModalOpen(false));
  useAdminModalBack(isPrintSheetOpen, () => setIsPrintSheetOpen(false));
  useAdminModalBack(isCampaignQrModalOpen, () => setIsCampaignQrModalOpen(false));

  useEffect(() => {
    if (brandId) {
      fetchTables();
      fetchAreas();
    }
  }, [brandId, activeLocationId, isAllLocations]);

  const fetchAreas = async () => {
    setLoadingAreas(true);
    try {
      let query = supabase
        .from('table_areas')
        .select('*, locations(name)')
        .eq('brand_id', brandId)
        .order('sort_order', { ascending: true });

      if (!isAllLocations && activeLocationId) {
        query = query.or(`location_id.eq.${activeLocationId},location_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAreas(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAreas(false);
    }
  };

  const fetchTables = async () => {
    setLoadingTables(true);
    setLoadingMetrics(true);
    try {
      let query = supabase
        .from('restaurant_tables')
        .select('*, table_areas(name), locations(name)')
        .eq('brand_id', brandId)
        .order('table_number');
      
      if (!isAllLocations && activeLocationId) {
        query = query.or(`location_id.eq.${activeLocationId},location_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTables(data || []);

      // Cargar métricas en vivo para cada mesa/activo
      try {
        const [eventsRes, ordersRes] = await Promise.allSettled([
          supabase
            .from('analytics_events')
            .select('session_id, metadata, table_id')
            .eq('brand_id', brandId),
          supabase
            .from('orders')
            .select('id, total_amount, table_id, status')
            .eq('brand_id', brandId)
        ]);

        const eventsData = eventsRes.status === 'fulfilled' ? (eventsRes.value.data || []) : [];
        const ordersData = ordersRes.status === 'fulfilled' ? (ordersRes.value.data || []) : [];

        const sessionsPerTable = new Map();
        eventsData.forEach(ev => {
          const tId = ev.table_id || ev.metadata?.mesa;
          if (tId && ev.session_id) {
            const key = String(tId).toLowerCase().trim();
            if (!sessionsPerTable.has(key)) sessionsPerTable.set(key, new Set());
            sessionsPerTable.get(key).add(ev.session_id);
          }
        });

        const metricsMap = {};
        (data || []).forEach(table => {
          const idKey = String(table.id).toLowerCase().trim();
          const numKey = String(table.table_number).toLowerCase().trim();

          const scansSet = new Set();
          if (sessionsPerTable.has(idKey)) {
            sessionsPerTable.get(idKey).forEach(s => scansSet.add(s));
          }
          if (sessionsPerTable.has(numKey)) {
            sessionsPerTable.get(numKey).forEach(s => scansSet.add(s));
          }
          const scans = scansSet.size;

          const tableOrders = ordersData.filter(o => {
            const oTable = String(o.table_id || '').toLowerCase().trim();
            return oTable === idKey || oTable === numKey;
          });
          const completedOrders = tableOrders.filter(o => o.status !== 'cancelled');
          const ordersCount = completedOrders.length;
          const revenue = completedOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
          const conversionRate = scans > 0 ? Math.round((ordersCount / scans) * 100) : (ordersCount > 0 ? 100 : 0);

          metricsMap[table.id] = {
            scans,
            orders: ordersCount,
            revenue,
            conversionRate
          };
        });

        setTableMetrics(metricsMap);

        // Calcular métricas de canales de marketing/redes
        const mSources = {};
        eventsData.forEach(ev => {
          if (isBotUserAgent(ev.user_agent)) return;
          let rawSrc = (ev.metadata?.source || (ev.metadata?.mesa ? 'qr_mesa' : 'direct')).toLowerCase().trim();
          const ALIASES = { ig: 'instagram_bio', instagram: 'instagram_bio', insta: 'instagram_bio', wsp: 'whatsapp', wa: 'whatsapp', ws: 'whatsapp', fb: 'facebook', face: 'facebook', tt: 'tiktok', web: 'direct' };
          rawSrc = ALIASES[rawSrc] || rawSrc;
          if (ev.session_id) {
            if (!mSources[rawSrc]) mSources[rawSrc] = { sessions: new Set(), orders: 0, revenue: 0 };
            mSources[rawSrc].sessions.add(ev.session_id);
          }
        });
        ordersData.forEach(ord => {
          if (ord.status === 'cancelled') return;
          let rawSrc = (ord.metadata?.source || (ord.table_id ? 'qr_mesa' : 'direct')).toLowerCase().trim();
          const ALIASES = { ig: 'instagram_bio', instagram: 'instagram_bio', insta: 'instagram_bio', wsp: 'whatsapp', wa: 'whatsapp', ws: 'whatsapp', fb: 'facebook', face: 'facebook', tt: 'tiktok', web: 'direct' };
          rawSrc = ALIASES[rawSrc] || rawSrc;
          if (!mSources[rawSrc]) mSources[rawSrc] = { sessions: new Set(), orders: 0, revenue: 0 };
          mSources[rawSrc].orders++;
          mSources[rawSrc].revenue += Number(ord.total_amount || 0);
        });

        const formattedMarketing = {};
        Object.keys(mSources).forEach(k => {
          const item = mSources[k];
          const scans = item.sessions.size;
          formattedMarketing[k] = {
            scans,
            orders: item.orders,
            revenue: item.revenue,
            conversionRate: scans > 0 ? Math.round((item.orders / scans) * 100) : (item.orders > 0 ? 100 : 0)
          };
        });
        setMarketingMetrics(formattedMarketing);
      } catch (metricsErr) {
        console.warn('Error calculando métricas de mesas:', metricsErr);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar mesas');
    } finally {
      setLoadingTables(false);
      setLoadingMetrics(false);
    }
  };

  const handleBulkCreateTables = async (customCount) => {
    const inputCount = customCount || parseInt(document.getElementById('bulk-table-count')?.value || '6', 10);
    const count = Math.min(Math.max(1, isNaN(inputCount) ? 6 : inputCount), 50);

    setIsBulkCreating(true);
    try {
      let targetLocId = (!isAllLocations && activeLocationId && activeLocationId !== 'all')
        ? activeLocationId
        : (locations?.find(l => l.is_main)?.id || locations?.[0]?.id);

      if (!targetLocId) {
        const { data: dbLocs } = await supabase.from('locations').select('id').eq('brand_id', brandId).limit(1);
        if (dbLocs && dbLocs.length > 0) {
          targetLocId = dbLocs[0].id;
        } else {
          const { data: newLoc } = await supabase.from('locations').insert([{
            brand_id: brandId,
            name: 'Sede Principal',
            is_main: true,
            is_active: true,
            operational_modes: ['dine_in', 'takeaway', 'delivery']
          }]).select().single();
          targetLocId = newLoc?.id;
        }
      }

      if (!targetLocId) {
        toast.error('No se pudo determinar la sede para las mesas');
        return;
      }

      const existingNumbers = new Set(tables.map(t => t.table_number.toLowerCase().trim()));
      const newRows = [];
      let num = 1;
      while (newRows.length < count && num <= 100) {
        const name = `Mesa ${num}`;
        if (!existingNumbers.has(name.toLowerCase())) {
          newRows.push({
            table_number: name,
            brand_id: brandId,
            location_id: targetLocId,
            is_active: true
          });
        }
        num++;
      }

      if (newRows.length === 0) {
        toast.error('Ya existen mesas con esos identificadores');
        return;
      }

      const { error } = await supabase.from('restaurant_tables').insert(newRows);
      if (error) throw error;

      toast.success(`¡${newRows.length} mesas creadas al instante!`);
      fetchTables();
    } catch (err) {
      console.error('Error in bulk table creation:', err);
      toast.error('Error al generar mesas en lote');
    } finally {
      setIsBulkCreating(false);
    }
  };

  const handleCreateArea = async (e) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;

    let targetLocationId = (!isAllLocations && activeLocationId && activeLocationId !== 'all')
      ? activeLocationId
      : (tableForm.location_id || locations?.find(l => l.is_main)?.id || locations?.[0]?.id);

    if (!targetLocationId) {
      try {
        const { data: dbLocs } = await supabase.from('locations').select('id').eq('brand_id', brandId).limit(1);
        if (dbLocs && dbLocs.length > 0) {
          targetLocationId = dbLocs[0].id;
        } else {
          const { data: newLoc } = await supabase.from('locations').insert([{
            brand_id: brandId,
            name: 'Sede Principal',
            is_main: true,
            is_active: true,
            operational_modes: ['dine_in', 'takeaway', 'delivery']
          }]).select().single();
          targetLocationId = newLoc?.id;
        }
      } catch (errLoc) {
        console.error('Error auto-creating location for area:', errLoc);
      }
    }

    if (!targetLocationId) {
      return toast.error('Por favor crea primero una sede en la sección de Sedes');
    }

    setIsSubmittingArea(true);
    try {
      const { error } = await supabase.from('table_areas').insert([{
        name: newAreaName.trim(),
        brand_id: brandId,
        location_id: targetLocationId,
        sort_order: areas.length
      }]);
      if (error) throw error;
      setNewAreaName('');
      fetchAreas();
      toast.success('Área creada');
    } catch (err) {
      console.error(err);
      toast.error('Error al crear área');
    } finally {
      setIsSubmittingArea(false);
    }
  };

  const handleDeleteArea = async (id) => {
    if (!window.confirm('¿Seguro? Se desvincularán las mesas de este salón.')) return;
    try {
      const { error } = await supabase.from('table_areas').delete().eq('id', id);
      if (error) throw error;
      fetchAreas();
      fetchTables();
      toast.success('Área eliminada');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar área');
    }
  };

  const openCreate = () => {
    setEditingTable(null);
    const defaultLocationId = (!isAllLocations && activeLocationId && activeLocationId !== 'all')
      ? activeLocationId
      : (locations?.find(l => l.is_main)?.id || locations?.[0]?.id || '');
    setTableForm({ 
      table_number: '', 
      area_id: '',
      location_id: defaultLocationId 
    });
    setModalTab('datos');
    setIsFormOpen(true);
  };

  const openEdit = (table) => {
    setEditingTable(table);
    setTableForm({ 
      table_number: table.table_number,
      area_id: table.area_id || ''
    });
    setModalTab('datos');
    setIsFormOpen(true);
  };

  const openQr = (table) => {
    setEditingTable(table);
    setTableForm({ 
      table_number: table.table_number,
      area_id: table.area_id || ''
    });
    setModalTab('qr');
    setIsFormOpen(true);
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    if (!tableForm.table_number) return toast.error('Ingresa el identificador de la mesa');

    setIsSubmittingTable(true);
    try {
      if (editingTable) {
        const { error } = await supabase.from('restaurant_tables')
          .update({ 
            table_number: tableForm.table_number, 
            area_id: tableForm.area_id || null,
            updated_at: new Date() 
          })
          .eq('id', editingTable.id);
        if (error) throw error;
        toast.success('Mesa actualizada');
      } else {
        let effectiveLocationId = (!isAllLocations && activeLocationId && activeLocationId !== 'all')
          ? activeLocationId
          : (tableForm.location_id || locations?.find(l => l.is_main)?.id || locations?.[0]?.id);

        if (!effectiveLocationId) {
          try {
            const { data: dbLocs } = await supabase.from('locations').select('id').eq('brand_id', brandId).limit(1);
            if (dbLocs && dbLocs.length > 0) {
              effectiveLocationId = dbLocs[0].id;
            } else {
              const { data: newLoc } = await supabase.from('locations').insert([{
                brand_id: brandId,
                name: 'Sede Principal',
                is_main: true,
                is_active: true,
                operational_modes: ['dine_in', 'takeaway', 'delivery']
              }]).select().single();
              effectiveLocationId = newLoc?.id;
            }
          } catch (errLoc) {
            console.error('Error auto-creating location for table:', errLoc);
          }
        }

        if (!effectiveLocationId) {
          toast.error('Por favor crea primero una sede en la sección de Sedes');
          setIsSubmittingTable(false);
          return;
        }

        const { error } = await supabase.from('restaurant_tables')
          .insert([{ 
            table_number: tableForm.table_number,
            area_id: tableForm.area_id || null,
            brand_id: brandId,
            location_id: effectiveLocationId
          }]);
        if (error) throw error;
        toast.success('Mesa creada');
      }
      setIsFormOpen(false);
      setEditingTable(null);
      fetchTables();
    } catch (err) {
      console.error(err);
      toast.error('Error guardando mesa. Puede que el nombre ya exista.');
    } finally {
      setIsSubmittingTable(false);
    }
  };

  const handleDeleteTable = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta mesa?')) return;
    try {
      const { error } = await supabase.from('restaurant_tables').delete().eq('id', id);
      if (error) throw error;
      toast.success('Mesa eliminada');
      fetchTables();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  const toggleTableActive = async (table) => {
    try {
      const { error } = await supabase.from('restaurant_tables')
        .update({ is_active: !table.is_active })
        .eq('id', table.id);
      if (error) throw error;
      fetchTables();
    } catch (err) {
      console.error(err);
      toast.error('Error actualizando estado');
    }
  };

  const getTableUrl = (table) => {
    const slug = activeBrand?.slug;
    const baseUrl = window.location.origin;
    const hasMultipleLocations = locations && locations.length > 1;
    const isMainLocation = locations?.find(l => l.id === table?.location_id)?.is_main;
    const shouldIncludeLoc = hasMultipleLocations && !isMainLocation && table?.location_id;

    const locParam = shouldIncludeLoc ? `&loc=${table.location_id}` : '';
    return slug 
      ? `${baseUrl}/${slug}/?mesa=${encodeURIComponent(table?.table_number || '')}${locParam}`
      : `${baseUrl}?mesa=${encodeURIComponent(table?.table_number || '')}${locParam}`;
  };

  const handleCopyUrl = (table) => {
    navigator.clipboard.writeText(getTableUrl(table));
    toast.success('Enlace copiado al portapapeles');
  };

  const handleDownloadQr = () => {
    if (!editingTable) return;
    const svg = document.getElementById(`qr-code-${editingTable.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_Mesa_${editingTable.table_number}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleDownloadAnyQr = (svgId, fileName = 'QR_Codigo', title = '', subtitle = '') => {
    const svg = document.getElementById(svgId);
    if (!svg) {
      toast.error('No se pudo encontrar el código QR');
      return;
    }
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
        ctx.font = 'bold 22px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(title || activeBrand?.name || 'Boku Bento', 250, 490);
        ctx.fillStyle = '#6B7280';
        ctx.font = 'normal 15px system-ui';
        ctx.fillText(subtitle || 'Escanea para ordenar', 250, 520);

        const a = document.createElement('a');
        a.download = `${fileName}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        toast.success('QR descargado');
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch {
      toast.error('Error descargando QR');
    }
  };

  return {
    activeBrand,
    locations,
    activeLocationId,
    isAllLocations,
    tables,
    loadingTables,
    tableMetrics,
    loadingMetrics,
    activeTab,
    setActiveTab,
    marketingMetrics,
    areas,
    loadingAreas,
    isFormOpen,
    setIsFormOpen,
    editingTable,
    tableForm,
    setTableForm,
    isSubmittingTable,
    modalTab,
    setModalTab,
    isAreaModalOpen,
    setIsAreaModalOpen,
    newAreaName,
    setNewAreaName,
    isSubmittingArea,
    isBulkCreating,
    isPrintSheetOpen,
    setIsPrintSheetOpen,
    isCampaignQrModalOpen,
    setIsCampaignQrModalOpen,
    campaignChannel,
    setCampaignChannel,
    campaignCustomName,
    setCampaignCustomName,
    handleBulkCreateTables,
    handleCreateArea,
    handleDeleteArea,
    openCreate,
    openEdit,
    openQr,
    handleSaveTable,
    handleDeleteTable,
    toggleTableActive,
    getTableUrl,
    handleCopyUrl,
    handleDownloadQr,
    handleDownloadAnyQr
  };
}
