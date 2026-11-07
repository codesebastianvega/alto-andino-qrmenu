import React from 'react';
import { Icon } from '@iconify/react';
import { Palette, Type } from 'lucide-react';
import { TextInput } from '../ui';
import { FONT_OPTIONS } from '../../../hooks/branding/useAdminBrandingData';

function ColorInput({ label, value, onChange, disabled = false, isPremium = false }) {
  const inputId = label.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return (
    <div className={`group relative ${disabled ? 'cursor-not-allowed' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor={`color-${inputId}`}
          className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest"
        >
          {label}
        </label>
        {isPremium && (
          <div className="flex items-center gap-1 text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-tighter italic">
            PRO
          </div>
        )}
      </div>
      <div className={`flex items-center gap-2 ${disabled ? 'pointer-events-none opacity-40' : ''}`}>
        <div className="relative shrink-0">
          <input
            id={`color-${inputId}`}
            name={`color-${inputId}`}
            type="color"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="w-11 h-11 rounded-1.5xl border border-gray-100 p-0.5 cursor-pointer appearance-none bg-white shadow-sm hover:shadow-md transition-all active:scale-95"
          />
          <div className="absolute inset-0 rounded-1.5xl pointer-events-none ring-1 ring-inset ring-black/5" />
        </div>
        <div className="relative flex-1">
          <TextInput
            id={`text-${inputId}`}
            name={`text-${inputId}`}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="font-mono text-xs uppercase pl-3 pr-8 !h-11"
          />
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-black/5 shadow-inner"
            style={{ backgroundColor: value }}
          />
        </div>
      </div>
    </div>
  );
}

export default function BrandingColorsSection({
  settingsForm,
  setSettingsForm,
  isAdvancedLocked,
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition-all">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3.5 bg-white">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 border border-purple-100/60">
          <Icon icon="solar:cosmetic-linear" className="text-xl" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            Colores y Tipografía
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Personalización de fuentes y paleta cromática del menú digital
          </p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Typography */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <Type size={14} /> Tipografía Principal
            </p>
            {isAdvancedLocked && (
              <span className="text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 uppercase font-black">
                Plan Esencial
              </span>
            )}
          </div>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 ${
              isAdvancedLocked ? 'opacity-40 grayscale-[0.5] pointer-events-none' : ''
            }`}
          >
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.value}
                onClick={() => setSettingsForm({ ...settingsForm, font_family: font.value })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settingsForm.font_family === font.value
                    ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary'
                    : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'
                }`}
                style={{ fontFamily: font.value }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">{font.label.split(' ')[0]}</span>
                  {settingsForm.font_family === font.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">ABCabc</p>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-50" />

        {/* Color Grid (2 Columns) */}
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
            <Palette size={14} /> Paleta de Colores
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <ColorInput
              label="Color de Énfasis"
              value={settingsForm.primary_color}
              onChange={(val) => setSettingsForm({ ...settingsForm, primary_color: val })}
            />
            <ColorInput
              label="Color Secundario"
              value={settingsForm.theme_secondary}
              onChange={(val) => setSettingsForm({ ...settingsForm, theme_secondary: val })}
              disabled={isAdvancedLocked}
              isPremium={isAdvancedLocked}
            />
            <ColorInput
              label="Fondo de la App"
              value={settingsForm.theme_background}
              onChange={(val) => setSettingsForm({ ...settingsForm, theme_background: val })}
              disabled={isAdvancedLocked}
              isPremium={isAdvancedLocked}
            />
            <ColorInput
              label="Texto General"
              value={settingsForm.theme_text}
              onChange={(val) => setSettingsForm({ ...settingsForm, theme_text: val })}
              disabled={isAdvancedLocked}
              isPremium={isAdvancedLocked}
            />
            <ColorInput
              label="Tarjetas / Cards"
              value={settingsForm.theme_card_bg}
              onChange={(val) => setSettingsForm({ ...settingsForm, theme_card_bg: val })}
              disabled={isAdvancedLocked}
              isPremium={isAdvancedLocked}
            />
            <ColorInput
              label="Pie de Página"
              value={settingsForm.theme_footer_bg}
              onChange={(val) => setSettingsForm({ ...settingsForm, theme_footer_bg: val })}
              disabled={isAdvancedLocked}
              isPremium={isAdvancedLocked}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
