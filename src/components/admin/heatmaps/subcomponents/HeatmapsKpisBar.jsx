import { Clock, Smartphone, ShoppingBag, Users } from 'lucide-react';

export default function HeatmapsKpisBar({ behaviorMetrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI: Tiempo en Pantalla */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-gray-500">
          <span className="text-xs font-bold uppercase tracking-wider">Tiempo en Pantalla</span>
          <Clock className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-black text-gray-900 tracking-tight">
            {behaviorMetrics.formattedDuration}
          </p>
          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            Real
          </span>
        </div>
        <p className="text-[11px] text-gray-400">
          Calculado a partir de los tiempos entre toques de comensales en el menú.
        </p>
      </div>

      {/* KPI: Dispositivos Top Reales */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-gray-500">
          <span className="text-xs font-bold uppercase tracking-wider">Dispositivos Reales</span>
          <Smartphone className="w-4 h-4 text-indigo-600" />
        </div>
        {behaviorMetrics.devices.total > 0 ? (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700 flex items-center gap-1">
                🍏 iPhone / iOS
              </span>
              <span className="font-black text-gray-900">
                {behaviorMetrics.devices.iphone.pct}% ({behaviorMetrics.devices.iphone.count})
              </span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{ width: `${behaviorMetrics.devices.iphone.pct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-bold text-gray-700 flex items-center gap-1">
                🤖 Android
              </span>
              <span className="font-black text-gray-900">
                {behaviorMetrics.devices.android.pct}% ({behaviorMetrics.devices.android.count})
              </span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${behaviorMetrics.devices.android.pct}%` }}
              />
            </div>

            {behaviorMetrics.devices.desktop.count > 0 && (
              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                <span>💻 Computador:</span>
                <span className="font-bold">
                  {behaviorMetrics.devices.desktop.pct}% ({behaviorMetrics.devices.desktop.count})
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400 py-3 italic">Esperando visitas de clientes...</p>
        )}
      </div>

      {/* KPI: Carritos Reales */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-gray-500">
          <span className="text-xs font-bold uppercase tracking-wider">Carritos Abiertos</span>
          <ShoppingBag className="w-4 h-4 text-rose-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-black text-gray-900 tracking-tight">
            {behaviorMetrics.funnel.cartsCount}
          </p>
          {behaviorMetrics.funnel.cartsCount > 0 ? (
            <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              {behaviorMetrics.funnel.abandonmentRate}% abandonados
            </span>
          ) : (
            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              0 abandonos
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400">
          {behaviorMetrics.funnel.abandonedCarts} comensales agregaron comida al carrito sin ordenar.
        </p>
      </div>

      {/* KPI: Sesiones Únicas Reales */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-gray-500">
          <span className="text-xs font-bold uppercase tracking-wider">Sesiones Únicas</span>
          <Users className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-black text-gray-900 tracking-tight">
            {behaviorMetrics.totalSessions}
          </p>
          <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
            Registradas
          </span>
        </div>
        <p className="text-[11px] text-gray-400">
          Personas distintas que han abierto la carta en el periodo seleccionado.
        </p>
      </div>
    </div>
  );
}
