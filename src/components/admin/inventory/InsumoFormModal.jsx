import { Icon } from '@iconify-icon/react';
import { Sparkles, Leaf } from 'lucide-react';
import Portal from '../../../components/Portal';
import { ModalHeader, FormField, TextInput, PrimaryButton, SecondaryButton } from '../ui';
import { getZeroWasteSuggestion } from '../../../utils/zeroWasteKnowledge';
import { getExpirationStatus } from '../../../utils/inventoryHelpers';

export function InsumoFormModal({
  isOpen = false,
  onClose,
  editing = null,
  form,
  f,
  handlePurchaseUnitChange,
  handleSave,
  unitCost = 0,
  categories = [],
  providers = [],
  locations = [],
  locationInventory = {},
  setLocationInventory
}) {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-3 md:p-6 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-200 overflow-hidden my-auto">
          <div className="shrink-0">
            <ModalHeader
              title={editing ? 'Editar insumo' : 'Nuevo insumo'}
              subtitle={editing ? editing.name : 'Completa los datos del nuevo insumo.'}
              onClose={onClose}
            />
            <div className="px-5 md:px-7 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Costo para recetas</p>
                <p className="text-lg font-black text-slate-900 tabular-nums mt-0.5">
                  ${unitCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  <span className="text-xs text-slate-400 font-medium ml-1">/{form.usage_unit || 'unidad'}</span>
                </p>
              </div>
              {/* Switch Activo / Inactivo */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className={`text-xs font-bold block ${form.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {form.is_active ? 'Insumo Activo' : 'Insumo Inactivo'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {form.is_active ? 'Visible en bodega y recetas' : 'Aparece tenue / desactivado'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => f('is_active', !form.is_active)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                    form.is_active ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs ${
                      form.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            <div className="px-5 md:px-7 py-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Nombre">
                <TextInput
                  required
                  value={form.name}
                  onChange={e => f('name', e.target.value)}
                  placeholder="Ej. Aguacate, Café, Pollo"
                />
              </FormField>
              <FormField label="SKU / Código">
                <TextInput
                  value={form.sku}
                  onChange={e => f('sku', e.target.value.toUpperCase())}
                  placeholder="INS-001"
                />
              </FormField>
              <FormField label="URL de Foto / Imagen (Opcional)">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 min-w-[48px] max-w-[48px] h-[48px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {form.image_url ? (
                      <>
                        <img
                          src={form.image_url}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://placehold.co/100x100/f1f5f9/94a3b8?text=Error';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => f('image_url', '')}
                          title="Quitar foto"
                          className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm transition-all z-10 cursor-pointer"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300">
                        <Icon icon="heroicons:photo" className="text-xl" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <TextInput
                      value={form.image_url || ''}
                      onChange={e => f('image_url', e.target.value)}
                      placeholder="https://... (Foto del producto / empaque)"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pega el enlace de una foto para identificar este insumo en bodega y recetas.
                </p>
              </FormField>
              <FormField label="Categoría">
                <select
                  required
                  value={form.category_id}
                  onChange={e => f('category_id', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none"
                >
                  <option value="">Seleccionar…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>
              <FormField label="Proveedor (Opcional)">
                <select
                  value={form.provider_id}
                  onChange={e => f('provider_id', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none"
                >
                  <option value="">Sin proveedor</option>
                  {providers?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </FormField>
              <FormField label="Unidad de uso en Recetas">
                <select
                  required
                  value={form.usage_unit}
                  onChange={e => f('usage_unit', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none"
                >
                  <option value="">Seleccionar unidad...</option>
                  <option value="Gramo">Gramo (g)</option>
                  <option value="Mililitro">Mililitro (ml)</option>
                  <option value="Unidad">Unidad (u)</option>
                  <option value="Onza">Onza (oz)</option>
                  <option value="Kilogramo">Kilogramo (kg)</option>
                  <option value="Litro">Litro (L)</option>
                  <option value="Libra">Libra (lb)</option>
                </select>
              </FormField>

              {/* Purchase calculator */}
              <div className="md:col-span-2 grid grid-cols-3 gap-4 p-5 bg-blue-50/50 rounded-xl border border-blue-100">
                <FormField label="Precio de compra">
                  <TextInput
                    type="number"
                    required
                    value={form.purchase_price === 0 ? '' : form.purchase_price}
                    onChange={e => f('purchase_price', Number(e.target.value))}
                    placeholder="Ej: 5000"
                  />
                </FormField>
                <FormField label="¿Cómo se compra?">
                  <select
                    required
                    value={form.purchase_unit}
                    onChange={e => handlePurchaseUnitChange(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none shadow-sm"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Gramos">Gramos</option>
                    <option value="Kilogramos">Kilogramos</option>
                    <option value="Mililitros">Mililitros</option>
                    <option value="Litros">Litros</option>
                    <option value="Unidades">Unidades</option>
                    <option value="Paquetes">Paquetes</option>
                    <option value="Cajas">Cajas</option>
                    <option value="Botellas">Botellas</option>
                    <option value="Latas">Latas</option>
                    <option value="Libras">Libras</option>
                    <option value="Onzas">Onzas</option>
                  </select>
                </FormField>
                <FormField label={`¿Cuántos ${form.usage_unit || 'g/ml'} trae?`}>
                  <TextInput
                    type="number"
                    required
                    value={form.purchase_quantity === 0 ? '' : form.purchase_quantity}
                    onChange={e => f('purchase_quantity', Number(e.target.value))}
                    placeholder="Ej: 1000"
                  />
                </FormField>
              </div>

              <FormField label="Stock actual (General)">
                <TextInput
                  type="number"
                  value={form.stock_current}
                  onChange={e => f('stock_current', Number(e.target.value))}
                />
              </FormField>
              <FormField label="Stock mínimo (General)">
                <TextInput
                  type="number"
                  value={form.stock_min}
                  onChange={e => f('stock_min', Number(e.target.value))}
                />
              </FormField>

              {/* Control de Frescura & Vencimiento (Opcional) */}
              <div className="md:col-span-2 p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 shadow-2xs">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">📅</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Control de Frescura & Vencimiento (Opcional)</h4>
                    <p className="text-[11px] text-slate-500 font-normal">Registra la fecha de recepción y caducidad para alertas de rescate, rotación FIFO y promociones.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Fecha de Recepción / Entrada">
                    <TextInput
                      type="date"
                      value={form.reception_date || ''}
                      onChange={e => f('reception_date', e.target.value)}
                    />
                  </FormField>
                  <FormField label="Fecha de Vencimiento / Caducidad">
                    <div className="flex flex-col gap-1.5">
                      <TextInput
                        type="date"
                        value={form.expiration_date || ''}
                        onChange={e => f('expiration_date', e.target.value)}
                      />
                      {form.expiration_date && (() => {
                        const status = getExpirationStatus(form.expiration_date);
                        if (!status) return null;
                        return (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 w-fit ${status.color}`}>
                            <Icon icon="heroicons:clock" className="text-xs" />
                            {status.label}
                          </span>
                        );
                      })()}
                    </div>
                  </FormField>
                </div>
              </div>

              {/* Per-location inventory section */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <Icon icon="heroicons:map-pin" className="text-gray-400 text-lg" />
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Stock por Sede</h4>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {locations.map(loc => (
                    <div key={loc.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{loc.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{loc.city}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-24">
                          <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Stock</label>
                          <TextInput
                            type="number"
                            className="h-9 text-xs"
                            value={locationInventory[loc.id]?.stock_quantity ?? ''}
                            placeholder={form.stock_current.toString()}
                            onChange={e => setLocationInventory({
                              ...locationInventory,
                              [loc.id]: {
                                ...locationInventory[loc.id],
                                stock_quantity: e.target.value
                              }
                            })}
                          />
                        </div>
                        <div className="w-24">
                          <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Mín.</label>
                          <TextInput
                            type="number"
                            className="h-9 text-xs"
                            value={locationInventory[loc.id]?.min_stock ?? ''}
                            placeholder={form.stock_min.toString()}
                            onChange={e => setLocationInventory({
                              ...locationInventory,
                              [loc.id]: {
                                ...locationInventory[loc.id],
                                min_stock: e.target.value
                              }
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modifier toggle & Profit Margin */}
              <div className="md:col-span-2 flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Disponible como adicional/extra</p>
                    <p className="text-[12px] text-gray-400 font-medium mt-0.5">El cliente podrá añadirlo a su pedido por un costo extra.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => f('is_modifier', !form.is_modifier)}
                    className={`w-10 h-5 rounded-full relative transition-all ${form.is_modifier ? 'bg-[#2f4131]' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_modifier ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>

                {form.is_modifier && (
                  <div className="pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label={`Tamaño Porción (${form.usage_unit || '...'})`}>
                      <TextInput
                        type="number"
                        required
                        value={form.portion_size}
                        onChange={e => f('portion_size', Number(e.target.value))}
                        placeholder="Ej: 50"
                      />
                    </FormField>
                    <FormField label="Precio Venta Cliente">
                      <TextInput
                        type="number"
                        required
                        value={form.selling_price}
                        onChange={e => f('selling_price', Number(e.target.value))}
                        placeholder="Ej: 1500"
                      />
                    </FormField>

                    {/* Calculated Profit Margin Display */}
                    <div className="flex flex-col justify-center">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 mb-1">Margen de Ganancia</span>
                      <div className="flex items-baseline gap-2">
                        {(() => {
                          const portionCost = unitCost * (form.portion_size || 50);
                          const sellPrice = form.selling_price || 0;
                          const profit = sellPrice - portionCost;
                          const marginPercent = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;

                          return (
                            <>
                              <span className={`text-xl font-bold tabular-nums ${marginPercent > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {marginPercent.toFixed(1)}%
                              </span>
                              <span className="text-xs text-gray-500 font-medium">
                                (Costo: ${portionCost.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Zero-Waste AI & Merma Switch */}
              <div className="md:col-span-2 flex flex-col p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                        Insumo con Merma Aprovechable (Zero-Waste)
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/70 text-emerald-800 px-1.5 py-0.2 rounded">Add-on IA</span>
                      </p>
                      <p className="text-xs text-slate-600 font-normal mt-0.5">
                        Activa este switch si este insumo genera recortes, tallos, pieles o huesos que el restaurante puede aprovechar en sub-recetas.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => f('has_merma', !form.has_merma)}
                    className={`w-11 h-6 rounded-full relative transition-all cursor-pointer ${form.has_merma ? 'bg-emerald-700' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.has_merma ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                {form.has_merma && (
                  <div className="pt-3 mt-2 border-t border-emerald-200/80 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block mb-1">
                        % Estimado de Merma / Descarte
                      </label>
                      <div className="flex items-center gap-2">
                        <TextInput
                          type="number"
                          min="1"
                          max="90"
                          value={form.merma_percent || 20}
                          onChange={e => f('merma_percent', Number(e.target.value))}
                          placeholder="Ej: 25"
                          className="w-28 text-xs font-bold"
                        />
                        <span className="text-xs font-bold text-emerald-800">% del peso total</span>
                      </div>
                    </div>
                    <div className="p-3 bg-white/80 rounded-lg border border-emerald-200 text-xs text-slate-700 flex flex-col justify-center">
                      <p className="font-bold text-emerald-900 mb-0.5 flex items-center gap-1">
                        <Leaf size={12} className="text-emerald-600" />
                        Sugerencia Gastronómica Activa
                      </p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {getZeroWasteSuggestion(form.name)?.suggestion ||
                         'Aluna IA detectará cómo transformar estos excedentes en fondos, caldos, encurtidos o salsas para elevar tu rentabilidad.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="shrink-0 px-5 md:px-7 py-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 mt-auto bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
              <SecondaryButton type="button" onClick={onClose} className="flex-1 py-3 order-2 sm:order-1">
                Cancelar
              </SecondaryButton>
              <PrimaryButton type="submit" className="flex-[2] py-3 order-1 sm:order-2">
                {editing ? 'Guardar cambios' : 'Crear insumo'}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
