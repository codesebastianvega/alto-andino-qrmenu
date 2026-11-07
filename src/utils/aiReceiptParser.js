import imageCompression from 'browser-image-compression';
import { supabase } from '../config/supabase';

export const INGREDIENT_UNITS = [
  { value: 'Unidad', label: 'Unidad (ud)' },
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'g', label: 'Gramo (g)' },
  { value: 'Litro', label: 'Litro (L)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'botella', label: 'Botella (bot)' },
  { value: 'paquete', label: 'Paquete (paq)' },
  { value: 'atado', label: 'Atado (atado)' },
  { value: 'porción', label: 'Porción (porc)' }
];

function normalizeStr(str = '') {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Match parsed items with current database ingredients
 */
export function matchItemsWithInventory(items = [], existingIngredients = []) {
  return items.map((item, idx) => {
    const normName = normalizeStr(item.name);
    // Remove plurals and common words
    const stemName = normName
      .replace(/s\b/g, '')
      .replace(/\b(de|la|el|los|las|un|una)\b/g, '')
      .trim();

    const matched = existingIngredients.find(ing => {
      const ingNorm = normalizeStr(ing.name);
      const ingStem = ingNorm
        .replace(/s\b/g, '')
        .replace(/\b(de|la|el|los|las|un|una)\b/g, '')
        .trim();

      return (
        ingNorm === normName ||
        ingStem === stemName ||
        ingNorm.includes(stemName) ||
        stemName.includes(ingNorm)
      );
    });

    if (matched) {
      return {
        id: item.id || `item_${Date.now()}_${idx}`,
        selected: true,
        name: matched.name, // Use existing canonical name
        quantity: Number(item.quantity) || 1,
        unit: matched.purchase_unit || item.unit || 'Unidad',
        cost: Number(item.cost) || 0,
        isNew: false,
        existingId: matched.id,
        currentStock: Number(matched.stock_current) || 0
      };
    }

    return {
      id: item.id || `item_${Date.now()}_${idx}`,
      selected: true,
      name: item.name || 'Nuevo Insumo',
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'Unidad',
      cost: Number(item.cost) || 0,
      isNew: true,
      existingId: null,
      currentStock: 0
    };
  });
}

/**
 * Parse text description using Gemini via generate-ai-text edge function
 */
export async function parseReceiptText(rawText) {
  if (!rawText || !rawText.trim()) {
    throw new Error('El texto para analizar está vacío');
  }

  const prompt = `
Eres un asistente experto en compras, contabilidad y suministros de cocina para restaurantes.
Analiza el siguiente texto (que puede ser una lista de mercado, la descripción de un gasto o el texto extraído de una factura/tirilla OCR) y extrae los insumos en un formato JSON estructurado.

Devuelve EXCLUSIVAMENTE este JSON (sin texto adicional ni explicaciones):
{
  "totalAmount": 13330,
  "beneficiary": "Distribuidora Don Pedro",
  "items": [
    {
      "name": "Milanesa de pollo",
      "quantity": 2,
      "unit": "Unidad",
      "cost": 10000
    }
  ]
}

Reglas estrictas:
1. "unit" DEBE ser exactamente una de estas opciones: "kg", "g", "Unidad", "Litro", "ml", "botella", "paquete", "atado", "porción".
2. "name" debe ser claro, en singular y con mayúscula inicial (ejemplo: "Milanesa de pollo", "Salsa teriyaki", "Salsa de soya", "Limón Tahití", "Aceite vegetal").
3. Si el texto no menciona explícitamente la cantidad, asume 1.
4. Si detectas un total global en el texto o factura, asígnalo a "totalAmount" como número entero o flotante. Si no lo hay, pon null o suma los costos.
5. Si detectas el nombre de la empresa, distribuidora, tienda o persona proveedora, asígnalo a "beneficiary". Si no lo hay, pon null.
6. "cost": Si cada producto tiene un valor unitario o total, asígnalo como número. Si solo hay un monto total general, distribúyelo proporcionalmente entre los items. Si no hay precios, pon 0.

Texto a analizar:
"""
${rawText.slice(0, 8000)}
"""
`;

  const { data, error } = await supabase.functions.invoke('generate-ai-text', {
    body: { prompt }
  });

  if (error) {
    throw new Error(error.message || 'Error al conectar con la IA');
  }

  const rawJson = data?.text || '';
  // Extract JSON block if surrounded by markdown backticks
  const cleaned = rawJson
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      totalAmount: parsed.totalAmount ? Number(parsed.totalAmount) : null,
      beneficiary: parsed.beneficiary ? String(parsed.beneficiary).trim() : null,
      items: Array.isArray(parsed.items) ? parsed.items : []
    };
  } catch (err) {
    console.error('Failed to parse JSON from AI:', rawJson);
    throw new Error('La IA no pudo estructurar los insumos. Intenta escribir con nombres claros separados por comas.');
  }
}

/**
 * Compress and run OCR on a receipt/invoice photo, then parse with AI
 */
export async function parseReceiptImage(file, onProgress = () => {}) {
  onProgress('Comprimiendo imagen...');
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
    useWebWorker: true
  };
  const compressedFile = await imageCompression(file, options);

  onProgress('Leyendo texto de la factura con OCR...');
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('spa+eng');
  
  const ret = await worker.recognize(compressedFile);
  await worker.terminate();

  const ocrText = ret.data?.text || '';
  if (!ocrText.trim()) {
    throw new Error('No se detectó texto legible en la imagen. Intenta con una foto más clara o escribe los insumos en la descripción.');
  }

  onProgress('Extrayendo insumos, precios y proveedor con IA...');
  const result = await parseReceiptText(ocrText);
  return {
    ...result,
    rawOcrText: ocrText
  };
}
