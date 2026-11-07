import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function RecipeEnergyTab({
  formData,
  setFormData,
  energyCost,
  utilityRates,
  availableEquipment = [],
  onOpenUtilitiesModal
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Icon icon="heroicons:bolt" className="text-2xl" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
              Costos Indirectos: Energía, Gas & Agua por Receta
            </h4>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Asocia los electrodomésticos utilizados para calcular automáticamente el costo real de cocción.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-900 bg-white px-3 py-1.5 rounded-lg border border-amber-300">
            Total Servicios: ${Math.round(energyCost).toLocaleString('es-CO')} COP
          </span>
          <button
            type="button"
            onClick={onOpenUtilitiesModal}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
          >
            <Icon icon="heroicons:cog-6-tooth" className="text-sm" />
            <span>Configurar Equipos / Tarifas</span>
          </button>
        </div>
      </div>

      {/* Selector de Equipos para añadir */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <h5 className="text-xs font-bold text-slate-800 mb-2">Vincular Electrodoméstico a esta Ficha</h5>
        <div className="flex flex-wrap items-center gap-2">
          {availableEquipment.map(eq => {
            const isAlreadyLinked = (formData.recipe_equipment || []).some(item => item.equipment_id === eq.id);
            return (
              <button
                key={eq.id}
                type="button"
                disabled={isAlreadyLinked}
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    recipe_equipment: [
                      ...(prev.recipe_equipment || []),
                      {
                        equipment_id: eq.id,
                        usage_minutes: Number(formData.prep_time_minutes) || 30,
                        water_liters_override: eq.water_liters_per_cycle || null,
                        name: eq.name,
                        energy_type: eq.energy_type,
                        power_watts: eq.power_watts,
                        gas_consumption_m3_per_hour: eq.gas_consumption_m3_per_hour,
                        water_liters_per_cycle: eq.water_liters_per_cycle
                      }
                    ]
                  }));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  isAlreadyLinked
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border-slate-200 hover:border-amber-300'
                }`}
              >
                <Icon icon={eq.energy_type === 'electric' ? 'heroicons:bolt' : eq.energy_type === 'gas' ? 'heroicons:fire' : 'heroicons:beaker'} className="text-xs text-amber-600" />
                <span>{eq.name}</span>
                {!isAlreadyLinked && <Icon icon="heroicons:plus" className="text-xs" />}
              </button>
            );
          })}
          {availableEquipment.length === 0 && (
            <p className="text-xs text-slate-400 italic">No tienes equipos registrados. Usa el botón superior para agregar tu arrocera, freidora, estufa, etc.</p>
          )}
        </div>
      </div>

      {/* Lista de equipos vinculados a la receta */}
      {(formData.recipe_equipment || []).length > 0 ? (
        <div className="space-y-3">
          {(formData.recipe_equipment || []).map((item, idx) => {
            let itemCost = 0;
            const mins = Number(item.usage_minutes) || 0;
            if (item.energy_type === 'electric' || item.energy_type === 'dual') {
              const kw = (Number(item.power_watts) || 0) / 1000;
              itemCost += (kw * (mins / 60) * (utilityRates?.kwh_price || 950));
            }
            if (item.energy_type === 'gas' || item.energy_type === 'dual') {
              const m3PerHour = Number(item.gas_consumption_m3_per_hour) || 0;
              itemCost += (m3PerHour * (mins / 60) * (utilityRates?.gas_m3_price || 2800));
            }
            const waterLiters = item.water_liters_override !== undefined && item.water_liters_override !== null
              ? Number(item.water_liters_override)
              : Number(item.water_liters_per_cycle) || 0;
            itemCost += (waterLiters * (utilityRates?.water_liter_price || 5.5));

            return (
              <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Icon icon={item.energy_type === 'electric' ? 'heroicons:bolt' : item.energy_type === 'gas' ? 'heroicons:fire' : 'heroicons:beaker'} className="text-sm" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {item.energy_type === 'electric' ? `${item.power_watts}W` : item.energy_type === 'gas' ? `${item.gas_consumption_m3_per_hour} m³/h` : 'Consumo base'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Tiempo Uso:</span>
                    <input 
                      type="number"
                      min="1"
                      value={item.usage_minutes}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          recipe_equipment: prev.recipe_equipment.map((eq, i) => i === idx ? { ...eq, usage_minutes: val } : eq)
                        }));
                      }}
                      className="w-14 h-6 text-center font-bold text-xs text-slate-900 outline-none tabular-nums bg-white border border-slate-300 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-600">min</span>
                  </div>

                  <div className="text-right min-w-[90px]">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Gasto Energía:</span>
                    <span className="text-xs font-black text-amber-800 tabular-nums">
                      ${Math.round(itemCost).toLocaleString('es-CO')} COP
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        recipe_equipment: prev.recipe_equipment.filter((_, i) => i !== idx)
                      }));
                    }}
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Quitar equipo"
                  >
                    <Icon icon="heroicons:trash" className="text-base" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-10 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50 p-6">
          <Icon icon="heroicons:bolt" className="text-3xl text-amber-400 mx-auto mb-2" />
          <h5 className="text-xs font-bold text-slate-800 uppercase">Sin equipos vinculados a esta receta</h5>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Si esta preparación requiere cocción (arrocera, estufa, freidora, horno), selecciónala arriba para sumarle su costo de minutos de gas o luz.
          </p>
        </div>
      )}
    </div>
  );
}
