import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  DollarSign,
  ArrowDownRight,
  Sparkles,
  Camera,
  UploadCloud,
  Plus,
  Trash2,
  PackageCheck,
  RefreshCw,
  AlertCircle,
  FileText,
  Layers
} from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../../hooks/useFinance';
import { useAuth } from '../../../context/AuthContext';
import { useLocation } from '../../../context/LocationContext';
import { supabase } from '../../../config/supabase';
import { toast } from '../../Toast';
import {
  INGREDIENT_UNITS,
  parseReceiptText,
  parseReceiptImage,
  matchItemsWithInventory
} from '../../../utils/aiReceiptParser';

export default function RecordExpenseModal({ isOpen, onClose, accounts = [], onSave, onInventoryUpdated }) {
  const { activeBrand } = useAuth();
  const brandId = activeBrand?.id || localStorage.getItem('aa_active_brand_id');
  const { activeLocationId } = useLocation();

  const [category, setCategory] = useState('supplies');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [beneficiary, setBeneficiary] = useState('');
  const [saving, setSaving] = useState(false);

  // Existing ingredients from DB for real-time comparison
  const [existingIngredients, setExistingIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // AI & OCR parsing states
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [receiptImagePreview, setReceiptImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Sync default account when accounts change
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Load existing ingredients for matching
  const fetchBrandIngredients = async () => {
    if (!brandId) return;
    setLoadingIngredients(true);
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, purchase_unit, usage_unit, unit_cost, purchase_price, stock_current')
        .eq('brand_id', brandId);

      if (!error && data) {
        setExistingIngredients(data);
      }
    } catch (err) {
      console.warn('Could not fetch existing ingredients:', err);
    } finally {
      setLoadingIngredients(false);
    }
  };

  useEffect(() => {
    if (isOpen && brandId) {
      fetchBrandIngredients();
    }
  }, [isOpen, brandId]);

  if (!isOpen) return null;

  // ── AI Parse from text description ──
  const handleParseFromText = async () => {
    if (!description.trim()) {
      toast.error('Escribe primero los insumos en la descripción (ej: milanesa de pollo, salsa teriyaki)');
      return;
    }

    setIsAiProcessing(true);
    setAiStatus('Analizando texto con Gemini IA...');
    try {
      const result = await parseReceiptText(description);

      // Auto-fill amount if not already set or is 0
      const currentNumericAmount = Number(amount.replace(/\D/g, '') || 0);
      if (currentNumericAmount === 0 && result.totalAmount) {
        setAmount(String(result.totalAmount));
      }

      // Auto-fill beneficiary if empty
      if (!beneficiary.trim() && result.beneficiary) {
        setBeneficiary(result.beneficiary);
      }

      // Match items against database ingredients
      const matched = matchItemsWithInventory(result.items, existingIngredients);
      setParsedItems(matched);

      if (matched.length > 0) {
        toast.success(`✨ Se detectaron ${matched.length} insumo(s) listos para revisar.`);
      } else {
        toast('No se encontraron insumos específicos en el texto');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error al procesar insumos con IA');
    } finally {
      setIsAiProcessing(false);
      setAiStatus('');
    }
  };

  // ── AI Parse from photo upload ──
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);

    setIsAiProcessing(true);
    try {
      const result = await parseReceiptImage(file, (msg) => setAiStatus(msg));

      // Auto-fill amount from invoice total
      if (result.totalAmount) {
        setAmount(String(Math.round(result.totalAmount)));
      }

      // Auto-fill beneficiary
      if (result.beneficiary) {
        setBeneficiary(result.beneficiary);
      }

      // If description is empty, summarize
      if (!description.trim()) {
        const itemNames = result.items.map(i => i.name).slice(0, 4).join(', ');
        setDescription(`Compra de insumos: ${itemNames || 'Factura/Tirilla'}`);
      }

      // Match items with existing inventory
      const matched = matchItemsWithInventory(result.items, existingIngredients);
      setParsedItems(matched);

      toast.success(`🧾 Factura leída: ${matched.length} insumo(s) detectados.`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'No se pudo leer la factura con OCR');
    } finally {
      setIsAiProcessing(false);
      setAiStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Modify parsed items rows ──
  const handleToggleItem = (id) => {
    setParsedItems(prev =>
      prev.map(item => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleUpdateItemField = (id, field, value) => {
    setParsedItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        // If name changes, recheck against existing ingredients
        if (field === 'name') {
          const reCheck = matchItemsWithInventory([updated], existingIngredients)[0];
          return {
            ...updated,
            isNew: reCheck.isNew,
            existingId: reCheck.existingId,
            currentStock: reCheck.currentStock
          };
        }
        return updated;
      })
    );
  };

  const handleRemoveItem = (id) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddManualItem = () => {
    const newItem = {
      id: `manual_${Date.now()}`,
      selected: true,
      name: '',
      quantity: 1,
      unit: 'Unidad',
      cost: 0,
      isNew: true,
      existingId: null,
      currentStock: 0
    };
    setParsedItems(prev => [...prev, newItem]);
  };

  // ── Submit expense and sync inventory ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanAmount = Number(amount.replace(/\D/g, '') || 0);
    if (cleanAmount <= 0) {
      toast.error('Ingresa un monto válido para el gasto');
      return;
    }
    if (!description.trim()) {
      toast.error('Ingresa una descripción del gasto');
      return;
    }

    setSaving(true);
    try {
      // 1. Guardar gasto contable en finanzas
      await onSave({
        category,
        amount: cleanAmount,
        description,
        accountId: accountId || accounts[0]?.id,
        beneficiary: beneficiary.trim()
      });

      // 2. Si hay insumos seleccionados en categoría 'supplies', crearlos o actualizar stock
      const selectedItems = parsedItems.filter(i => i.selected && i.name.trim());
      let updatedCount = 0;
      let createdCount = 0;

      if (category === 'supplies' && selectedItems.length > 0 && brandId) {
        for (const item of selectedItems) {
          const qty = Number(item.quantity) || 1;
          const itemCost = Number(item.cost) || 0;
          const unitCost = qty > 0 ? (itemCost / qty) : 0;

          if (item.existingId) {
            // Actualizar stock de insumo existente
            const currentStock = Number(item.currentStock) || 0;
            const newStock = currentStock + qty;

            const updatePayload = {
              stock_current: newStock,
              updated_at: new Date().toISOString()
            };
            if (itemCost > 0) {
              updatePayload.purchase_price = itemCost;
              updatePayload.unit_cost = unitCost;
            }

            const { error: updErr } = await supabase
              .from('ingredients')
              .update(updatePayload)
              .eq('id', item.existingId)
              .eq('brand_id', brandId);

            if (!updErr) {
              updatedCount++;
              // Actualizar location_inventory si hay sede específica
              if (activeLocationId && activeLocationId !== 'all') {
                const { data: locInv } = await supabase
                  .from('location_inventory')
                  .select('id, stock_quantity')
                  .eq('ingredient_id', item.existingId)
                  .eq('location_id', activeLocationId)
                  .maybeSingle();

                if (locInv) {
                  await supabase
                    .from('location_inventory')
                    .update({
                      stock_quantity: (Number(locInv.stock_quantity) || 0) + qty,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', locInv.id);
                } else {
                  await supabase
                    .from('location_inventory')
                    .insert([{
                      location_id: activeLocationId,
                      ingredient_id: item.existingId,
                      stock_quantity: newStock,
                      min_stock: 0
                    }]);
                }
              }
            }
          } else {
            // Crear nuevo insumo en la base de datos
            const newIngredient = {
              brand_id: brandId,
              name: item.name.trim(),
              description: 'Ingresado vía registro de gasto operativo',
              purchase_price: itemCost,
              purchase_quantity: qty,
              purchase_unit: item.unit || 'Unidad',
              usage_unit: (item.unit || 'unidad').toLowerCase(),
              unit_cost: unitCost,
              stock_current: qty,
              stock_min: 0,
              is_active: true,
              category: 'Insumos Generales'
            };

            const { data: inserted, error: insErr } = await supabase
              .from('ingredients')
              .insert([newIngredient])
              .select('id')
              .single();

            if (!insErr && inserted) {
              createdCount++;
              // Link to location
              if (activeLocationId && activeLocationId !== 'all') {
                await supabase
                  .from('location_inventory')
                  .insert([{
                    location_id: activeLocationId,
                    ingredient_id: inserted.id,
                    stock_quantity: qty,
                    min_stock: 0
                  }]);
              }
            }
          }
        }

        if (createdCount > 0 || updatedCount > 0) {
          toast.success(
            `📦 Inventario actualizado: ${createdCount} creado(s), ${updatedCount} reabastecido(s).`
          );
          if (onInventoryUpdated) onInventoryUpdated();
        }
      }

      onClose();
      // Reset
      setAmount('');
      setDescription('');
      setBeneficiary('');
      setParsedItems([]);
      setReceiptImagePreview(null);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el gasto');
    } finally {
      setSaving(false);
    }
  };

  const isSupplies = category === 'supplies';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`bg-white rounded-3xl shadow-2xl w-full my-6 overflow-hidden border border-gray-100 transition-all ${
            isSupplies ? 'max-w-2xl md:max-w-3xl' : 'max-w-lg'
          }`}
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-rose-950 via-rose-900 to-gray-900 text-white relative">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ArrowDownRight size={22} />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-rose-400">
                  Salida de Dinero & Inventario
                </span>
                <h3 className="text-lg font-black text-white">Registrar Gasto Operativo</h3>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Monto & Cuenta Origen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                  Monto del Gasto ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-base">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="0"
                    value={amount ? Number(amount.replace(/\D/g, '')).toLocaleString('es-CO') : ''}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-2xl font-black text-lg text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                  ¿De qué bolsillo sale el dinero?
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3.5 py-3 bg-gray-50 border border-gray-300 rounded-2xl text-xs font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — Saldo: ${Number(acc.balance || 0).toLocaleString('es-CO')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                Categoría del Gasto
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EXPENSE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      category === cat.id
                        ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── CAJA INTELIGENTE DE INSUMOS & IA (Si es Insumos y Materia Prima) ─── */}
            {isSupplies && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/70 via-amber-50/40 to-emerald-50/50 border border-rose-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">
                        Entrada Inteligente de Insumos con IA
                      </h4>
                      <p className="text-[11px] text-gray-600 font-medium">
                        Crea o suma existencias a tu inventario desde texto o foto de la tirilla.
                      </p>
                    </div>
                  </div>

                  {/* Subir foto de tirilla / factura */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="receipt-photo-upload"
                    />
                    <label
                      htmlFor="receipt-photo-upload"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 cursor-pointer font-bold text-xs shadow-xs transition-colors"
                    >
                      <Camera size={14} />
                      <span>{receiptImagePreview ? 'Cambiar Foto' : '📷 Foto Factura'}</span>
                    </label>
                  </div>
                </div>

                {/* Previsualización de Foto si existe */}
                {receiptImagePreview && (
                  <div className="flex items-center gap-3 p-2 bg-white/80 rounded-xl border border-rose-100">
                    <img
                      src={receiptImagePreview}
                      alt="Tirilla"
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-xs"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">Foto de tirilla cargada</p>
                      <p className="text-[10px] text-gray-500">Texto y montos escaneados con OCR</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiptImagePreview(null)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Status indicator during AI / OCR */}
                {isAiProcessing && (
                  <div className="flex items-center gap-2 p-2.5 bg-rose-100/70 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold animate-pulse">
                    <RefreshCw size={14} className="animate-spin text-rose-600" />
                    <span>{aiStatus || 'Procesando con IA...'}</span>
                  </div>
                )}
              </div>
            )}

            {/* Descripción con botón de desglosar con IA */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black text-gray-700 uppercase">
                  Descripción / Concepto
                </label>
                {isSupplies && (
                  <button
                    type="button"
                    onClick={handleParseFromText}
                    disabled={isAiProcessing || !description.trim()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline disabled:opacity-40"
                  >
                    <Sparkles size={12} />
                    <span>Desglosar Insumos con IA</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={
                    isSupplies
                      ? 'Ej: milanesa de pollo, salsa teriyaki, salsa de soya'
                      : 'Ej: Pago de turno cocina fin de semana'
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Beneficiario / Proveedor (Opcional) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Beneficiario / Proveedor (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Distribuidora Don Pedro, Carnicería Central"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* ─── TABLA DE REVISIÓN Y EDICIÓN DE INSUMOS ─── */}
            {isSupplies && (
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <PackageCheck size={16} className="text-emerald-600" />
                    <span className="text-xs font-black text-gray-800 uppercase">
                      Insumos a Ingresar al Inventario ({parsedItems.filter(i => i.selected).length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] transition-colors"
                  >
                    <Plus size={12} />
                    <span>Añadir Insumo</span>
                  </button>
                </div>

                {parsedItems.length === 0 ? (
                  <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                    <p className="text-[11px] text-gray-500">
                      💡 Escribe los productos en la descripción y pulsa <strong>"Desglosar con IA"</strong> o sube una foto para armar la tabla automáticamente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {parsedItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2 ${
                          item.selected
                            ? 'bg-white border-gray-200 shadow-2xs'
                            : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => handleToggleItem(item.id)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-gray-300 cursor-pointer"
                          />

                          {/* Badge: Nuevo vs Reposición */}
                          {item.isNew ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black tracking-tight uppercase whitespace-nowrap">
                              ✨ Nuevo
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black tracking-tight uppercase whitespace-nowrap" title={`Stock actual: ${item.currentStock}`}>
                              🔄 Stock ({item.currentStock})
                            </span>
                          )}
                        </div>

                        {/* Nombre del insumo */}
                        <div className="flex-1 min-w-[140px] w-full">
                          <input
                            type="text"
                            placeholder="Nombre del insumo"
                            value={item.name}
                            onChange={(e) => handleUpdateItemField(item.id, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-gray-50 focus:bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                          />
                        </div>

                        {/* Cantidad & Unidad */}
                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            placeholder="Cant."
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemField(item.id, 'quantity', e.target.value)}
                            className="w-20 px-2 py-1.5 bg-gray-50 focus:bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 text-center focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                          />

                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdateItemField(item.id, 'unit', e.target.value)}
                            className="px-2 py-1.5 bg-gray-50 focus:bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                          >
                            {INGREDIENT_UNITS.map(u => (
                              <option key={u.value} value={u.value}>
                                {u.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Costo opcional & Eliminar */}
                        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                          <div className="relative w-24">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">$</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="Costo"
                              value={item.cost || ''}
                              onChange={(e) => handleUpdateItemField(item.id, 'cost', e.target.value)}
                              className="w-full pl-5 pr-1.5 py-1.5 bg-gray-50 focus:bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 text-right focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                              title="Costo total de este insumo"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            title="Eliminar insumo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !amount || !description}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar y Guardar Gasto</span>
                    <Check size={14} />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
