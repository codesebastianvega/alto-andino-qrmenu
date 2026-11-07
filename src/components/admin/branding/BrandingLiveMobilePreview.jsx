import React from 'react';
import { Icon } from '@iconify/react';

export default function BrandingLiveMobilePreview({ settingsForm }) {
  return (
    <div className="xl:col-span-4 lg:sticky top-24 space-y-6">
      <div className="bg-[#0F170F] rounded-[3rem] p-3 shadow-2xl relative overflow-hidden border-8 border-[#1C2B1E]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-5 bg-[#1C2B1E] rounded-b-2xl z-20" />

        <div
          className="aspect-[9/18.5] rounded-[2.5rem] overflow-hidden flex flex-col transition-all duration-500 relative"
          style={{
            backgroundColor: settingsForm.theme_background,
            fontFamily: settingsForm.font_family,
          }}
        >
          {/* Internal Preview UI */}
          <div className="p-6 flex justify-center py-10">
            {settingsForm.logo_url ? (
              <img
                src={settingsForm.logo_url}
                className="h-10 object-contain"
                alt="Preview logo"
              />
            ) : (
              <span
                className="text-base font-black tracking-tighter uppercase"
                style={{ color: settingsForm.theme_text }}
              >
                {settingsForm.business_name || 'BRAND'}
              </span>
            )}
          </div>

          <div className="px-6 flex-1 space-y-6">
            <div
              className="h-28 rounded-2xl p-4 flex flex-col justify-end overflow-hidden relative shadow-sm"
              style={{ backgroundColor: settingsForm.theme_secondary }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="relative z-10 space-y-2">
                <div className="w-1/3 h-1.5 bg-white/30 rounded-full" />
                <div className="w-full h-3.5 bg-white/50 rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/5] rounded-2xl shadow-sm p-3 flex flex-col justify-between transition-all border border-gray-100/50"
                  style={{ backgroundColor: settingsForm.theme_card_bg }}
                >
                  <div className="w-full aspect-square rounded-xl bg-gray-100 flex items-center justify-center text-gray-200">
                    <Icon icon="solar:plate-linear" width="24" />
                  </div>
                  <div className="space-y-2 mt-2">
                    <div
                      className="w-full h-1.5 rounded-full"
                      style={{ backgroundColor: settingsForm.theme_text + '20' }}
                    />
                    <div
                      className="w-3/4 h-2 rounded-full"
                      style={{ backgroundColor: settingsForm.primary_color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-center">
              <div
                className="px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: settingsForm.primary_color, color: '#FFFFFF' }}
              >
                Hacer Pedido
              </div>
            </div>
          </div>

          <div
            className="p-8 text-center"
            style={{ backgroundColor: settingsForm.theme_footer_bg }}
          >
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto" />
            <p className="text-[7px] text-white/30 uppercase font-black tracking-[0.3em] mt-5">
              Power by ALUNA
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100/60">
            <Icon icon="solar:magic-stick-3-bold-duotone" className="text-xl" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Previsualización Live
            </h4>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed font-medium">
              Simulación en tiempo real de tu menú móvil. Recuerda guardar los cambios para
              aplicarlos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
