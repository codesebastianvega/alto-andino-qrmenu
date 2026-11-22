export const HOURS_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_WORDS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const normalize = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function isHoursConversation(message, previous) {
  const text = normalize(message);
  if (/\b(receta|ingrediente|precio|producto|croissant|consultar|compra|domicilio)\b/.test(text) && !/\bhorarios?\b/.test(text)) return false;
  return /\bhorarios?\b|\b(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b.*\b(?:abre|abrimos|cerrado|cerrada|de|desde)\b/.test(text)
    || (DAY_WORDS.some((day) => new RegExp(`\\b${day}s?\\b`).test(text)) && /\b(abre|abrimos|cerramos|apertura|cierre)\b/.test(text))
    || previous?.operation === 'hours';
}

function parseDays(text) {
  if (/todos los dias|toda la semana/.test(text)) return [0, 1, 2, 3, 4, 5, 6];
  const expression = DAY_WORDS.join('|');
  const range = text.match(new RegExp(`(${expression})\\s+(?:a|hasta|al)\\s+(${expression})`));
  const result = new Set();
  if (range) {
    let day = DAY_WORDS.indexOf(range[1]);
    const last = DAY_WORDS.indexOf(range[2]);
    for (let count = 0; count < 7; count++, day = (day + 1) % 7) { result.add(day); if (day === last) break; }
  }
  DAY_WORDS.forEach((word, day) => { if (new RegExp(`\\b${word}s?\\b`).test(text)) result.add(day); });
  return [...result].sort((a, b) => a - b);
}

function parseTime(hour, minutes, period) {
  let value = Number(hour);
  if (value > 23 || Number(minutes || 0) > 59) return null;
  const meridian = normalize(period).replace(/\./g, '').trim();
  if (meridian) {
    if (value < 1 || value > 12 || (value === 12 && !['am', 'pm'].includes(meridian))) return null;
    value %= 12;
    if (['pm', 'tarde', 'noche'].includes(meridian)) value += 12;
  } else if (!minutes && value < 13) return null; // 8 → 6 has no safe AM/PM assumption.
  return `${String(value).padStart(2, '0')}:${minutes || '00'}`;
}

function parseTimes(text) {
  const numberWords = { una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12 };
  const value = text.replace(/\b(una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)\b/g, (word) => numberWords[word]);
  const time = '(\\d{1,2})(?::(\\d{2}))?\\s*(?:(?:de la|en la)\\s+)?(manana|tarde|noche|madrugada|a\\.?m\\.?|p\\.?m\\.?)?';
  const interval = `\\b${time}\\s*(?:a|hasta)(?:\\s+las)?\\s*${time}(?![\\d:])`;
  const match = value.match(new RegExp(interval));
  if (!match) return null;
  const open = parseTime(match[1], match[2], match[3]);
  const close = parseTime(match[4], match[5], match[6]);
  const moreDays = new RegExp(`\\b(?:${DAY_WORDS.join('|')})s?\\b`).test(value.slice(match.index + match[0].length));
  return { open_time: open, close_time: close, valid: Boolean(open && close && open < close), multiple: moreDays || [...value.matchAll(new RegExp(interval, 'g'))].length > 1 };
}

export function beginHoursTurn({ message, previous, locations, selectedLocationId, scope, turnId }) {
  const prior = previous?.scope === scope && previous.operation === 'hours' ? previous : null;
  const text = normalize(message);
  if (prior && /\b(recuper|retom)\w*/.test(text) && ['executed', 'dismissed', 'unconfirmed'].includes(prior.status)) return { ...prior, turnId, ready: false };
  const days = parseDays(text);
  const times = parseTimes(text);
  const closed = /\bcerrad[oa]s?\b/.test(text);
  const matches = locations.filter((location) => text.includes(normalize(location.name)));
  const selected = locations.find((location) => location.id === selectedLocationId);
  const unknownLocation = /\bsede\s+(?!actual\b|seleccionada\b)/.test(text) && !matches.length;
  const location = matches.length === 1 ? matches[0] : matches.length > 1 || unknownLocation ? null : prior?.location || selected || null;
  const entries = { ...(days.length && /\bsolo\b/.test(text) ? {} : prior?.entries || {}) };
  const targetDays = days.length ? days : prior?.pendingDays || [];
  let pendingDays = days.length ? days : prior?.pendingDays || [];
  let timeProblem = prior?.timeProblem || false;
  // A single interval can only be applied to one stated group of days.
  const multipleIntervals = times?.multiple || (closed && times);
  if (targetDays.length && !multipleIntervals && (closed || times?.valid)) {
    for (const day of targetDays) entries[day] = { day_of_week: day, open_time: closed ? '00:00' : times.open_time, close_time: closed ? '00:00' : times.close_time, is_closed: closed };
    pendingDays = [];
    timeProblem = false;
  } else if ((times && !times.valid) || multipleIntervals) timeProblem = true;
  else if (times?.valid) timeProblem = false;
  let pendingTimes = !days.length && !targetDays.length && times?.valid ? times : prior?.pendingTimes;
  if (days.length && !times && !closed && pendingTimes && !timeProblem) {
    for (const day of days) entries[day] = { day_of_week: day, open_time: pendingTimes.open_time, close_time: pendingTimes.close_time, is_closed: false };
    pendingDays = [];
    pendingTimes = undefined;
  }
  if (targetDays.length && (closed || times?.valid) && !multipleIntervals) pendingTimes = undefined;
  const consultRequested = /antes.*(?:dime|pregunt|necesit)|que informacion|solo (?:consult|orient)|no (?:guard|apliqu|cambi)|sin guardar/.test(text);
  const reviewRequested = /(?:muestra|muestrame|prepara|preparar|revisa|ver|quiero ver).*(?:propuesta|resumen)|ya puedes preparar/.test(text)
    || (prior?.reviewOffered && /^(?:si|si[,.]? por favor|adelante|de acuerdo|muestramela)[.!\s]*$/.test(text.trim()));
  const consultFirst = consultRequested || (prior?.consultFirst && !reviewRequested);
  const missing = [];
  if (!location) missing.push('location');
  if (!Object.keys(entries).length && !pendingDays.length) missing.push('days');
  if (pendingDays.length || (!Object.keys(entries).length && !pendingTimes) || timeProblem) missing.push('time');
  return { scope, turnId, operation: 'hours', product: null, location, locations, entries, pendingDays, pendingTimes,
    timeProblem, consultFirst, missing, reviewOffered: missing.length === 0 && consultFirst,
    sourceMessage: message, ready: missing.length === 0 && !consultFirst, idempotencyKey: crypto.randomUUID() };
}

const formatTime = (time) => { const [hour, minutes] = time.split(':').map(Number); return `${hour % 12 || 12}:${String(minutes).padStart(2, '0')} ${hour < 12 ? 'a. m.' : 'p. m.'}`; };
export const describeHoursRow = (row) => row.is_closed ? 'Cerrado' : `${formatTime(row.open_time)} a ${formatTime(row.close_time)}`;

export function hoursConversationReply(task, currentHours = []) {
  if (task.status === 'executed') return { reply: `Los horarios de ${task.location.name} ya se guardaron. Si necesitas otro cambio, dime qué días y horas quieres modificar.`, card: null };
  if (['dismissed', 'unconfirmed'].includes(task.status)) return { reply: 'Esa propuesta ya no se puede aprobar. Dime qué días y horas quieres revisar para preparar una nueva con el horario actual.', card: null };
  const rows = Object.values(task.entries).sort((a, b) => a.day_of_week - b.day_of_week);
  const lines = rows.map((row) => `${HOURS_DAYS[row.day_of_week]}: ${describeHoursRow(row)}`);
  const known = lines.length ? `Conservé estos horarios: ${lines.join('; ')} ` : task.pendingTimes ? `Conservé el horario de ${formatTime(task.pendingTimes.open_time)} a ${formatTime(task.pendingTimes.close_time)} ` : '';
  const scope = task.location ? `Sede: ${task.location.name}. ` : '';
  if (task.missing.length || !task.ready) {
    let question;
    if (task.missing.includes('location')) question = `¿En qué sede quieres aplicarlos? ${task.locations.map((location) => location.name).join(', ')}.`;
    else if (task.missing.includes('days')) question = '¿Qué días quieres configurar?';
    else if (task.missing.includes('time')) question = `¿A qué hora abre y cierra${task.pendingDays.length ? ` ${task.pendingDays.map((day) => HOURS_DAYS[day]).join(', ')}` : ''}? Indica mañana o tarde, por ejemplo, de 8 de la mañana a 6 de la tarde. Si hay varios turnos, revisemos un grupo de días a la vez.`;
    else question = 'Tengo los días, las horas y la sede. Los días no mencionados conservarán su horario actual. ¿Te muestro la propuesta para revisarla?';
    return { reply: `${known}${scope}${question} No he guardado cambios.`, card: null };
  }
  const untouched = HOURS_DAYS.filter((_, day) => !task.entries[day]);
  return { reply: `Esta es la propuesta para ${task.location.name}. Solo cambiarán los días indicados. Revisa el detalle; se guardará únicamente si pulsas «Aprobar horarios».`, card: {
    type: 'proposal', title: `Horarios de ${task.location.name}`, summary: `Sede: ${task.location.name}. ${untouched.length ? `Sin cambios: ${untouched.join(', ')}.` : 'Se modificarán los siete días indicados.'}`,
    beforeAfter: rows.map((row) => { const before = currentHours.find((item) => item.location_id === task.location.id && item.day_of_week === row.day_of_week); const general = currentHours.find((item) => item.location_id === null && item.day_of_week === row.day_of_week); return { label: HOURS_DAYS[row.day_of_week], before: before ? describeHoursRow(before) : general ? `Horario general: ${describeHoursRow(general)}` : 'Sin horario propio registrado', after: describeHoursRow(row) }; }),
    riskLevel: 'medium', action: 'update_business_hours', approveLabel: 'Aprobar horarios', hoursTask: { ...task, card: undefined },
    turnId: task.turnId, binding: { scope: task.scope, operation: 'hours', productId: null },
  } };
}

export function buildHoursUpdateBody(task, brandId) {
  const rows = Object.values(task.entries || {});
  if (!task.ready || task.consultFirst || task.missing.length || !task.location?.id || !rows.length || rows.length > 7 || new Set(rows.map((row) => row.day_of_week)).size !== rows.length || rows.some((row) => !Number.isInteger(row.day_of_week) || row.day_of_week < 0 || row.day_of_week > 6 || typeof row.is_closed !== 'boolean' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(row.open_time) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(row.close_time) || (!row.is_closed && row.open_time >= row.close_time))) throw new Error('Revisa la sede, los días y las horas antes de aprobar.');
  return { brand_id: brandId, location_id: task.location.id, action: 'update_business_hours', proposal: { hours: rows.map(({ day_of_week, open_time, close_time, is_closed }) => ({ day_of_week, open_time, close_time, is_closed })) }, approved: true, idempotency_key: task.idempotencyKey };
}
