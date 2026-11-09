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
Eres un asistente experto contable y de auditoría de compras de cocina para restaurantes en Colombia.
Analiza el siguiente texto (extraído de una factura física, tirilla de caja o lista de mercado) y extrae ÚNICAMENTE los insumos, productos comestibles o suministros reales en un formato JSON estructurado.

Devuelve EXCLUSIVAMENTE este JSON (sin texto adicional ni explicaciones):
{
  "totalAmount": 37250,
  "beneficiary": "Tiendas D1",
  "items": [
    {
      "name": "Pan Árabe",
      "quantity": 1,
      "unit": "paquete",
      "cost": 3200
    }
  ]
}

Reglas estrictas e inviolables:
1. "unit" DEBE ser una de estas opciones exactas: "kg", "g", "Unidad", "Litro", "ml", "botella", "paquete", "atado", "porción".
2. "name": Debe ser claro, en singular y con mayúscula inicial (ejemplo: "Milanesa de pollo", "Pan Árabe", "Chorizo campesino", "Banano"). Omite códigos de barras, referencias numéricas o abreviaturas raras.
3. "cost": Si cada producto tiene un precio unitario o total legible, asígnalo como número.
   - NUNCA inventes costos.
   - NUNCA distribuyas el total general entre los productos si no figura el precio individual en el texto.
   - Si no hay precio claro para un item, pon cost: 0.
4. "totalAmount": El monto total final facturado. Si no está explícito o es ambiguo, pon null.
5. "beneficiary": El nombre de la tienda, proveedor, supermercado o distribuidora (ejemplo: "D1", "Ara", "Éxito", "Fruver Don Pedro"). Si no hay, pon null.
6. NO INCLUYAS COMO ITEMS: No agregues líneas de la tirilla como NIT, número de factura, resolución DIAN, fecha, cajero, tipo de pago, cambio, IVA, propinas, pie de página ni textos legales. Solo alimentos o suministros de cocina reales.
7. Si no estás seguro de que una palabra sea un producto de cocina, NO la inventes ni la agregues.

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
