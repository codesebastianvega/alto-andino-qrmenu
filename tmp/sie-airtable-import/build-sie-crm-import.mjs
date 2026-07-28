import fs from 'node:fs/promises';
import path from 'node:path';

const root = 'D:/BUSSINESS CHAN/CHAN/Programacion/Web-Sie-Travel-App/sie-mvp/notion_csvs/23-24';
const inputs = {
  gf2023: path.join(root, 'Base de datos Google Forms 2023 6d0251ab7a8649e496737a6fa6299702_all.csv'),
  manual2023: path.join(root, 'Base de Datos Manual 2023 fcfa05b14da1454ab0fca8450c2f3f47_all.csv'),
  form2024: path.join(root, 'Formulario de Inscripción SIE 2024 a2e0120a89c843d1bc13237f22a6e791_all.csv'),
};

const outDir = 'D:/BUSSINESS CHAN/CHAN/Programacion/alto-andino-qrmenu/tmp/sie-airtable-import';

function parseCsv(text) {
  text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift();
  return rows
    .filter((r) => r.some((v) => String(v || '').trim()))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows, headers) {
  return [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(',')),
  ].join('\n');
}

const monthMap = {
  enero: '01',
  febrero: '02',
  marzo: '03',
  abril: '04',
  mayo: '05',
  junio: '06',
  julio: '07',
  agosto: '08',
  septiembre: '09',
  setiembre: '09',
  octubre: '10',
  noviembre: '11',
  diciembre: '12',
};

function parseDate(value) {
  const s = clean(value);
  if (!s) return '';
  let m = s.match(/^(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})$/i);
  if (m) {
    const month = monthMap[m[2].toLowerCase()];
    if (month) return `${m[3]}-${month}-${m[1].padStart(2, '0')}`;
  }
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return '';
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function cleanPhone(value) {
  const s = clean(value);
  if (!s) return '';
  let phone = s.replace(/[^0-9+]/g, '');
  if (phone.startsWith('00')) phone = `+${phone.slice(2)}`;
  if (!phone.startsWith('+') && phone.length === 10 && phone.startsWith('3')) {
    phone = `+57${phone}`;
  }
  return phone;
}

function normalizedPhoneKey(phone) {
  const digits = clean(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 12 && digits.startsWith('57')) return digits;
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return digits;
  return digits;
}

function normalizedEmail(value) {
  return clean(value).toLowerCase();
}

function normalizeLevel(value) {
  const s = clean(value).toLowerCase();
  if (!s) return 'Sin dato';
  if (s.includes('profesional')) return 'Profesional - 6';
  if (s.includes('avanzado')) return 'Avanzado - 5';
  if (s.includes('experto')) return 'Experto - 4';
  if (s.includes('intermedio')) return 'Intermedio - 3';
  if (s.includes('principiante')) return 'Principiante - 2';
  if (s.includes('novato')) return 'Novato - 1';
  return 'Sin dato';
}

function sourceLabel(source) {
  if (source === 'gf2023') return 'Google Forms 2023';
  if (source === 'manual2023') return 'Manual 2023';
  return 'Formulario 2024';
}

function dedupeKey(record) {
  const phone = normalizedPhoneKey(record.phone);
  if (phone) return `tel:${phone}`;
  if (record.email) return `email:${record.email}`;
  return `name:${clean(record.name).toLowerCase()}`;
}

const allRows = [];
for (const [source, inputPath] of Object.entries(inputs)) {
  const rows = parseCsv(await fs.readFile(inputPath, 'utf8'));
  for (const row of rows) {
    let record;
    if (source === 'gf2023') {
      record = {
        source,
        name: clean(row.Nombre),
        email: normalizedEmail(row['Correo electrónico']),
        phone: cleanPhone(row['Número de teléfono']),
        activity: clean(row['¿Qué actividad vas a realizar con nosotros?']),
        date: parseDate(row['¿Fecha de tu actividad?']),
        level: normalizeLevel(row['¿Cuál es tu nivel de experiencia en senderismo? Por favor, selecciona una de las siguientes opciones:']),
        paid: '',
        operationalNotes: '',
      };
    } else if (source === 'manual2023') {
      record = {
        source,
        name: clean(row.NOMBRE),
        email: normalizedEmail(row.EMAIL),
        phone: cleanPhone(row.TELEFONO),
        activity: 'Registro manual 2023',
        date: parseDate(row.Fecha),
        level: 'Sin dato',
        paid: '',
        operationalNotes: 'Registro manual 2023; el CSV no trae actividad especifica.',
      };
    } else {
      record = {
        source,
        name: clean(row['Nombre Completo']),
        email: normalizedEmail(row['E-Mail']),
        phone: cleanPhone(row['Número de Contacto']),
        activity: clean(row['¿Qué actividad vas a realizar con nosotros?']),
        date: parseDate(row['¿Fecha de tu actividad?']),
        level: normalizeLevel(row.Experiencia),
        paid: /^(yes|true|si|sí|1)$/i.test(clean(row.Pago)) ? 'Yes' : '',
        operationalNotes: clean(row.Notas),
      };
    }
    if (!record.name && !record.email && !record.phone) continue;
    record.key = dedupeKey(record);
    allRows.push(record);
  }
}

const clientMap = new Map();
for (const row of allRows) {
  const existing = clientMap.get(row.key) || {
    key: row.key,
    name: row.name,
    email: row.email,
    phone: row.phone,
    level: row.level,
    source: row.source,
    lastDate: '',
    count: 0,
  };
  if (!existing.name && row.name) existing.name = row.name;
  if (!existing.email && row.email) existing.email = row.email;
  if (!existing.phone && row.phone) existing.phone = row.phone;
  if ((!existing.level || existing.level === 'Sin dato') && row.level !== 'Sin dato') {
    existing.level = row.level;
  }
  if (row.date && (!existing.lastDate || row.date > existing.lastDate)) {
    existing.lastDate = row.date;
  }
  existing.count += 1;
  clientMap.set(row.key, existing);
}

const clients = [...clientMap.values()]
  .sort((a, b) => clean(a.name).localeCompare(clean(b.name), 'es'))
  .map((client) => ({
    Nombre: client.name || client.email || client.phone || client.key,
    WhatsApp: client.phone,
    Email: client.email,
    'Estado del cliente': client.count >= 3 ? 'Recurrente' : 'Activo',
    'Nivel de experiencia': client.level || 'Sin dato',
    'Fuente original': sourceLabel(client.source),
    'Ultima actividad': client.lastDate,
    'Clave deduplicacion': client.key,
    'No migrar datos sensibles': 'Yes',
    'Notas comerciales': `Migrado desde ${sourceLabel(client.source)}. Participaciones historicas detectadas: ${client.count}.`,
    'Observaciones de migracion': 'Migracion inicial desde CSV Notion 2023-2024. No se migraron documento, nacimiento ni datos medicos al CRM comercial.',
  }));

const participations = allRows.map((row, index) => ({
  Participacion: `${row.name || row.email || row.phone || 'Cliente'} - ${row.date || 'sin fecha'} - ${row.activity || 'sin actividad'}`,
  'Clave cliente': row.key,
  'Cliente nombre importado': row.name,
  'Fecha de actividad': row.date,
  'Experiencia realizada': row.activity,
  'Fuente historica': sourceLabel(row.source),
  'Estado de participacion': row.date ? 'Asistio' : 'Registrado',
  'Pago confirmado': row.paid,
  'Nivel reportado': row.level || 'Sin dato',
  'Notas operativas': row.operationalNotes,
  'Orden importacion': index + 1,
}));

const clientHeaders = [
  'Nombre',
  'WhatsApp',
  'Email',
  'Estado del cliente',
  'Nivel de experiencia',
  'Fuente original',
  'Ultima actividad',
  'Clave deduplicacion',
  'No migrar datos sensibles',
  'Notas comerciales',
  'Observaciones de migracion',
];
const participationHeaders = [
  'Participacion',
  'Clave cliente',
  'Cliente nombre importado',
  'Fecha de actividad',
  'Experiencia realizada',
  'Fuente historica',
  'Estado de participacion',
  'Pago confirmado',
  'Nivel reportado',
  'Notas operativas',
  'Orden importacion',
];

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, 'airtable-clientes-limpio.csv'), toCsv(clients, clientHeaders), 'utf8');
await fs.writeFile(path.join(outDir, 'airtable-participaciones-limpio.csv'), toCsv(participations, participationHeaders), 'utf8');
await fs.writeFile(
  path.join(outDir, 'migration-summary.json'),
  JSON.stringify({
    inputRows: Object.fromEntries(await Promise.all(Object.entries(inputs).map(async ([key, inputPath]) => [key, parseCsv(await fs.readFile(inputPath, 'utf8')).length]))),
    totalParticipations: participations.length,
    uniqueClients: clients.length,
    duplicateParticipations: participations.length - clients.length,
    clientsWithoutPhone: clients.filter((c) => !c.WhatsApp).length,
    clientsWithoutEmail: clients.filter((c) => !c.Email).length,
  }, null, 2),
  'utf8',
);

console.log(`Clientes: ${clients.length}`);
console.log(`Participaciones: ${participations.length}`);
