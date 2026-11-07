export function formatRelativeTime(dateString) {
  if (!dateString) return 'Nunca';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));

  if (diffInSeconds < 60) return 'Hace un momento';
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)}d`;
  return date.toLocaleDateString();
}

export function getExpirationStatus(expDateString) {
  if (!expDateString) return null;
  const exp = new Date(expDateString + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      days: diffDays,
      label: `Vencido hace ${Math.abs(diffDays)}d`,
      color: 'bg-red-500/20 text-red-700 border-red-500/40',
      status: 'expired'
    };
  }
  if (diffDays === 0) {
    return {
      days: 0,
      label: '⚠️ Vence Hoy',
      color: 'bg-rose-500 text-white border-rose-600 animate-pulse font-bold shadow-2xs',
      status: 'today'
    };
  }
  if (diffDays <= 2) {
    return {
      days: diffDays,
      label: `⚠️ Vence en ${diffDays}d`,
      color: 'bg-amber-500/20 text-amber-800 border-amber-500/40 font-semibold',
      status: 'critical'
    };
  }
  if (diffDays <= 7) {
    return {
      days: diffDays,
      label: `⏳ Vence en ${diffDays}d`,
      color: 'bg-amber-100 text-amber-800 border-amber-300',
      status: 'warning'
    };
  }
  return {
    days: diffDays,
    label: `Vence en ${diffDays}d`,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    status: 'fresh'
  };
}

export function getStockHealth(current, min) {
  const curr = Number(current) || 0;
  const m = Number(min) || 0;

  // 1. Quiebre total (0 stock o menor) -> ROJO
  if (curr <= 0) {
    return {
      status: 'out',
      percentage: 0,
      barPercentage: 0,
      colorClass: 'bg-rose-500',
      textColor: 'text-rose-600',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-500 text-white',
      icon: 'heroicons:exclamation-circle',
      label: 'Agotado (0%)',
      shortLabel: '0%',
      textLevel: 'Agotado'
    };
  }

  // Sin mínimo configurado (m <= 0)
  if (m <= 0) {
    return {
      status: 'ok',
      percentage: 100,
      barPercentage: 100,
      colorClass: 'bg-emerald-600',
      textColor: 'text-slate-900',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-500 text-white',
      icon: null,
      label: 'Disponible',
      shortLabel: '100%',
      textLevel: 'Disponible'
    };
  }

  // % relativo al stock mínimo
  const percentOfMin = Math.round((curr / m) * 100);

  // Para la barra de progreso: tomamos como 100% un colchón de 2x el stock mínimo
  const ideal = m * 2;
  const barPercentage = Math.min(100, Math.max(8, Math.round((curr / ideal) * 100)));

  // 2. Stock Crítico: Existe stock pero está por debajo del mínimo -> NARANJA
  if (curr < m) {
    return {
      status: 'critical',
      percentage: percentOfMin,
      barPercentage,
      colorClass: 'bg-orange-500',
      textColor: 'text-orange-600',
      badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
      iconBg: 'bg-orange-500 text-white',
      icon: 'heroicons:exclamation-triangle',
      label: `${percentOfMin}% · Bajo mínimo`,
      shortLabel: `${percentOfMin}%`,
      textLevel: 'Bajo mínimo'
    };
  }

  // 3. Stock en nivel justo / advertencia: Entre el 100% y el 150% del mínimo -> ÁMBAR
  if (curr <= m * 1.5) {
    return {
      status: 'warning',
      percentage: percentOfMin,
      barPercentage,
      colorClass: 'bg-amber-400',
      textColor: 'text-amber-700',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-400 text-amber-950',
      icon: 'heroicons:clock',
      label: `${percentOfMin}% · Nivel justo`,
      shortLabel: `${percentOfMin}%`,
      textLevel: 'Nivel justo'
    };
  }

  // 4. Stock óptimo: > 150% del mínimo -> VERDE
  return {
    status: 'good',
    percentage: percentOfMin,
    barPercentage,
    colorClass: 'bg-emerald-600',
    textColor: 'text-slate-900',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconBg: 'bg-emerald-500 text-white',
    icon: null,
    label: `${percentOfMin}% · Óptimo`,
    shortLabel: `${percentOfMin}%`,
    textLevel: 'Óptimo'
  };
}
