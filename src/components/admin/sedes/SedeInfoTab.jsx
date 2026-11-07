import React from 'react';
import { FormField, TextInput, Switch } from '../ui';
import { Icon } from '@iconify/react';

export default function SedeInfoTab({ form, setForm }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="Identificación de la Sede *">
          <TextInput 
            value={form.name} 
            onChange={(e) => setForm({...form, name: e.target.value})} 
            placeholder="Ej. Sede Norte / Zipaquirá Centro"
            required
          />
        </FormField>
        <FormField label="WhatsApp de Pedidos *">
          <TextInput 
            value={form.whatsapp} 
            onChange={(e) => setForm({...form, whatsapp: e.target.value})} 
            placeholder="+57 321 456 7890"
            required
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="Teléfono Fijo / Local (Opcional)">
          <TextInput 
            value={form.phone} 
            onChange={(e) => setForm({...form, phone: e.target.value})} 
            placeholder="601 234 5678"
          />
        </FormField>
        <FormField label="Enlace de Google Maps (Para compartir)">
          <TextInput 
            value={form.maps_url} 
            onChange={(e) => setForm({...form, maps_url: e.target.value})} 
            placeholder="https://maps.app.goo.gl/..."
          />
        </FormField>
      </div>

      <FormField label="Dirección Física">
        <TextInput 
          value={form.address} 
          onChange={(e) => setForm({...form, address: e.target.value})} 
          placeholder="Calle 123 # 45-67, Ciudad"
        />
      </FormField>

      {/* Toggles: Operación Base & Estado Online */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div 
          onClick={() => setForm({...form, is_main: !form.is_main})}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            form.is_main 
              ? 'bg-amber-50/60 border-amber-200/80 shadow-2xs' 
              : 'bg-white border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              form.is_main ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
            }`}>
              <Icon icon="solar:star-bold" className="text-lg" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 leading-tight">Sede Principal</p>
              <p className="text-[11px] text-gray-500">Punto de venta predeterminado</p>
            </div>
          </div>
          <Switch 
            checked={form.is_main} 
            onChange={(val) => setForm({...form, is_main: val})} 
          />
        </div>

        <div 
          onClick={() => setForm({...form, is_active: !form.is_active})}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            form.is_active 
              ? 'bg-emerald-50/60 border-emerald-200/80 shadow-2xs' 
              : 'bg-white border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              form.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
            }`}>
              <Icon icon="solar:check-circle-bold" className="text-lg" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 leading-tight">Estado Online</p>
              <p className="text-[11px] text-gray-500">Visible en menú digital</p>
            </div>
          </div>
          <Switch 
            checked={form.is_active} 
            onChange={(val) => setForm({...form, is_active: val})} 
          />
        </div>
      </div>
    </div>
  );
}
