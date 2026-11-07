import React from 'react';
import { FormField } from '../ui';
import { Icon } from '@iconify/react';
import CoverageMap from '../../maps/CoverageMap';

const OPERATIONAL_MODES = [
  { id: 'dine_in', label: 'En Mesa / Local', icon: 'solar:plate-bold' },
  { id: 'takeaway', label: 'Para Llevar', icon: 'solar:bag-3-bold' },
  { id: 'delivery', label: 'A Domicilio', icon: 'solar:delivery-bold' }
];

const RADIUS_PRESETS = [
  { label: '0.8 km (Barrio)', val: 0.8 },
  { label: '1.5 km (Sector)', val: 1.5 },
  { label: '3.0 km (Urbano)', val: 3.0 },
  { label: '5.0 km (Municipio)', val: 5.0 },
  { label: '10 km (Regional)', val: 10.0 }
];

export default function SedeOpsDeliveryTab({
  form,
  setForm,
  handleCaptureSedeGPS
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Modos de Operación */}
      <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/80">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
          <Icon icon="solar:delivery-bold" className="text-base text-gray-700" /> Modos de Operación Habilitados
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {OPERATIONAL_MODES.map(mode => {
            const isSelected = form.operational_modes?.includes(mode.id);
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  const modes = form.operational_modes || [];
                  if (modes.includes(mode.id)) {
                    setForm({...form, operational_modes: modes.filter(m => m !== mode.id)});
                  } else {
                    setForm({...form, operational_modes: [...modes, mode.id]});
                  }
                }}
                className={`flex items-center sm:flex-col justify-center gap-2.5 p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2f4131] border-[#2f4131] text-white shadow-md shadow-[#2f4131]/20 font-bold'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 font-medium'
                }`}
              >
                <Icon icon={mode.icon} width="22" />
                <span className="text-xs">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guía Rápida de Domicilios */}
      <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-5 text-xs text-emerald-950">
        <div className="flex items-center gap-2 font-bold text-sm text-emerald-900 mb-2.5">
          <Icon icon="solar:lightbulb-bold" className="text-lg text-emerald-600 shrink-0" />
          <span>¿Cómo funciona el cálculo inteligente de domicilios?</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed text-emerald-900/90">
          <div className="space-y-1.5">
            <p>
              <strong>1. Ubicación de tu sede:</strong> En <em>Coordenadas GPS</em> (abajo), pulsa <strong>"Capturar mi GPS actual"</strong> para fijar el punto de partida de tus repartidores.
            </p>
            <p>
              <strong>2. Radio de cobertura:</strong> Define el alcance máximo en km. Si un cliente está más lejos, se le avisará amablemente que está fuera de zona.
            </p>
          </div>
          <div className="space-y-1.5">
            <p>
              <strong>3. Tarifa base y km extra:</strong> Cobras un valor base hasta cierta distancia (ej. 3 km) y un recargo por km adicional.
            </p>
            <p>
              <strong>4. GPS del comensal:</strong> Tu cliente pulsa <em>"Mi GPS"</em> al ordenar y el sistema calcula la tarifa exacta en segundos.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="Tarifa Base de Domicilio ($ COP)">
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 focus-within:border-[#2f4131] transition-all">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <Icon icon="solar:dollar-bold" width="18" />
            </div>
            <input 
              type="number" 
              min="0" 
              step="any"
              value={form.delivery_fee}
              onChange={(e) => setForm({...form, delivery_fee: Math.max(0, parseInt(e.target.value) || 0)})}
              placeholder="Ej: 4000"
              className="flex-1 font-semibold text-gray-900 text-sm bg-transparent border-none outline-none focus:ring-0"
            />
            <span className="text-xs font-semibold text-gray-400">COP</span>
          </div>
        </FormField>

        <FormField label="Distancia Cubierta por Tarifa Base (km)">
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 focus-within:border-[#2f4131] transition-all">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 shrink-0">
              <Icon icon="solar:route-bold" width="18" />
            </div>
            <input 
              type="number" 
              min="0.5" 
              step="any"
              value={form.base_delivery_distance_km}
              onChange={(e) => setForm({...form, base_delivery_distance_km: Math.max(0.5, parseFloat(e.target.value) || 1)})}
              className="flex-1 font-semibold text-gray-900 text-sm bg-transparent border-none outline-none focus:ring-0"
            />
            <span className="text-xs font-semibold text-gray-400">km</span>
          </div>
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="Costo por Km Adicional ($ COP)">
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 focus-within:border-[#2f4131] transition-all">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700 shrink-0">
              <Icon icon="solar:tag-price-bold" width="18" />
            </div>
            <input 
              type="number" 
              min="0" 
              step="any"
              value={form.extra_km_fee}
              onChange={(e) => setForm({...form, extra_km_fee: Math.max(0, parseInt(e.target.value) || 0)})}
              placeholder="Ej: 1500"
              className="flex-1 font-semibold text-gray-900 text-sm bg-transparent border-none outline-none focus:ring-0"
            />
            <span className="text-xs font-semibold text-gray-400">COP/km</span>
          </div>
        </FormField>

        <FormField label="Envío Gratis por Compras Superiores a ($ COP, 0 = Inactivo)">
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 focus-within:border-[#2f4131] transition-all">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
              <Icon icon="solar:gift-bold" width="18" />
            </div>
            <input 
              type="number" 
              min="0" 
              step="any"
              value={form.free_delivery_threshold}
              onChange={(e) => setForm({...form, free_delivery_threshold: Math.max(0, parseInt(e.target.value) || 0)})}
              placeholder="Ej: 70000"
              className="flex-1 font-semibold text-gray-900 text-sm bg-transparent border-none outline-none focus:ring-0"
            />
            <span className="text-xs font-semibold text-gray-400">COP</span>
          </div>
        </FormField>
      </div>

      <FormField label="Coordenadas GPS de la Sede (Punto de Partida)">
        <div className="p-4 bg-white rounded-xl border border-gray-200 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-gray-600 font-medium">
              {form.latitude && form.longitude 
                ? `📍 Lat: ${Number(form.latitude).toFixed(6)}, Lng: ${Number(form.longitude).toFixed(6)}` 
                : "Sin coordenadas configuradas"}
            </span>
            <button
              type="button"
              onClick={handleCaptureSedeGPS}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-200/60 cursor-pointer"
            >
              <Icon icon="solar:gps-bold" />
              Capturar mi GPS actual
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="number" 
              step="any" 
              placeholder="Latitud (ej: 5.0260)" 
              value={form.latitude ?? ''} 
              onChange={(e) => setForm({...form, latitude: e.target.value === '' ? null : parseFloat(e.target.value)})} 
              className="p-2.5 bg-gray-50 rounded-lg text-xs font-semibold text-gray-800 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2f4131]" 
            />
            <input 
              type="number" 
              step="any" 
              placeholder="Longitud (ej: -74.0040)" 
              value={form.longitude ?? ''} 
              onChange={(e) => setForm({...form, longitude: e.target.value === '' ? null : parseFloat(e.target.value)})} 
              className="p-2.5 bg-gray-50 rounded-lg text-xs font-semibold text-gray-800 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2f4131]" 
            />
          </div>
        </div>
      </FormField>

      <FormField label="Radio Máximo de Cobertura Delivery">
        <div className="flex flex-col gap-3 p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <Icon icon="solar:radius-bold" width="18" />
            </div>
            <input 
              type="range" 
              min="0.3" 
              max="25" 
              step="0.1" 
              value={form.delivery_radius_km || 1} 
              onChange={(e) => setForm({...form, delivery_radius_km: parseFloat(e.target.value) || 0.5})} 
              className="flex-1 accent-[#2f4131] h-2 bg-gray-100 rounded-lg cursor-pointer" 
            />
            <div className="flex items-center gap-1 shrink-0 bg-gray-50 p-1 rounded-lg border border-gray-200">
              <button 
                type="button" 
                onClick={() => setForm(f => ({ ...f, delivery_radius_km: Math.max(0.3, Number(((f.delivery_radius_km || 1) - 0.2).toFixed(1))) }))} 
                className="w-7 h-7 rounded-md bg-white hover:bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 shadow-2xs transition-colors cursor-pointer" 
                title="Reducir 200m"
              >
                -
              </button>
              <input 
                type="number" 
                step="0.1" 
                min="0.3" 
                max="25" 
                value={form.delivery_radius_km ?? ''} 
                onChange={(e) => setForm({...form, delivery_radius_km: e.target.value === '' ? 1 : Math.max(0.3, parseFloat(e.target.value))})} 
                className="w-14 text-center font-bold text-sm bg-transparent border-none outline-none p-0 focus:ring-0 text-gray-900" 
              />
              <button 
                type="button" 
                onClick={() => setForm(f => ({ ...f, delivery_radius_km: Math.min(25, Number(((f.delivery_radius_km || 1) + 0.2).toFixed(1))) }))} 
                className="w-7 h-7 rounded-md bg-white hover:bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 shadow-2xs transition-colors cursor-pointer" 
                title="Aumentar 200m"
              >
                +
              </button>
              <span className="text-[11px] font-semibold text-gray-400 pr-1">km</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-gray-100">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1">Rápido:</span>
            {RADIUS_PRESETS.map(preset => (
              <button 
                key={preset.val} 
                type="button" 
                onClick={() => setForm({...form, delivery_radius_km: preset.val})} 
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  form.delivery_radius_km === preset.val 
                    ? 'bg-[#2f4131] text-white shadow-2xs font-bold' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </FormField>

      <FormField label="Visualización de Cobertura en Mapa">
        <CoverageMap 
          latitude={form.latitude} 
          longitude={form.longitude} 
          radiusKm={form.delivery_radius_km} 
          sedeName={form.name || "Nuestra Sede"} 
          onLocationChange={({ lat, lng }) => {
            setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
          }} 
        />
      </FormField>
    </div>
  );
}
