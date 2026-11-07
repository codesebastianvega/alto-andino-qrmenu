import React from 'react';
import { Icon } from '@iconify-icon/react';
import { isUnsplashPageLink } from '../helpers/productFormHelpers';

export default function ProductImageSection({
  imageUrl,
  name,
  onImageChange,
  onClearImage,
  imgError,
  setImgError,
  uploadStats,
  liveImageSize,
  isUploading,
  fileInputRef,
  handleImageUpload
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Icon icon="heroicons:camera" className="text-slate-400 text-sm" />
          Fotografía del Plato
        </span>
        {imageUrl && !imgError && (
          <div className="flex items-center gap-1.5">
            {uploadStats?.reduction && (
              <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {Number(uploadStats.original) > 1024
                  ? `${(Number(uploadStats.original) / 1024).toFixed(1)} MB`
                  : `${uploadStats.original} KB`}{' '}
                ➔ {uploadStats.final} KB
              </span>
            )}
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
              <Icon icon="heroicons:sparkles" className="text-[10px] text-emerald-600" />
              {uploadStats?.reduction
                ? `WebP (-${uploadStats.reduction}%)`
                : liveImageSize
                ? `WebP (${liveImageSize} KB)`
                : 'Optimizado WebP'}
            </span>
          </div>
        )}
      </div>

      {/* Preview Box */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-3 group">
        {imageUrl && !imgError ? (
          <>
            <img
              src={imageUrl}
              alt={name || 'Preview'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
            <button
              type="button"
              onClick={onClearImage}
              className="absolute top-2.5 right-2.5 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-lg transition-all shadow-md cursor-pointer"
              title="Eliminar imagen"
            >
              <Icon icon="heroicons:trash" className="text-sm" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Icon icon="heroicons:photo" className="text-3xl text-slate-300 mb-1" />
            <p className="text-xs font-semibold text-slate-400">Sin foto del plato</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Sube un archivo WebP o ingresa una URL</p>
          </div>
        )}
      </div>

      {/* Chips de Validación Visual de Compresión & Peso */}
      {imageUrl && !imgError && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 mb-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Icon icon="heroicons:chart-bar" className="text-emerald-600 text-xs" />
              Auditoría Visual de Peso
            </span>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {uploadStats?.reduction ? `Comprimido (-${uploadStats.reduction}%)` : 'Optimizado en Servidor'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-0.5">
            {/* Peso Actual */}
            <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Peso Actual</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xs font-black text-slate-800">
                  {uploadStats?.final
                    ? `${uploadStats.final} KB`
                    : liveImageSize
                    ? `${liveImageSize} KB`
                    : 'Detectando...'}
                </span>
                <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  WebP
                </span>
              </div>
            </div>

            {/* Peso Original o Estado */}
            <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                {uploadStats?.original ? 'Peso Original' : 'Estado CDN'}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xs font-black text-slate-600">
                  {uploadStats?.original
                    ? Number(uploadStats.original) > 1024
                      ? `${(Number(uploadStats.original) / 1024).toFixed(2)} MB`
                      : `${uploadStats.original} KB`
                    : liveImageSize && Number(liveImageSize) < 150
                    ? 'Ultraligero'
                    : 'Web Ready'}
                </span>
                {uploadStats?.reduction && (
                  <span className="text-[9px] font-black text-emerald-600">(-{uploadStats.reduction}%)</span>
                )}
              </div>
            </div>

            {/* Carga en Móvil */}
            <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Carga Móvil</span>
              <div className="flex items-center gap-1 mt-0.5">
                <Icon icon="heroicons:bolt" className="text-amber-500 text-xs shrink-0" />
                <span className="text-xs font-black text-emerald-600">
                  {uploadStats?.final && Number(uploadStats.final) < 200
                    ? '< 0.1s'
                    : liveImageSize && Number(liveImageSize) < 200
                    ? '< 0.1s'
                    : 'Rápida'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium pt-0.5">
            <Icon icon="heroicons:check-circle" className="text-emerald-600 text-xs shrink-0" />
            <span>Tu imagen carga ultra rápido en los celulares de los clientes y no consume datos móviles.</span>
          </div>
        </div>
      )}

      {/* Warnings */}
      {isUnsplashPageLink(imageUrl) && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-3 text-[11px] text-amber-800">
          <p className="font-bold">⚠️ Enlace de página de Unsplash detectado</p>
          <p className="text-[10px] text-amber-700 mt-0.5">
            Haz clic derecho en la foto de Unsplash y elige <em>"Copiar dirección de imagen"</em> (debe iniciar con images.unsplash.com).
          </p>
        </div>
      )}

      {/* File Upload Dropzone */}
      <label
        className={`group relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-all cursor-pointer mb-3 ${
          isUploading
            ? 'bg-slate-50 border-slate-200 cursor-not-allowed'
            : 'border-slate-300 bg-slate-50/60 hover:border-emerald-500 hover:bg-emerald-50/20'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={fileInputRef}
          disabled={isUploading}
          className="hidden"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Icon
              icon={isUploading ? 'lucide:loader-2' : 'lucide:upload-cloud'}
              className={`text-base ${isUploading ? 'animate-spin' : ''}`}
            />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-800">
              {isUploading ? 'Comprimiendo y subiendo...' : 'Subir imagen desde equipo'}
            </p>
            <p className="text-[10px] text-slate-600">Conversión automática a WebP ultraligero</p>
          </div>
        </div>
      </label>

      {/* URL Input */}
      <div className="relative">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
          O vincular URL externa (Unsplash, Drive, CDN)
        </span>
        <input
          type="text"
          name="image_url"
          value={imageUrl}
          onChange={onImageChange}
          placeholder="https://images.unsplash.com/... o enlace de Drive"
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
        />
      </div>
    </div>
  );
}
