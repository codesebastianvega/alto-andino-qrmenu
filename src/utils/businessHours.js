/**
 * Checks if the restaurant is currently open based on the business hours settings.
 * 
 * @param {Array} businessHours - Array of business hour objects from the database.
 * @returns {Object} - { isOpen: boolean, message: string }
 */
export function isRestaurantOpen(businessHours) {
  if (!businessHours || businessHours.length === 0) {
    // Si no hay horarios explícitos configurados en DB, asumimos ABIERTO por defecto para permitir operar de inmediato
    return { isOpen: true, message: "" };
  }

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
  const currentTime = now.getHours() * 100 + now.getMinutes();

  // Find the settings for today
  const todayHours = businessHours.find(h => h.day_of_week === dayOfWeek);

  if (!todayHours) {
    // Si no hay restricción explícita para hoy, permitimos operar
    return { isOpen: true, message: "" }; 
  }

  if (todayHours.is_closed) {
    return { isOpen: false, message: "Lo sentimos, hoy estamos cerrados." };
  }

  const [openH, openM] = (todayHours.open_time || "00:00").split(':').map(Number);
  const [closeH, closeM] = (todayHours.close_time || "23:59").split(':').map(Number);

  const openTimeValue = openH * 100 + openM;
  const closeTimeValue = closeH * 100 + closeM;

  // Handle shifts that cross midnight (e.g. 18:00 to 02:00)
  if (closeTimeValue < openTimeValue) {
    // If current time is after opening OR before closing (next day)
    if (currentTime >= openTimeValue || currentTime < closeTimeValue) {
      return { isOpen: true, message: "" };
    }
  } else {
    // Normal shift
    if (currentTime >= openTimeValue && currentTime < closeTimeValue) {
      return { isOpen: true, message: "" };
    }
  }

  return { 
    isOpen: false, 
    message: `Estamos cerrados. Abrimos hoy de ${todayHours.open_time} a ${todayHours.close_time}.` 
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

