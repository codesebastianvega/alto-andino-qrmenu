import { Icon } from '@iconify-icon/react';
import { Loader2, Settings, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import { Switch } from '../ui';
import { supabase } from '../../../config/supabase';
import { toast as toastFn } from '../../../components/Toast';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export default function HeroCategoriesCard({
  allCategories = [],
  loadingCategories = false,
  allProducts = [],
  editingHeroCategory,
  setEditingHeroCategory,
  toggleCategoryHero,
  setHeroFeaturedProduct,
  setAllCategories,
  refetchMenuData
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Icon icon="solar:stars-minimalistic-bold-duotone" className="text-indigo-600 text-xl" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Categorías Destacadas (Hero)</h4>
            <p className="text-[11px] text-gray-500 font-medium">Selecciona las categorías que aparecerán en el carrusel principal.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
          <span className={`w-2 h-2 rounded-full ${allCategories.filter(c => c.visibility_config?.show_in_hero).length >= 5 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            {allCategories.filter(c => c.visibility_config?.show_in_hero).length} / 5 Seleccionadas
          </span>
        </div>
      </div>

      {loadingCategories ? (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
          <Loader2 className="w-8 h-8 text-indigo-200 animate-spin" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">Cargando categorías...</span>
        </div>
      ) : allCategories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
          <Icon icon="solar:folder-error-bold-duotone" className="text-4xl text-gray-200" />
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-4">No se encontraron categorías</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allCategories.map((category) => {
            const isActive = category.visibility_config?.show_in_hero;

            // Check if category is currently active based on dayparting
            const isScheduled = () => {
              const now = new Date();
              const currentDay = now.getDay();
              const config = category.visibility_config || {};
              const allowedDays = config.days || [0, 1, 2, 3, 4, 5, 6];

              if (!allowedDays.includes(currentDay)) return false;
              if (!category.available_from && !category.available_to) return true;

              const currentMinutes = now.getHours() * 60 + now.getMinutes();
              const parseTime = (t) => {
                if (!t) return null;
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
              };
              const from = parseTime(category.available_from);
              const to = parseTime(category.available_to);

              if (from !== null && to !== null) {
                return from < to ? (currentMinutes >= from && currentMinutes <= to) : (currentMinutes >= from || currentMinutes <= to);
              }
              if (from !== null) return currentMinutes >= from;
              if (to !== null) return currentMinutes <= to;
              return true;
            };

            const isCurrentlyVisible = isScheduled();
            const vc = category.visibility_config || {};
            const featuredProduct = allProducts.find(p => p.id === vc.hero_featured_product_id);

            const displayImg = vc.hero_custom_image
              || featuredProduct?.image_url
              || allProducts.find(p => p.category_id === category.id && p.image_url)?.image_url;

            return (
              <div
                key={category.id}
                className={`group relative bg-white rounded-[2rem] border-2 transition-all duration-300 overflow-hidden ${
                  isActive
                    ? 'border-indigo-100 shadow-md ring-1 ring-indigo-50/50'
                    : 'border-gray-50 hover:border-gray-100'
                }`}
              >
                <div className="p-5 flex flex-col gap-4">
                  {/* Header: Icon/Img + Toggle */}
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all overflow-hidden shadow-sm ${
                      isActive ? 'ring-2 ring-indigo-100 ring-offset-2' : 'bg-gray-50'
                    }`}>
                      {displayImg ? (
                        <img src={displayImg} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Icon icon="solar:plate-bold-duotone" className="text-2xl text-gray-300" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <button
                          type="button"
                          onClick={() => setEditingHeroCategory(editingHeroCategory === category.id ? null : category.id)}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            editingHeroCategory === category.id
                              ? 'bg-indigo-600 text-white shadow-lg'
                              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                          }`}
                          title="Configurar Chip"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      )}
                      <Switch
                        checked={!!isActive}
                        onChange={() => toggleCategoryHero(category)}
                      />
                    </div>
                  </div>

                  {/* Content: Title + Status */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-gray-900 truncate flex-1">{category.name}</h5>
                      {isActive && (
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isCurrentlyVisible ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {isCurrentlyVisible ? (
                            <><div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Activo</>
                          ) : (
                            <><Calendar className="w-2.5 h-2.5" /> Programado</>
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {isActive ? 'Visible en el carrusel principal' : 'No se muestra en el Hero'}
                    </p>
                  </div>
                </div>

                {/* Detailed Config Panel */}
                {editingHeroCategory === category.id && (
                  <div className="border-t border-indigo-50 bg-indigo-50/20 p-5 space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plato Protagonista</label>
                        <Icon icon="solar:magic-stick-3-bold-duotone" className="text-indigo-400" />
                      </div>

                      <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                        {allProducts.filter(p => p.category_id === category.id).length === 0 ? (
                          <div className="p-4 bg-white rounded-2xl border border-dashed border-gray-100 text-center">
                            <AlertCircle className="w-5 h-5 text-gray-200 mx-auto mb-2" />
                            <p className="text-[10px] text-gray-400 italic">Agrega platos a esta categoría primero</p>
                          </div>
                        ) : allProducts.filter(p => p.category_id === category.id).map(prod => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => setHeroFeaturedProduct(category, prod.id)}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left border-2 cursor-pointer ${
                              category.visibility_config?.hero_featured_product_id === prod.id
                                ? 'bg-white border-indigo-600 shadow-sm'
                                : 'bg-white/50 border-transparent hover:border-gray-100 hover:bg-white'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 shadow-sm">
                              {prod.image_url ? (
                                <img src={prod.image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <Icon icon="solar:plate-line-duotone" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[11px] font-bold truncate ${
                                category.visibility_config?.hero_featured_product_id === prod.id ? 'text-indigo-600' : 'text-gray-700'
                              }`}>{prod.name}</p>
                              <p className="text-[9px] text-gray-400 font-medium">
                                {prod.price ? `$${(prod.price / 1000).toFixed(0)}k` : 'Consultar'}
                              </p>
                            </div>
                            {category.visibility_config?.hero_featured_product_id === prod.id && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-1.5 pt-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Icon icon="solar:gallery-bold-duotone" className="text-indigo-400" />
                          Imagen Personalizada (URL)
                        </label>
                        <input
                          type="text"
                          value={category.visibility_config?.hero_custom_image || ''}
                          onChange={async (e) => {
                            const val = e.target.value;
                            const newConfig = { ...(category.visibility_config || {}), hero_custom_image: val };

                            setAllCategories(prev => prev.map(c => c.id === category.id ? { ...c, visibility_config: newConfig } : c));

                            const { error } = await supabase.from('categories').update({ visibility_config: newConfig }).eq('id', category.id);
                            if (error) toast.error('Error al guardar imagen');
                            if (refetchMenuData) refetchMenuData();
                          }}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
                        />
                        <p className="text-[9px] text-gray-400 italic">Si dejas esto vacío, usaremos la imagen del plato seleccionado arriba.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingHeroCategory(null)}
                      className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 cursor-pointer"
                    >
                      Listo
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
