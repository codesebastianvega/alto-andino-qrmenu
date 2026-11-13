const terminal = status => status === 'delivered' || status === 'cancelled';
const timestamp = value => {
  if (value == null || value === '') return null;
  const number = typeof value === 'number' ? value : new Date(value).getTime();
  return Number.isFinite(number) ? number : null;
};
const duration = (start, end) => start != null && end != null && end >= start ? end - start : null;
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
  const ready = timestamp(order.ready_at);
  const departed = timestamp(order.fulfillment_type === 'delivery' ? (order.on_the_way_at || order.on_table_at) : (order.on_table_at || order.on_the_way_at));
  const currentKey = orderStage(order.status);
  const labels = { waiting: 'Espera inicial', preparing: 'Preparación', ready: 'Listo sin salir', fulfillment: order.fulfillment_type === 'delivery' ? 'Entrega' : order.fulfillment_type === 'dine_in' ? 'En mesa' : 'Retiro' };
  const currentLabels = { ...labels, ready: 'Listo', fulfillment: order.fulfillment_type === 'delivery' ? 'En camino' : labels.fulfillment };
  const legacyStarts = { waiting: created, preparing, ready, fulfillment: departed };
  const legacyEnds = {
    waiting: preparing ?? (currentKey === 'waiting' ? end : null),
    preparing: ready ?? (currentKey === 'preparing' ? end : null),
    ready: departed ?? (currentKey === 'ready' ? end : null),
    fulfillment: currentKey === 'fulfillment' || terminal(order.status) ? end : null,
  };
  const records = Object.fromEntries(Object.keys(labels).map(key => [key, { total: 0, seen: false, missing: false }]));
  const history = Array.isArray(order.status_history) ? order.status_history : [];
  history.forEach((event, index) => {
    const key = orderStage(event.status);
    if (!key) return;
    const next = history[index + 1];
    const stop = next ? timestamp(next.at) : event.status === order.status && !terminal(order.status) ? end : null;
    const elapsed = duration(timestamp(event.at), stop);
    records[key].seen = true;
    if (elapsed == null) records[key].missing = true;
    else records[key].total += elapsed;
  });
  const stages = Object.entries(labels).map(([key, label]) => {
    const record = records[key];
    return { key, label, running: key === currentKey,
      ms: record.seen ? (record.missing ? null : record.total) : duration(legacyStarts[key], legacyEnds[key]) };
  });
  const last = history.at(-1);
  let phaseStart = last?.status === order.status ? timestamp(last.at) : null;
  if (currentKey && last?.status === order.status) {
    for (let i = history.length - 2; i >= 0 && orderStage(history[i].status) === currentKey; i--) phaseStart = timestamp(history[i].at);
  }
  const currentStart = phaseStart ?? timestamp(order.status_started_at) ?? legacyStarts[currentKey];
  const readyEvent = history.find(event => event.status === 'ready' && timestamp(event.at) != null);
  return {
    stages,
    current: currentKey ? { key: currentKey, label: currentLabels[currentKey], ms: duration(currentStart, end) } : null,
    untilReadyMs: duration(created, ready ?? timestamp(readyEvent?.at)),
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
