import React from 'react';
import { PageHeader } from '../ui';
import { Icon } from '@iconify/react';
import { Loader2 } from 'lucide-react';

export default function BrandingHeader({
  activeBrand,
  onSave,
  isSubmitting,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fadeUp">
      <PageHeader
        badge="Configuración Visual"
        title="Identidad de Marca"
        subtitle={`Ajusta la apariencia visual, colores y logotipos de ${
          activeBrand?.name || 'tu marca'
        }.`}
      />

      <div className="flex items-center gap-3 self-start md:self-auto">
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200/80 px-4 py-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600 shrink-0 border border-pink-100/60">
            <Icon icon="solar:palette-bold-duotone" className="text-base" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Marca Activa
            </p>
            <p className="text-xs font-bold text-gray-900">{activeBrand?.name || 'Cargando...'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Icon icon="solar:diskette-bold-duotone" className="text-base" />
              <span>Guardar Todo</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
