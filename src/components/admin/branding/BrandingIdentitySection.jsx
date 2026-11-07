import React from 'react';
import { FormField, TextInput, ImageGuidance } from '../ui';
import { Icon } from '@iconify/react';
import { Loader2, Upload } from 'lucide-react';
import { getMaxImageSizeMB } from '../../../utils/images';

export default function BrandingIdentitySection({
  settingsForm,
  setSettingsForm,
  isAdvancedLocked,
  activeBrand,
  uploadingFavicon,
  uploadingLogo,
  onFileUpload,
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition-all">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0 border border-emerald-100/60">
            <Icon icon="solar:shop-2-bold-duotone" className="text-xl" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Identidad Visual
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Logotipo principal y favicon para la pestaña del navegador
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <FormField label="Nombre del Negocio" htmlFor="business_name">
            <TextInput
              id="business_name"
              name="business_name"
              value={settingsForm.business_name}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, business_name: e.target.value })
              }
              placeholder="Ej. Mi Restaurante Gourmet"
            />
          </FormField>

          <div className="relative">
            <FormField
              htmlFor="favicon_url"
              label={
                <div className="flex items-center justify-between w-full">
                  <span>Favicon (Pestaña Navegador)</span>
                  {isAdvancedLocked && (
                    <span className="text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1 font-black">
                      <Icon icon="solar:crown-minimalistic-bold" /> PRO
                    </span>
                  )}
                </div>
              }
            >
              <div className="space-y-3">
                <div className="flex gap-2">
                  <TextInput
                    id="favicon_url"
                    name="favicon_url"
                    disabled={isAdvancedLocked}
                    value={settingsForm.favicon_url}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, favicon_url: e.target.value })
                    }
                    placeholder={
                      isAdvancedLocked ? 'Incluido en Plan Esencial...' : 'URL del favicon...'
                    }
                    className="text-xs font-mono"
                  />
                  <label
                    className={`shrink-0 p-2.5 bg-gray-100 rounded-xl transition-colors ${
                      isAdvancedLocked
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-200 cursor-pointer'
                    }`}
                  >
                    {uploadingFavicon ? (
                      <Loader2 size={18} className="animate-spin text-gray-400" />
                    ) : (
                      <Upload size={18} className="text-gray-600" />
                    )}
                    {!isAdvancedLocked && (
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => onFileUpload(e, 'favicon')}
                        disabled={uploadingFavicon}
                      />
                    )}
                  </label>
                </div>
                <ImageGuidance maxMB={getMaxImageSizeMB(activeBrand?.plan_id)} />
              </div>
            </FormField>
          </div>
        </div>

        <div className="bg-gray-50/50 rounded-2xl p-5 border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 group">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Logotipo Principal
          </p>
          <div className="relative w-full aspect-video max-h-32 rounded-xl overflow-hidden bg-white border border-gray-100 shadow-inner flex items-center justify-center p-6 transition-all group-hover:border-brand-primary/30">
            {settingsForm.logo_url ? (
              <img
                src={settingsForm.logo_url}
                className="max-w-full max-h-full object-contain drop-shadow-sm"
                alt="Logo"
              />
            ) : (
              <Icon icon="solar:gallery-wide-linear" className="text-gray-200" width="48" />
            )}
          </div>
          <label className="w-full">
            <div className="flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-[0.98]">
              {uploadingLogo ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Icon icon="solar:upload-linear" width="14" />
              )}
              {settingsForm.logo_url ? 'Cambiar Logo' : 'Subir Logo'}
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => onFileUpload(e, 'logo')}
              disabled={uploadingLogo}
            />
          </label>
          <div className="w-full">
            <ImageGuidance maxMB={getMaxImageSizeMB(activeBrand?.plan_id)} />
          </div>
        </div>
      </div>
    </section>
  );
}
