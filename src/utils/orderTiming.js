const terminal = status => status === 'delivered' || status === 'cancelled';
const timestamp = value => {
  if (value == null || value === '') return null;
  const number = typeof value === 'number' ? value : new Date(value).getTime();
  return Number.isFinite(number) ? number : null;
};
const duration = (start, end) => start != null && end != null && end >= start ? end - start : null;
export function getInitialManualOrderStatus({ completed = false, scheduledTime = null, now = Date.now() }) {
  if (completed) return 'delivered';
  return timestamp(scheduledTime) > timestamp(now) ? 'new' : 'preparing';
}

export function getOrderSchedule(order, now = Date.now(), preparationMinutes = 15) {
  const at = timestamp(order.scheduled_time);
  if (at == null) return null;
  const remainingMs = at - timestamp(now);
  return {
    at, remainingMs,
    label: new Date(at).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }),
    preparationAt: at - Math.max(0, Number(preparationMinutes) || 15) * 60000,
  };
}
export function orderStage(status) {
  if (status === 'new' || status === 'waiting_payment') return 'waiting';
  if (status === 'preparing') return 'preparing';
  if (status === 'ready') return 'ready';
  if (status === 'on_table' || status === 'on_the_way') return 'fulfillment';
  return null;
}
export function formatOrderDuration(ms) {
  if (ms == null || !Number.isFinite(ms)) return 'Sin registro';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export function getOrderTiming(order, now = Date.now()) {
  const at = timestamp(now);
  const created = timestamp(order.created_at);
  const end = terminal(order.status) ? timestamp(order.status === 'cancelled' ? order.cancelled_at : order.delivered_at) : at;
  const preparing = timestamp(order.preparing_at);
  const scheduled = timestamp(order.scheduled_time);
  // Planned reservation time is not an operational delay. If cooking starts
  // before the appointment, operational time starts at that real action.
  const operationalStart = scheduled != null && created != null
    ? Math.max(created, Math.min(scheduled, preparing ?? scheduled)) : created;
  const ready = timestamp(order.ready_at);
  const departed = timestamp(order.fulfillment_type === 'delivery' ? (order.on_the_way_at || order.on_table_at) : (order.on_table_at || order.on_the_way_at));
  const currentKey = orderStage(order.status);
  const labels = { waiting: 'Espera inicial', preparing: 'Preparación', ready: 'Listo sin salir', fulfillment: order.fulfillment_type === 'delivery' ? 'Entrega' : order.fulfillment_type === 'dine_in' ? 'En mesa' : 'Retiro' };
  const currentLabels = { ...labels, ready: 'Listo', fulfillment: order.fulfillment_type === 'delivery' ? 'En camino' : labels.fulfillment };
  const legacyStarts = { waiting: operationalStart, preparing, ready, fulfillment: departed };
  const legacyEnds = {
    waiting: preparing ?? (currentKey === 'waiting' ? end : null),
    preparing: ready ?? (currentKey === 'preparing' ? end : null),
    ready: departed ?? (currentKey === 'ready' ? end : null),
    fulfillment: currentKey === 'fulfillment' || terminal(order.status) ? end : null,
  };
  const records = Object.fromEntries(Object.keys(labels).map(key => [key, { total: 0, seen: false, missing: false }]));
  const rawHistory = Array.isArray(order.status_history) ? order.status_history : [];
  const history = rawHistory.map((event, index) => {
    // Preserve the original server audit while excluding a corrected auto-start
    // from older manual-order clients. The actual preparing_at was cleared or
    // moved forward when the scheduled order was returned to pending.
    const start = timestamp(event.at);
    const correctedAutoStart = index === 0 && scheduled != null && event.status === 'preparing'
      && start != null && created != null && Math.abs(start - created) < 1000
      && (preparing == null || preparing - start > 1000);
    return correctedAutoStart ? { ...event, status: 'new' } : event;
  });
  history.forEach((event, index) => {
    const key = orderStage(event.status);
    if (!key) return;
    const next = history[index + 1];
    const stop = next ? timestamp(next.at) : event.status === order.status && !terminal(order.status) ? end : null;
    const originalStart = timestamp(event.at);
    let elapsed = duration(originalStart, stop);
    if (key === 'waiting' && elapsed != null && operationalStart != null) {
      elapsed = Math.max(0, stop - Math.max(originalStart, operationalStart));
    }
    records[key].seen = true;
    if (elapsed == null) records[key].missing = true;
    else records[key].total += elapsed;
  });
  const stages = Object.entries(labels).map(([key, label]) => {
    const record = records[key];
    return { key, label, running: key === currentKey && !(scheduled != null && key === 'waiting' && at < scheduled),
      ms: record.seen ? (record.missing ? null : record.total) : key === 'waiting' && scheduled != null && legacyEnds[key] != null
        ? Math.max(0, legacyEnds[key] - operationalStart) : duration(legacyStarts[key], legacyEnds[key]) };
  });
  const last = history.at(-1);
  let phaseStart = last?.status === order.status ? timestamp(last.at) : null;
  if (currentKey && last?.status === order.status) {
    for (let i = history.length - 2; i >= 0 && orderStage(history[i].status) === currentKey; i--) phaseStart = timestamp(history[i].at);
  }
  let currentStart = phaseStart ?? timestamp(order.status_started_at) ?? legacyStarts[currentKey];
  if (currentKey === 'waiting' && scheduled != null && operationalStart != null) currentStart = Math.max(currentStart ?? operationalStart, operationalStart);
  const isScheduledWaiting = scheduled != null && currentKey === 'waiting' && at < scheduled;
  const readyEvent = history.find(event => event.status === 'ready' && timestamp(event.at) != null);
  return {
    stages,
    current: isScheduledWaiting ? { key: 'scheduled', label: 'Programado', ms: null }
      : currentKey ? { key: currentKey, label: currentLabels[currentKey], ms: duration(currentStart, end) } : null,
    untilReadyMs: duration(operationalStart, ready ?? timestamp(readyEvent?.at)),
    untilReadyLabel: scheduled != null ? 'Desde inicio operativo hasta listo' : 'Desde recibido hasta listo',
    operationalTotalMs: operationalStart != null && end != null ? Math.max(0, end - operationalStart) : null,
    plannedWaitMs: scheduled != null && created != null && end != null ? Math.max(0, Math.min(operationalStart, end) - created) : null,
    totalMs: duration(created, end), hasHistory: history.length > 0,
    hasMissing: stages.some(stage => stage.ms == null),
  };
}

export function getStationTiming(order, station, now = Date.now()) {
  const start = timestamp(order[`${station}_started_at`]);
  const state = order[`${station}_status`];
  const ready = timestamp(order[`${station}_ready_at`]);
  const stop = state === 'ready' ? ready : terminal(order.status) ? timestamp(order.status === 'cancelled' ? order.cancelled_at : order.delivered_at) : timestamp(now);
  return duration(start, stop);
}
