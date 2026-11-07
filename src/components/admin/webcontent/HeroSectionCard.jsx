import React from 'react';
import { Icon } from '@iconify-icon/react';
import { Loader2 } from 'lucide-react';

const EMOJI_OPTIONS = ['🍱', '🍣', '🍜', '🥟', '🥗', '🍙', '🍛', '🍲', '🥑', '🥩', '🍤', '🥢', '🍵', '🍚', '🍢', '🍳', '🍶', '🥂', '🔥', '✨'];

export default function HeroSectionCard({
  data,
  setData,
  uploadingImage,
  handleImageUpload
}) {
  const selected = (data.hero_emojis || '').split(',').map(e => e.trim()).filter(Boolean);

  const toggleEmoji = (emoji) => {
    let next;
    if (selected.includes(emoji)) {
      next = selected.filter(e => e !== emoji);
    } else {
      if (selected.length >= 4) return;
      next = [...selected, emoji];
    }
    setData({ ...data, hero_emojis: next.join(',') });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100/60">
            <Icon icon="solar:crown-bold-duotone" className="text-xl" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Portada Principal (Hero)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Encabezado principal visible cuando los clientes abren tu página web</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-7 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Título de Alto Impacto (H1)
              </label>
              <textarea
                value={data.hero_h1 || ''}
                onChange={(e) => setData({ ...data, hero_h1: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-base font-bold text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all placeholder:text-gray-400 min-h-[120px] shadow-2xs resize-none"
                placeholder={`Descubre tus\nplatos favoritos`}
              />
              <p className="text-[11px] text-gray-400 mt-1.5">Separa con saltos de línea para estructurar el mensaje.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Subtítulo Convencedor
              </label>
              <textarea
                value={data.hero_subtitle || ''}
                onChange={(e) => setData({ ...data, hero_subtitle: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-700 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all placeholder:text-gray-400 min-h-[90px] shadow-2xs resize-none"
                placeholder="Ej. Explora una experiencia gastronómica andina..."
              />
              <p className="text-[11px] text-gray-400 mt-1.5">Frase de apoyo que complementa la propuesta de valor.</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">Emojis Dinámicos</label>
                <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-semibold">Máx. 4</span>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 min-h-[46px] p-2 bg-white rounded-xl border border-dashed border-gray-200">
                  {selected.length > 0 ? selected.map((em, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleEmoji(em)}
                      className="flex items-center gap-2 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-lg px-3 py-1.5 transition-all group border border-gray-100 hover:border-red-100 cursor-pointer"
                    >
                      <span className="text-lg">{em}</span>
                      <Icon icon="solar:close-circle-bold-duotone" className="text-gray-300 group-hover:text-red-400" />
                    </button>
                  )) : (
                    <div className="flex items-center justify-center w-full text-[10px] text-gray-300 font-bold uppercase tracking-[0.1em] pt-2">
                      Selecciona hasta 4 emojis
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 p-4 bg-white/50 rounded-2xl border border-gray-100">
                  {EMOJI_OPTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => toggleEmoji(em)}
                      className={`w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all cursor-pointer ${
                        selected.includes(em)
                          ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-100'
                          : 'hover:bg-gray-100 text-gray-600 hover:scale-110'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 block">Bienvenida Global (Ritual)</label>
              <div className="group relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-200/80 shadow-xs h-48 transition-all">
                {data.welcome_bg_img ? (
                  <img
                    src={data.welcome_bg_img}
                    alt="Welcome Ritual"
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-2">
                    <Icon icon="solar:gallery-wide-bold-duotone" className="text-4xl text-gray-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Sin Imagen Definida</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5">
                  <label className="flex items-center justify-center gap-2.5 w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-xl text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-all">
                    {uploadingImage ? <Loader2 className="animate-spin w-4 h-4" /> : <Icon icon="solar:upload-bold-duotone" className="text-base" />}
                    <span>{uploadingImage ? 'Procesando...' : 'Cambiar Imagen de Fondo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'welcome_bg_img')}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
