/**
 * Computes the next opening Date and metadata based on business hours.
 * 
 * @param {Array} businessHours - Array of business hour objects from the database.
 * @param {Object} options - { fromDate: Date, targetTomorrow: boolean }
 * @returns {Object} - { date: Date, timeStr: string, openTime: string, dayLabel: string, formatted: string }
 */
export function getNextOpeningDateTime(businessHours = [], options = {}) {
  const fromDate = options.fromDate ? new Date(options.fromDate) : new Date();
  const targetTomorrow = Boolean(options.targetTomorrow);
  
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  // Si targetTomorrow es true, arrancamos a evaluar desde mañana (offset = 1)
  // De lo contrario, evaluamos si hoy aún tiene apertura futura (offset = 0)
  const startOffset = targetTomorrow ? 1 : 0;

  for (let offset = startOffset; offset <= 7; offset++) {
    const candidateDate = new Date(fromDate);
    candidateDate.setDate(candidateDate.getDate() + offset);
    const candidateDay = candidateDate.getDay();

    const dayConfig = (businessHours || []).find(h => h.day_of_week === candidateDay);

    // Si el día está marcado explícitamente cerrado, buscar el siguiente día
    if (dayConfig && dayConfig.is_closed) continue;

    const openTimeStr = dayConfig?.open_time || '09:00';
    const [hStr, mStr] = openTimeStr.split(':');
    const openH = parseInt(hStr, 10) || 0;
    const openM = parseInt(mStr, 10) || 0;

    candidateDate.setHours(openH, openM, 0, 0);

    // Si estamos mirando hoy (offset === 0), la hora debe ser en el futuro
    if (offset === 0 && candidateDate.getTime() <= fromDate.getTime()) {
      continue;
    }

    const time12 = formatTime12h(`${openH}:${openM < 10 ? '0' : ''}${openM}`);
    let dayLabel = 'hoy';
    if (offset === 1) dayLabel = 'mañana';
    else if (offset > 1) dayLabel = `el ${dayNames[candidateDay]}`;

    return {
      date: candidateDate,
      timeStr: time12,
      openTime: `${openH.toString().padStart(2, '0')}:${openM.toString().padStart(2, '0')}`,
      dayLabel,
      formatted: `${dayLabel} a las ${time12}`
    };
  }

  // Fallback seguro: mañana a las 9:00 AM
  const fallback = new Date(fromDate);
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(9, 0, 0, 0);
  return {
    date: fallback,
    timeStr: '9:00 AM',
    openTime: '09:00',
    dayLabel: 'mañana',
    formatted: 'mañana a las 9:00 AM'
  };
}

/**
 * Checks if the restaurant is currently open based on manual pause state and business hours settings.
 * 
 * @param {Array} businessHours - Array of business hour objects from the database.
 * @param {Object} brandConfig - Optional brand.config object containing store_status.
 * @param {Date} referenceDate - Optional date to evaluate (defaults to now).
 * @returns {Object} - { isOpen: boolean, isManualPause: boolean, isScheduleClosed: boolean, pauseInfo: Object|null, nextOpening: Object|null, reopenFormatted: string|null, message: string }
 */
export function isRestaurantOpen(businessHours, brandConfig = null, referenceDate = new Date()) {
  const storeStatus = brandConfig?.store_status;
  const now = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);

  // 1. Verificación de Pausa Manual
  if (storeStatus?.is_paused) {
    const pauseUntil = storeStatus.pause_until ? new Date(storeStatus.pause_until) : null;

    // Si es pausa indefinida (pauseUntil === null) o si la fecha de reapertura aún no se cumple (pauseUntil > now)
    if (!pauseUntil || pauseUntil.getTime() > now.getTime()) {
      let reopenFormatted = null;
      if (pauseUntil) {
        const diffMs = pauseUntil.getTime() - now.getTime();
        const mins = Math.max(1, Math.ceil(diffMs / 60000));
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        const time12 = formatTime12h(
          `${pauseUntil.getHours()}:${pauseUntil.getMinutes() < 10 ? '0' : ''}${pauseUntil.getMinutes()}`
        );

        const isTomorrow = pauseUntil.getDate() !== now.getDate();
        const prefix = isTomorrow ? 'mañana a las ' : 'a las ';
        const remText = hrs > 0 ? `${hrs}h ${remMins > 0 ? `${remMins}m` : ''}`.trim() : `${mins} min`;
        reopenFormatted = `${prefix}${time12} (en ${remText})`;
      }

      return {
        isOpen: false,
        isManualPause: true,
        isScheduleClosed: false,
        pauseInfo: storeStatus,
        nextOpening: null,
        reopenFormatted,
        message: storeStatus.custom_message || (reopenFormatted ? `Cocina en pausa temporal — Reabre ${reopenFormatted}.` : "Cocina en pausa temporalmente — En este momento no estamos recibiendo pedidos.")
      };
    }
    // Si pauseUntil <= now, LA PAUSA EXPIRÓ. Continúa abajo para evaluar businessHours normalmente.
  }

  // 2. Verificación de Horarios de Atención (Business Hours)
  if (!businessHours || businessHours.length === 0) {
    // Si no hay horarios explícitos configurados en DB, permitimos operar
    return { 
      isOpen: true, 
      isManualPause: false, 
      isScheduleClosed: false, 
      pauseInfo: null, 
      nextOpening: null, 
      reopenFormatted: null,
      message: "" 
    };
  }

  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
  const currentTime = now.getHours() * 100 + now.getMinutes();
  const todayHours = businessHours.find(h => h.day_of_week === dayOfWeek);

  if (!todayHours) {
    return { 
      isOpen: true, 
      isManualPause: false, 
      isScheduleClosed: false, 
      pauseInfo: null, 
      nextOpening: null, 
      reopenFormatted: null,
      message: "" 
    }; 
  }

  const nextOpening = getNextOpeningDateTime(businessHours, { fromDate: now, targetTomorrow: false });

  if (todayHours.is_closed) {
    return { 
      isOpen: false, 
      isManualPause: false, 
      isScheduleClosed: true,
      pauseInfo: null, 
      nextOpening,
      reopenFormatted: nextOpening.formatted,
      message: `Hoy estamos cerrados. Abrimos ${nextOpening.formatted}.` 
    };
  }

  const [openH, openM] = (todayHours.open_time || "00:00").split(':').map(Number);
  const [closeH, closeM] = (todayHours.close_time || "23:59").split(':').map(Number);

  const openTimeValue = openH * 100 + openM;
  const closeTimeValue = closeH * 100 + closeM;

  let isInShift = false;
  // Handle shifts that cross midnight (e.g. 18:00 to 02:00)
  if (closeTimeValue < openTimeValue) {
    isInShift = (currentTime >= openTimeValue || currentTime < closeTimeValue);
  } else {
    isInShift = (currentTime >= openTimeValue && currentTime < closeTimeValue);
  }

  if (isInShift) {
    return { 
      isOpen: true, 
      isManualPause: false, 
      isScheduleClosed: false, 
      pauseInfo: null, 
      nextOpening: null, 
      reopenFormatted: null,
      message: "" 
    };
  }

  const isBeforeOpen = currentTime < openTimeValue;
  const scheduleMsg = isBeforeOpen
    ? `Cerrado por ahora. Abrimos hoy a las ${formatTime12h(todayHours.open_time)}.`
    : `Cerrado por hoy. Abrimos ${nextOpening.formatted}.`;

  return { 
    isOpen: false, 
    isManualPause: false, 
    isScheduleClosed: true,
    pauseInfo: null, 
    nextOpening,
    reopenFormatted: nextOpening.formatted,
    message: scheduleMsg 
  };
}

export function buildDefaultBusinessHours(brandId, locationId = null) {
  return Array.from({ length: 7 }, (_, day) => ({
    brand_id: brandId,
    location_id: locationId,
    day_of_week: day,
    open_time: '08:00',
    close_time: '22:00',
    is_closed: false,
  }));
}

export function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [hStr, mStr] = String(timeStr).split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const m = mStr ? mStr.slice(0, 2) : '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
}

export function getCategoryScheduleInfo(cat, referenceDate = new Date()) {
  if (!cat) {
    return {
      isAvailableNow: true,
      isRestricted: false,
      reason: 'available',
      label: '',
      hoursText: '',
      daysText: 'Todos los días',
      from12: '',
      to12: ''
    };
  }

  const hasTimeRestriction = Boolean(cat.available_from || cat.available_to);
  const config = cat.visibility_config || {};
  const allowedDays = Array.isArray(config.days) && config.days.length > 0 
    ? config.days 
    : [0, 1, 2, 3, 4, 5, 6];
  const hasDayRestriction = allowedDays.length < 7;

  if (!hasTimeRestriction && !hasDayRestriction) {
    return {
      isAvailableNow: true,
      isRestricted: false,
      reason: 'available',
      label: '',
      hoursText: '',
      daysText: 'Todos los días',
      from12: '',
      to12: ''
    };
  }

  const now = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const currentDay = now.getDay();
  const isDayAllowed = allowedDays.includes(currentDay);

  const parseMinutes = (t) => {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    return (h * 60) + (m || 0);
  };

  const fromMin = parseMinutes(cat.available_from);
  const toMin = parseMinutes(cat.available_to);
  const currentMin = (now.getHours() * 60) + now.getMinutes();

  let isTimeAllowed = true;
  if (fromMin !== null && toMin !== null) {
    isTimeAllowed = fromMin < toMin
      ? (currentMin >= fromMin && currentMin <= toMin)
      : (currentMin >= fromMin || currentMin <= toMin);
  } else if (fromMin !== null) {
    isTimeAllowed = currentMin >= fromMin;
  } else if (toMin !== null) {
    isTimeAllowed = currentMin <= toMin;
  }

  const isAvailableNow = isDayAllowed && isTimeAllowed;
  const reason = !isDayAllowed ? 'day_blocked' : (!isTimeAllowed ? 'time_blocked' : 'available');

  const from12 = formatTime12h(cat.available_from);
  const to12 = formatTime12h(cat.available_to);

  let hoursText = '';
  if (from12 && to12) {
    hoursText = `${from12} a ${to12}`;
  } else if (from12) {
    hoursText = `desde las ${from12}`;
  } else if (to12) {
    hoursText = `hasta las ${to12}`;
  }

  const dayNamesShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  let daysText = 'Todos los días';
  if (allowedDays.length === 5 && [1, 2, 3, 4, 5].every(d => allowedDays.includes(d))) {
    daysText = 'Lunes a Viernes';
  } else if (allowedDays.length === 2 && [0, 6].every(d => allowedDays.includes(d))) {
    daysText = 'Fines de semana';
  } else if (allowedDays.length < 7) {
    daysText = allowedDays.map(d => dayNamesShort[d]).join(', ');
  }

  let label = '';
  if (!isDayAllowed && hoursText) {
    label = `Solo ${daysText.toLowerCase()} (${hoursText})`;
  } else if (!isDayAllowed) {
    label = `Solo ${daysText.toLowerCase()}`;
  } else if (!isTimeAllowed && hoursText) {
    label = `Disponible de ${hoursText}`;
  } else if (hoursText) {
    label = `Horario: ${hoursText}`;
  }

  return {
    isAvailableNow,
    isRestricted: true,
    reason,
    label,
    hoursText,
    daysText,
    from12,
    to12,
    available_from: cat.available_from,
    available_to: cat.available_to,
    allowedDays
  };
}
