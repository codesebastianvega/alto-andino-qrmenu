import React from 'react';
import { Icon } from '@iconify-icon/react';
import { Loader2 } from 'lucide-react';
import { FormField, TextInput, Switch } from '../ui';
import { formatCOP } from '../../../utils/money';

export default function MenuBannerTab({
  data,
  setData,
  allProducts = [],
  uploadingImage,
  handleImageUpload
}) {
  return (
    <div className="space-y-6 animate-fadeUp">
      {/* CARD 1: ENCABEZADO DE TEXTO */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100/60">
              <Icon icon="solar:text-field-focus-bold-duotone" className="text-xl" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">1. Encabezado de la Carta (Texto)</h3>
              <p className="text-xs text-gray-500 mt-0.5">Título y subtítulo que tus comensales leen siempre en la parte superior</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <div className="grid grid-cols-1 gap-5">
            <FormField label="Título del Encabezado del Menú (H1)">
              <TextInput 
                value={data.hero_h1 || ''} 
                onChange={(e) => setData({ ...data, hero_h1: e.target.value })} 
                placeholder="Ej. 🍱 Bento del Día: Especial Mestizo 🍱" 
                className="bg-white border-gray-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-3.5 py-2.5 text-sm font-bold shadow-2xs"
              />
            </FormField>

            <FormField label="Subtítulo del Encabezado del Menú">
              <TextInput 
                value={data.hero_subtitle || ''} 
                onChange={(e) => setData({ ...data, hero_subtitle: e.target.value })} 
                placeholder="Ej. Almuerzo completo a $19.000. Elige Pollo al Curry o Cerdo Teriyaki..." 
                className="bg-white border-gray-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-3.5 py-2.5 text-sm font-medium shadow-2xs"
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* CARD 2: BANNER CON IMAGEN & ACCIÓN RÁPIDA */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
              data.show_menu_banner !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-100/60' : 'bg-gray-100 text-gray-400 border-gray-200'
            }`}>
              <Icon icon={data.show_menu_banner !== false ? "solar:gallery-wide-bold-duotone" : "solar:gallery-remove-bold-duotone"} className="text-xl" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">2. Banner con Imagen en la Cabecera</h3>
              <p className="text-xs text-gray-500 mt-0.5">Portada visual e interactiva que invita a los clientes a pedir un plato o ver la carta</p>
            </div>
          </div>

          {/* Switch Maestro */}
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200/80 px-4 py-2.5 rounded-2xl shrink-0">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-800">
                {data.show_menu_banner !== false ? 'Banner Activado' : 'Solo Encabezado (Sin Banner)'}
              </p>
              <p className="text-[10px] text-gray-400">
                {data.show_menu_banner !== false ? 'Muestra foto + botón de pedido' : 'Oculta el banner con foto'}
              </p>
            </div>
            <Switch 
              checked={data.show_menu_banner !== false}
              onChange={(checked) => setData(prev => ({ ...prev, show_menu_banner: checked }))}
            />
          </div>
        </div>

        {data.show_menu_banner === false ? (
          <div className="p-6 bg-amber-50/50 border-t border-amber-100 flex items-start gap-3">
            <Icon icon="solar:info-circle-bold" className="text-amber-600 text-xl shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-amber-900">Modo Solo Encabezado activo</h5>
              <p className="text-[11px] text-amber-800/80 mt-0.5 leading-relaxed">
                El banner con imagen no aparecerá en el menú. Tus comensales verán únicamente el título y subtítulo de texto superior ("{data.hero_h1 || 'Encabezado'}") y pasarán directamente a explorar las categorías y productos.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-7 space-y-6">
            {/* Selector de Plato Enlazado al Banner */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="solar:bag-heart-bold-duotone" className="text-emerald-700 text-lg" />
                <label className="text-xs font-bold text-emerald-950 uppercase tracking-tight">
                  Al tocar el banner en el celular, ¿qué plato se abre para pedir?
                </label>
              </div>
              <select
                value={data.menu_banner_product_id || ''}
                onChange={(e) => setData({ ...data, menu_banner_product_id: e.target.value })}
                className="w-full bg-white border border-emerald-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-600/30 shadow-2xs cursor-pointer"
              >
                <option value="">-- Ninguno (Hacer scroll suave a la carta) --</option>
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.price ? `— ${formatCOP(p.price)}` : ''} {p.categories?.name ? `(${p.categories.name})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-emerald-800/80 mt-1.5 font-medium">
                Recomendado: Vincula aquí el <strong>Bento del Día</strong> o tu plato estrella. Cuando la clienta toque la foto, se le abrirá el modal para pedirlo al instante con sus modificaciones.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form Side */}
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5">
                  <FormField label="Título del Banner">
                    <TextInput 
                      value={data.menu_banner_title || ''} 
                      onChange={(e) => setData({ ...data, menu_banner_title: e.target.value })} 
                      placeholder="Ej. Nuestra Carta Fusión" 
                      className="bg-white border-gray-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-3.5 py-2.5 text-sm font-medium shadow-2xs"
                    />
                  </FormField>

                  <FormField label="Tag Superior del Banner (Chip)">
                    <TextInput 
                      value={data.menu_banner_tag || ''} 
                      onChange={(e) => setData({ ...data, menu_banner_tag: e.target.value })} 
                      placeholder="Ej. Menú BOKU [僕] • Balance & Sabor" 
                      className="bg-white border-gray-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-3.5 py-2.5 text-sm font-medium shadow-2xs"
                    />
                  </FormField>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                    Descripción / Copy de Bienvenida del Banner
                  </label>
                  <textarea 
                    value={data.menu_banner_subtitle || ''} 
                    onChange={(e) => setData({ ...data, menu_banner_subtitle: e.target.value })} 
                    className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all placeholder:text-gray-400 min-h-[110px] shadow-2xs resize-none"
                    placeholder="Describe brevemente la esencia de tu cocina..."
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">Texto introductorio sobre la propuesta gastronómica.</p>
                </div>
              </div>

              {/* Preview Side */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-700 block">Previsualización del Banner</label>
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gray-900 shadow-xs border border-gray-200/80 group">
                  {data.menu_banner_img ? (
                    <img src={data.menu_banner_img} alt="Menu Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-3 border border-dashed border-gray-300 m-3 rounded-xl bg-gray-50">
                      <Icon icon="solar:gallery-upload-bold-duotone" className="text-4xl text-gray-300" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sube una imagen de fondo</span>
                    </div>
                  )}
                  
                  {/* Floating Badge */}
                  {data.menu_banner_tag && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      {data.menu_banner_tag}
                    </div>
                  )}

                  {/* Content Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5">
                    <h4 className="text-white text-xl font-bold leading-tight mb-2 drop-shadow-sm">
                      {data.menu_banner_title || 'Título del Menú'}
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#1A2421] text-xs font-bold shadow-md">
                        <span>
                          {data.menu_banner_product_id 
                            ? `Pedir ${allProducts.find(p => p.id === data.menu_banner_product_id)?.name || 'Plato'}` 
                            : 'Explorar Menú'}
                        </span>
                        <Icon icon="solar:arrow-right-bold" />
                      </div>
                    </div>
                  </div>

                  {/* Upload Button */}
                  <div className="absolute top-4 right-4 group-hover:opacity-100 transition-opacity">
                    <label className="w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white text-gray-700 hover:text-emerald-700 rounded-xl shadow-md cursor-pointer transition-all">
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon icon="solar:camera-bold-duotone" className="text-lg" />}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUpload(e, 'menu_banner_img')}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 text-center font-medium">Recomendamos imágenes horizontales de 1920x1080px (JPG o WebP).</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* HELP CARD MENU */}
      <div className="p-5 bg-emerald-50/60 border border-emerald-100/80 rounded-2xl flex flex-col sm:flex-row gap-4 items-center relative overflow-hidden">
        <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-xs text-white">
          <Icon icon="solar:lightbulb-bold-duotone" className="text-2xl" />
        </div>
        <div className="relative z-10 flex-1">
          <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Consejo de Diseño Digital</h4>
          <p className="text-xs text-emerald-800/90 mt-0.5 font-medium leading-relaxed">
            "Menos es más". Usa un título corto y directo. Si prefieres una carta limpia sin imágenes pesadas en la parte superior, apaga el banner y tus clientes verán el menú directo.
          </p>
        </div>
      </div>
    </div>
  );
}
