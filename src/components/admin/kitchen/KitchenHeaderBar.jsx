import { Icon } from '@iconify-icon/react';
import { toast } from '../../Toast';
import soundService from '../../../utils/soundService';

export default function KitchenHeaderBar({
  isDark,
  stationFilter,
  setStationFilter,
  isSoundLoopActive,
  viewMode,
  setViewMode,
  activeCount,
  newCount,
  preparingCount,
  allRecipesCount,
  onOpen86Drawer,
  onOpenRecipes,
  onToggleTheme,
  onRefresh,
  onToggleFullScreen
}) {
  return (
    <div className={`mb-4 pb-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
      isDark ? 'border-gray-800/80' : 'border-slate-200'
    }`}>
      {/* Left: Station & Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍳</span>
          <h1 className={`text-base sm:text-lg font-black tracking-tight uppercase ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            KDS <span className="text-emerald-600">Cocina</span>
          </h1>
        </div>

        {/* Selector de Estación */}
        <div className={`flex rounded-lg p-0.5 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-slate-200/70 border-slate-300/60'
        }`}>
          {[
            { id: 'kitchen', label: 'Cocina', emoji: '🍳' },
            { id: 'bar', label: 'Barra', emoji: '🍸' },
            { id: 'all', label: 'Pase Expo', emoji: '📋' }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStationFilter(st.id)}
              className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${
                stationFilter === st.id
                  ? (isDark ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900 shadow-xs')
                  : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-slate-600 hover:text-slate-900')
              }`}
            >
              <span>{st.emoji}</span>
              <span>{st.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: View Modes & Quick Tools */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Botón Silenciar Alarma si está sonando */}
        {isSoundLoopActive && (
          <button
            type="button"
            onClick={() => soundService.stopNewOrderLoop()}
            className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-lg text-xs font-black shadow-md animate-pulse border border-yellow-500 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Silenciar sonido de la alarma continua"
          >
            <Icon icon="heroicons:speaker-wave" className="text-base animate-bounce" />
            <span>Silenciar Alarma</span>
          </button>
        )}

        {/* Botón Probar / Activar Sonido en Tablet */}
        <button
          type="button"
          onClick={() => {
            soundService.unlockAudio();
            soundService.playNewOrder();
            toast('Sonido de prueba emitido 🔊', { icon: '🔔' });
          }}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
            isDark 
              ? 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700' 
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-2xs'
          }`}
          title="Toca para probar o activar el sonido de pedidos en esta tablet"
        >
          <Icon icon="heroicons:speaker-wave" className="text-emerald-500 text-sm" />
          <span className="hidden sm:inline">Probar Sonido</span>
        </button>

        {/* Filtros de Estado */}
        <div className={`flex rounded-lg p-0.5 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-slate-200/70 border-slate-300/60'
        }`}>
          {[
            { id: 'all', label: 'Todos', count: activeCount },
            { id: 'new', label: 'En Cola', count: newCount },
            { id: 'preparing', label: 'En Fuego', count: preparingCount },
            { id: 'batch', label: 'Rondas' }
          ].map(vm => (
            <button
              key={vm.id}
              onClick={() => setViewMode(vm.id)}
              className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                viewMode === vm.id
                  ? (isDark ? 'bg-gray-800 text-white' : 'bg-white text-slate-900 shadow-xs')
                  : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-slate-600 hover:text-slate-900')
              }`}
            >
              <span>{vm.label}</span>
              {vm.count !== undefined && (
                <span className={`text-[10px] px-1 rounded font-mono ${
                  viewMode === vm.id 
                    ? (isDark ? 'bg-gray-700 text-white' : 'bg-slate-100 text-slate-800') 
                    : (isDark ? 'bg-gray-800 text-gray-400' : 'bg-slate-300/60 text-slate-700')
                }`}>
                  {vm.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Quick Actions (Theme, Refresh, Fullscreen, Recipes) */}
        <div className={`flex items-center gap-1 rounded-lg p-0.5 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <button
            onClick={onOpen86Drawer}
            title="Mise en Place & Control Auto-86 de Insumos"
            className={`h-7 px-2.5 flex items-center gap-1 rounded text-xs font-bold transition-all ${
              isDark 
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40' 
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 shadow-2xs'
            }`}
          >
            <span>⚡</span>
            <span>Mise en Place & 86</span>
          </button>
          <button
            onClick={onOpenRecipes}
            title="Ver Fichas Técnicas & Subrecetas de Cocina"
            className={`h-7 px-2.5 flex items-center gap-1 rounded text-xs font-bold transition-colors ${
              isDark 
                ? 'bg-indigo-950/80 text-indigo-300 hover:bg-indigo-900 border border-indigo-800/60' 
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <Icon icon="heroicons:book-open" className="text-sm" />
            <span className="hidden sm:inline">Fichas ({allRecipesCount})</span>
          </button>
          <button
            onClick={onToggleTheme}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className={`w-8 h-7 flex items-center justify-center rounded transition-colors ${
              isDark ? 'text-amber-400 hover:bg-gray-800' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon icon={isDark ? 'solar:sun-2-bold' : 'solar:moon-stars-bold'} className="text-sm" />
          </button>
          <button
            onClick={onRefresh}
            title="Refrescar comanda"
            className={`w-8 h-7 flex items-center justify-center rounded transition-colors ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Icon icon="heroicons:arrow-path" className="text-sm" />
          </button>
          <button
            onClick={onToggleFullScreen}
            title="Pantalla Completa"
            className={`w-8 h-7 flex items-center justify-center rounded transition-colors ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Icon icon="heroicons:arrows-pointing-out" className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
