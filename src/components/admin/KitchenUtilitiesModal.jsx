import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Icon } from '@iconify/react';
import Portal from '../Portal';

export default function KitchenUtilitiesModal({ isOpen, onClose, brandId, locationId, locationName }) {
  const [rates, setRates] = useState({
    kwh_price: 950,
    gas_m3_price: 2800,
    water_liter_price: 5.5
  });
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingRates, setSavingRates] = useState(false);
  const [activeTab, setActiveTab] = useState('equipment'); // 'equipment' | 'rates'

  // Equipment Form Modal / State
  const [isEditingEquipment, setIsEditingEquipment] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    category: 'coccion',
    energy_type: 'electric',
    power_watts: 1500,
    gas_consumption_m3_per_hour: 0,
    water_liters_per_cycle: 0,
    notes: ''
  });

  useEffect(() => {
    if (isOpen && brandId) {
      loadData();
    }
  }, [isOpen, brandId, locationId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Cargar tarifas de la sede o de la marca
      let query = supabase.from('kitchen_utility_rates').select('*').eq('brand_id', brandId);
      if (locationId && locationId !== 'all') {
        query = query.eq('location_id', locationId);
      }
      const { data: rateData, error: rateErr } = await query.maybeSingle();
      if (!rateErr && rateData) {
        setRates({
          kwh_price: Number(rateData.kwh_price) || 950,
          gas_m3_price: Number(rateData.gas_m3_price) || 2800,
          water_liter_price: Number(rateData.water_liter_price) || 5.5
        });
      }

      // 2. Cargar equipos de la marca / sede
      let eqQuery = supabase.from('kitchen_equipment').select('*').eq('brand_id', brandId);
      if (locationId && locationId !== 'all') {
        eqQuery = eqQuery.or(`location_id.eq.${locationId},location_id.is.null`);
      }
      const { data: eqData, error: eqErr } = await eqQuery.order('created_at', { ascending: true });
      if (!eqErr && eqData) {
        setEquipmentList(eqData);
      }
    } catch (err) {
      console.error('Error cargando utilidades y equipos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRates = async (e) => {
    e.preventDefault();
    try {
      setSavingRates(true);
      const locId = locationId && locationId !== 'all' ? locationId : null;

      const { error } = await supabase.from('kitchen_utility_rates').upsert({
        brand_id: brandId,
        location_id: locId,
        kwh_price: Number(rates.kwh_price) || 950,
        gas_m3_price: Number(rates.gas_m3_price) || 2800,
        water_liter_price: Number(rates.water_liter_price) || 5.5,
        updated_at: new Date().toISOString()
      }, { onConflict: 'brand_id,location_id' });

      if (error) throw error;
      alert('¡Tarifas de energía, gas y agua actualizadas con éxito!');
    } catch (err) {
      console.error('Error guardando tarifas:', err);
      alert('Error guardando tarifas.');
    } finally {
      setSavingRates(false);
    }
  };

  const handleOpenEquipmentForm = (item = null) => {
    if (item) {
      setEditingItem(item);
      setEquipmentForm({
        name: item.name || '',
        category: item.category || 'coccion',
        energy_type: item.energy_type || 'electric',
        power_watts: item.power_watts || 0,
        gas_consumption_m3_per_hour: item.gas_consumption_m3_per_hour || 0,
        water_liters_per_cycle: item.water_liters_per_cycle || 0,
        notes: item.notes || ''
      });
    } else {
      setEditingItem(null);
      setEquipmentForm({
        name: '',
        category: 'coccion',
        energy_type: 'electric',
        power_watts: 1500,
        gas_consumption_m3_per_hour: 0,
        water_liters_per_cycle: 0,
        notes: ''
      });
    }
    setIsEditingEquipment(true);
  };

  const handleSaveEquipment = async (e) => {
    e.preventDefault();
    if (!equipmentForm.name.trim()) return;

    try {
      const locId = locationId && locationId !== 'all' ? locationId : null;
      const payload = {
        brand_id: brandId,
        location_id: locId,
        name: equipmentForm.name.trim(),
        category: equipmentForm.category,
        energy_type: equipmentForm.energy_type,
        power_watts: Number(equipmentForm.power_watts) || 0,
        gas_consumption_m3_per_hour: Number(equipmentForm.gas_consumption_m3_per_hour) || 0,
        water_liters_per_cycle: Number(equipmentForm.water_liters_per_cycle) || 0,
        notes: equipmentForm.notes?.trim() || null,
        updated_at: new Date().toISOString()
      };

      if (editingItem) {
        const { error } = await supabase.from('kitchen_equipment').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kitchen_equipment').insert([payload]);
        if (error) throw error;
      }

      setIsEditingEquipment(false);
      loadData();
    } catch (err) {
      console.error('Error guardando equipo:', err);
      alert('Error al guardar el equipo.');
    }
  };

  const handleDeleteEquipment = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este equipo?')) return;
    try {
      const { error } = await supabase.from('kitchen_equipment').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error('Error eliminando equipo:', err);
    }
  };

  // Helper para calcular costo por minuto de un equipo
  const calculateCostPerMinute = (eq) => {
    let costPerMin = 0;
    if (eq.energy_type === 'electric' || eq.energy_type === 'dual') {
      const kw = (Number(eq.power_watts) || 0) / 1000;
      costPerMin += (kw * rates.kwh_price) / 60;
    }
    if (eq.energy_type === 'gas' || eq.energy_type === 'dual') {
      const m3PerHour = Number(eq.gas_consumption_m3_per_hour) || 0;
      costPerMin += (m3PerHour * rates.gas_m3_price) / 60;
    }
    return costPerMin;
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col my-auto border border-slate-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <Icon icon="heroicons:bolt" className="text-2xl" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Gestión de Energía, Gas y Equipos de Cocina
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                    {locationName || 'Sede Principal'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configura tarifas por sede y catálogo de electrodomésticos para costear cada minuto de uso en tus recetas.
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <Icon icon="heroicons:x-mark" className="text-xl" />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center justify-between px-6 py-2.5 bg-slate-100/60 border-b border-slate-200">
            <div className="inline-flex bg-slate-200/70 p-1 rounded-xl gap-1">
              <button
                onClick={() => setActiveTab('equipment')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'equipment' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon icon="heroicons:wrench-screwdriver" className="text-sm text-amber-600" />
                <span>Electrodomésticos & Equipos ({equipmentList.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('rates')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'rates' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon icon="heroicons:currency-dollar" className="text-sm text-emerald-600" />
                <span>Tarifas de Servicios Sede</span>
              </button>
            </div>

            {activeTab === 'equipment' && (
              <button
                onClick={() => handleOpenEquipmentForm()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
              >
                <Icon icon="heroicons:plus" className="text-sm" />
                <span>Nuevo Equipo</span>
              </button>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Icon icon="lucide:loader-2" className="animate-spin text-2xl" />
              </div>
            ) : activeTab === 'rates' ? (
              /* TAB: TARIFAS DE SERVICIOS */
              <form onSubmit={handleSaveRates} className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Tarifas Base de Servicios Públicos</h4>
                  <p className="text-xs text-slate-500">
                    Estos precios se utilizan como multiplicador para calcular el gasto exacto por minuto u hora en cada receta.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Electricidad */}
                  <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/30 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                        <Icon icon="heroicons:bolt" className="text-xl" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Electricidad</span>
                        <span className="text-[11px] text-slate-500">Costo por kilovatio hora (kWh)</span>
                      </div>
                    </div>
                    <div className="relative w-36">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                      <input 
                        type="number"
                        step="1"
                        value={rates.kwh_price}
                        onChange={e => setRates(prev => ({ ...prev, kwh_price: e.target.value }))}
                        className="w-full h-9 pl-7 pr-3 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 tabular-nums focus:border-amber-500 outline-none text-right"
                      />
                    </div>
                  </div>

                  {/* Gas */}
                  <div className="p-3.5 rounded-xl border border-orange-200/80 bg-orange-50/30 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                        <Icon icon="heroicons:fire" className="text-xl" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Gas Natural / Propano</span>
                        <span className="text-[11px] text-slate-500">Costo por metro cúbico (m³)</span>
                      </div>
                    </div>
                    <div className="relative w-36">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                      <input 
                        type="number"
                        step="1"
                        value={rates.gas_m3_price}
                        onChange={e => setRates(prev => ({ ...prev, gas_m3_price: e.target.value }))}
                        className="w-full h-9 pl-7 pr-3 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 tabular-nums focus:border-orange-500 outline-none text-right"
                      />
                    </div>
                  </div>

                  {/* Agua */}
                  <div className="p-3.5 rounded-xl border border-cyan-200/80 bg-cyan-50/30 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-cyan-500 text-white flex items-center justify-center">
                        <Icon icon="heroicons:beaker" className="text-xl" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Agua Potable</span>
                        <span className="text-[11px] text-slate-500">Costo por Litro (~$5.500/m³)</span>
                      </div>
                    </div>
                    <div className="relative w-36">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                      <input 
                        type="number"
                        step="0.1"
                        value={rates.water_liter_price}
                        onChange={e => setRates(prev => ({ ...prev, water_liter_price: e.target.value }))}
                        className="w-full h-9 pl-7 pr-3 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 tabular-nums focus:border-cyan-500 outline-none text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingRates}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Icon icon="heroicons:check" className="text-base" />
                    <span>{savingRates ? 'Guardando...' : 'Guardar Tarifas Sede'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* TAB: EQUIPOS & ELECTRODOMÉSTICOS */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {equipmentList.map(eq => {
                    const costMin = calculateCostPerMinute(eq);
                    const costHour = costMin * 60;

                    return (
                      <div key={eq.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                              eq.energy_type === 'electric' 
                                ? 'bg-amber-100/80 text-amber-900 border border-amber-200' 
                                : eq.energy_type === 'gas'
                                ? 'bg-orange-100/80 text-orange-900 border border-orange-200'
                                : 'bg-cyan-100/80 text-cyan-900 border border-cyan-200'
                            }`}>
                              <Icon icon={eq.energy_type === 'electric' ? 'heroicons:bolt' : eq.energy_type === 'gas' ? 'heroicons:fire' : 'heroicons:beaker'} className="text-xs" />
                              {eq.energy_type === 'electric' ? 'Eléctrico' : eq.energy_type === 'gas' ? 'A Gas' : 'Agua / Mixto'}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 capitalize">
                              {eq.category || 'Cocción'}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 mb-1">{eq.name}</h4>
                          {eq.notes && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{eq.notes}</p>}

                          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/80 my-2.5 space-y-1">
                            {eq.energy_type === 'electric' && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Potencia:</span>
                                <span className="font-mono font-bold text-slate-800">{eq.power_watts || 0} Watts ({((eq.power_watts || 0)/1000).toFixed(1)} kW)</span>
                              </div>
                            )}
                            {eq.energy_type === 'gas' && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Consumo gas:</span>
                                <span className="font-mono font-bold text-slate-800">{eq.gas_consumption_m3_per_hour || 0} m³/hora</span>
                              </div>
                            )}
                            {Number(eq.water_liters_per_cycle) > 0 && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Agua x ciclo:</span>
                                <span className="font-mono font-bold text-slate-800">{eq.water_liters_per_cycle} Litros</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                              <span className="text-slate-600 font-semibold">Costo x Minuto:</span>
                              <span className="font-mono font-black text-amber-700">${costMin.toFixed(1)} COP</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>Costo x Hora:</span>
                              <span className="font-mono font-bold">${costHour.toFixed(0)} COP/h</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                          <button 
                            onClick={() => handleOpenEquipmentForm(eq)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Editar equipo"
                          >
                            <Icon icon="heroicons:pencil-square" className="text-base" />
                          </button>
                          <button 
                            onClick={() => handleDeleteEquipment(eq.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar equipo"
                          >
                            <Icon icon="heroicons:trash" className="text-base" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {equipmentList.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3">
                      <Icon icon="heroicons:wrench-screwdriver" className="text-2xl" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Aún no hay equipos configurados</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Agrega tu olla arrocera, freidora, horno o estufa para calcular el costo de los minutos de cocción en las recetas.
                    </p>
                    <button
                      onClick={() => handleOpenEquipmentForm()}
                      className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5"
                    >
                      <Icon icon="heroicons:plus" className="text-sm" />
                      <span>Agregar Primer Equipo</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submodal CRUD Equipo */}
      {isEditingEquipment && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-3">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-fade-in">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Icon icon="heroicons:wrench-screwdriver" className="text-amber-600 text-base" />
                  {editingItem ? 'Editar Electrodoméstico' : 'Nuevo Electrodoméstico'}
                </h4>
                <button onClick={() => setIsEditingEquipment(false)} className="text-slate-400 hover:text-slate-600">
                  <Icon icon="heroicons:x-mark" className="text-lg" />
                </button>
              </div>

              <form onSubmit={handleSaveEquipment} className="p-5 space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Equipo *</label>
                  <input 
                    type="text" 
                    required
                    value={equipmentForm.name}
                    onChange={e => setEquipmentForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej. Olla Arrocera Industrial 30T"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Tipo de Energía</label>
                    <select
                      value={equipmentForm.energy_type}
                      onChange={e => setEquipmentForm(prev => ({ ...prev, energy_type: e.target.value }))}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-amber-500"
                    >
                      <option value="electric">⚡ Eléctrico</option>
                      <option value="gas">🔥 A Gas</option>
                      <option value="water">💧 Solo Agua / Ciclo</option>
                      <option value="dual">⚡+🔥 Mixto</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Categoría</label>
                    <select
                      value={equipmentForm.category}
                      onChange={e => setEquipmentForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-amber-500"
                    >
                      <option value="coccion">Cocción</option>
                      <option value="frio">Refrigeración</option>
                      <option value="procesado">Procesado / Licuado</option>
                      <option value="lavado">Lavado</option>
                    </select>
                  </div>
                </div>

                {equipmentForm.energy_type === 'electric' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Potencia Nominal (Watts)</label>
                      <span className="text-[11px] font-mono text-amber-700 font-bold">
                        {((equipmentForm.power_watts || 0)/1000).toFixed(2)} kW
                      </span>
                    </div>
                    <input 
                      type="number" 
                      min="0"
                      step="50"
                      value={equipmentForm.power_watts}
                      onChange={e => setEquipmentForm(prev => ({ ...prev, power_watts: e.target.value }))}
                      placeholder="1600"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-amber-500 tabular-nums"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Ej: Una arrocera gasta entre 1.000W y 1.800W. Una freidora de aire 1.800W.
                    </p>
                  </div>
                )}

                {equipmentForm.energy_type === 'gas' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Consumo Gas (m³ por hora)</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.05"
                      value={equipmentForm.gas_consumption_m3_per_hour}
                      onChange={e => setEquipmentForm(prev => ({ ...prev, gas_consumption_m3_per_hour: e.target.value }))}
                      placeholder="0.65"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-amber-500 tabular-nums"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Consumo Agua por ciclo (Litros, opcional)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.5"
                    value={equipmentForm.water_liters_per_cycle}
                    onChange={e => setEquipmentForm(prev => ({ ...prev, water_liters_per_cycle: e.target.value }))}
                    placeholder="2.0"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-amber-500 tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Notas técnicas</label>
                  <input 
                    type="text" 
                    value={equipmentForm.notes}
                    onChange={e => setEquipmentForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Ubicación o modelo del equipo..."
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsEditingEquipment(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    Guardar Equipo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </Portal>
  );
}
