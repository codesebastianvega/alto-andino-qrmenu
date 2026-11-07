import React from 'react';
import { Icon } from '@iconify-icon/react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function ModifierGroupCard({
  group,
  allGroups,
  isAllLocations,
  isExpanded,
  onToggleExpand,
  onDuplicateGroup,
  onEditGroup,
  onDeleteGroup,
  onOpenOption,
  onToggleOptionActive,
  onDeleteOption,
}) {
  return (
    <div className="group relative border border-gray-100/80 rounded-3xl p-6 bg-white shadow-sm flex flex-col h-full hover:shadow-xl hover:shadow-[#2f4131]/5 transition-all duration-300 border-b-4 hover:border-b-[#2f4131]/30">
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-[#2f4131] transition-colors">
            {group.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
            {group.description || 'Sin descripción'}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDuplicateGroup(group)}
            className="p-1.5 bg-white text-gray-400 hover:text-emerald-600 rounded-lg shadow-sm border border-gray-100 transition-all hover:scale-110 cursor-pointer"
            title="Duplicar Grupo"
          >
            <Icon icon="heroicons:document-duplicate" className="text-lg" />
          </button>
          <button
            onClick={() => onEditGroup(group)}
            className="p-1.5 bg-white text-gray-400 hover:text-blue-600 rounded-lg shadow-sm border border-gray-100 transition-all hover:scale-110 cursor-pointer"
            title="Editar Grupo"
          >
            <Icon icon="heroicons:pencil-square" className="text-lg" />
          </button>
          <button
            onClick={() => onDeleteGroup(group.id)}
            className="p-1.5 bg-white text-gray-400 hover:text-red-600 rounded-lg shadow-sm border border-gray-100 transition-all hover:scale-110 cursor-pointer"
            title="Eliminar Grupo"
          >
            <Icon icon="heroicons:trash" className="text-lg" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <span
          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border shadow-sm ${
            group.is_required
              ? 'bg-red-50 text-red-600 border-red-100'
              : 'bg-blue-50 text-blue-600 border-blue-100'
          }`}
        >
          {group.is_required ? 'Obligatorio' : 'Opcional'}
        </span>
        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
          Min {group.min_select} · Max {group.max_select}
        </span>
        {group.usage_count > 0 && (
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-violet-50 text-violet-600 border border-violet-100 shadow-sm flex items-center gap-1">
            <Icon icon="heroicons:shopping-bag" />
            {group.usage_count} {group.usage_count === 1 ? 'Producto' : 'Productos'}
          </span>
        )}
        {!isAllLocations &&
          (group.linked_usage_count > 0 ? (
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm flex items-center gap-1">
              <CheckCircle size={12} />
              En uso
            </span>
          ) : (
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-amber-50 text-amber-600 border border-amber-100 shadow-sm flex items-center gap-1">
              <AlertTriangle size={12} />
              Sin uso en sede
            </span>
          ))}
      </div>

      <div className="flex-1 space-y-2 mt-2 border-t border-gray-100 pt-5">
        {!isExpanded && group.options?.length > 0 && (
          <div className="mb-4 space-y-1.5 animate-slide-up">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Vista previa opciones
            </p>
            {group.options.slice(0, 3).map((opt) => (
              <div
                key={opt.id}
                className="flex items-center gap-2 text-[11px] text-gray-600 px-2 py-1 bg-white/40 rounded-lg border border-gray-50"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    opt.is_active === false ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                />
                <span
                  className={`font-medium truncate ${
                    opt.is_active === false ? 'line-through text-gray-400' : ''
                  }`}
                >
                  {opt.name}
                </span>
                {opt.is_active === false && (
                  <span className="text-[9px] font-extrabold uppercase px-1 rounded bg-rose-50 text-rose-600">
                    Agotado
                  </span>
                )}
                <span className="ml-auto font-black text-[#2f4131]/40">${opt.price || 0}</span>
              </div>
            ))}
            {group.options.length > 3 && (
              <p className="text-[10px] text-[#2f4131] font-bold mt-1 ml-2">
                + {group.options.length - 3} opciones más...
              </p>
            )}
          </div>
        )}

        <button
          onClick={() => onToggleExpand(group.id)}
          className={`w-full flex items-center justify-between text-left p-2 rounded-xl transition-all cursor-pointer ${
            isExpanded
              ? 'bg-[#2f4131] text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-widest ml-1">
            Gestionar Opciones ({group.options?.length || 0})
          </p>
          <Icon
            icon="heroicons:chevron-down"
            className={`text-lg transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {isExpanded && (
          <div className="space-y-2 mt-3 animate-fade-in">
            {group.options?.map((opt) => {
              const isOptActive = opt.is_active !== false;
              const nestedGroup =
                opt.nested_group_id && allGroups.find((g) => g.id === opt.nested_group_id);

              return (
                <div
                  key={opt.id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-all ${
                    !isOptActive
                      ? 'bg-rose-50/40 border-rose-200/60'
                      : 'bg-white border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-semibold text-xs sm:text-sm truncate ${
                          !isOptActive ? 'text-gray-400 line-through' : 'text-gray-800'
                        }`}
                      >
                        {opt.name}
                      </span>
                      {!isOptActive && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-700 tracking-wider uppercase">
                          Agotado
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap mt-0.5">
                      {opt.ingredient_id && (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                          <Icon icon="heroicons:link" /> Usa Insumo
                        </span>
                      )}
                      {nestedGroup && (
                        <span className="text-[10px] text-blue-600 flex items-center gap-1">
                          <Icon icon="heroicons:arrow-right-circle" /> Despliega:{' '}
                          {nestedGroup.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-gray-500 text-xs">
                      +{opt.price ? `$${Number(opt.price).toLocaleString()}` : '$0'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleOptionActive(opt.id, !isOptActive)}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        !isOptActive
                          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                      title={
                        isOptActive
                          ? 'Click para apagar (Agotar)'
                          : 'Click para activar (Disponible)'
                      }
                    >
                      <Icon
                        icon={isOptActive ? 'heroicons:check-circle' : 'heroicons:x-circle'}
                        className="text-base"
                      />
                      <span className="hidden sm:inline text-[11px] font-bold">
                        {isOptActive ? 'Activo' : 'Agotado'}
                      </span>
                    </button>
                    <button
                      onClick={() => onOpenOption(group.id, opt)}
                      className="text-gray-400 hover:text-blue-600 p-1 cursor-pointer"
                      title="Editar"
                    >
                      <Icon icon="heroicons:pencil-square" className="text-base" />
                    </button>
                    <button
                      onClick={() => onDeleteOption(opt.id)}
                      className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                      title="Eliminar"
                    >
                      <Icon icon="heroicons:x-mark" className="text-base" />
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => onOpenOption(group.id)}
              className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-gray-300 text-sm font-semibold text-gray-500 hover:text-gray-800 hover:border-gray-400 hover:bg-gray-100 transition-all cursor-pointer"
            >
              + Agregar Opción
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
