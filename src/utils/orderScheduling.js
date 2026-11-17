export function colombiaDateTime(now = Date.now()) {
  return new Date(now - 5 * 3600000).toISOString().slice(0, 16);
}

export function scheduledOrderTimestamp(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value || '')) return null;
  const date = new Date(`${value}:00-05:00`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
