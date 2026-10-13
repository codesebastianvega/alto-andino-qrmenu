import React, { useState } from 'react';
import { Icon } from '@iconify-icon/react';

export function KitchenStationLayout({ onSelectIngredient = null }) {
  const [activeZone, setActiveZone] = useState('all'); // 'all' | 'fridge1' | 'fridge2' | 'assembly' | 'hot'

  const zones = [
    {
      id: 'assembly',
      title: 'Mesa de Ensamble & Báscula',
      subtitle: 'Zona Central - Garaje (Montaje & Despacho)',
      icon: 'heroicons:squares-plus',
      accentColor: 'indigo',
      badge: 'Estación Crítica',
      temp: 'Ambiente (20-22°C)',
      description: 'Donde se realiza el pesaje exacto en gramera, colocación de arroz tibio, toppings frescos y sellado para despacho.',
      items: [
        {
          name: 'Gramera Digital de Precisión',
          location: 'Centro de la Mesa',
          purpose: 'Pesaje gramo a gramo. Regla: siempre tarar en 0g con el bowl puesto.',
          critical: true,
          icon: 'heroicons:scale'
        },
        {
          name: 'Olla Arrocera / Termo Shari',
          location: 'Extremo Izquierdo',
          purpose: 'Arroz Sushi preparado tibio. Mantener tapado con paño limpio húmedo.',
          critical: true,
          icon: 'heroicons:fire'
        },
        {
          name: 'Bowls Kraft 32oz con Tapa',
          location: 'Fila Trasera de Ensamble',
          purpose: 'Empaque primario. Asegurar el "click" hermético de la tapa.',
          critical: false,
          icon: 'heroicons:archive-box'
        },
        {
          name: 'Dispensador de Semillas & Crunch',
          location: 'Frente Derecho',
          purpose: 'Ajonjolí blanco tostado, ajonjolí negro y maní en frascos dosificadores.',
          critical: false,
          icon: 'heroicons:sparkles'
        },
        {
          name: 'Zona de Despacho & Bolsas',
          location: 'Extremo Derecho',
          purpose: 'Bolsas Kraft con fuelle, kits de cubiertos biodegradables y stickers QR Aluna.',
          critical: false,
          icon: 'heroicons:check-badge'
        }
      ]
    },
    {
      id: 'fridge1',
      title: 'Nevera 1: Proteínas & Congelador',
      subtitle: 'Zona Fría de Carnes & Porcionado',
      icon: 'heroicons:cube-transparent',
      accentColor: 'rose',
      badge: 'Cadena de Frío',
      temp: '2°C a 4°C / -18°C Congelador',
      description: 'Exclusiva para proteínas crudas y porcionadas. Evita al 100% la contaminación cruzada con vegetales listos para comer.',
      items: [
        {
          name: 'Pollo Marinado en Cubos (Mise en Place)',
          location: 'Bandeja Media - Inserto GN 1/3 con Tapa',
          purpose: 'Porción estándar: 150g. Rotulado con fecha y hora de preparación. Vida útil máx: 3 días refrigerado.',
          critical: true,
          icon: 'heroicons:tag'
        },
        {
          name: 'Bolsas Ziploc Porcionadas (150g)',
          location: 'Congelador Superior (-18°C)',
          purpose: 'Stock de seguridad de cubos de pollo marinados. Bajar a refrigeración 12h antes del turno.',
          critical: false,
          icon: 'heroicons:inbox-stack'
        },
        {
          name: 'Maíz Tierno Dulce Congelado',
          location: 'Congelador Superior (-18°C)',
          purpose: 'Bolsa resellable. Sacar la porción del día al comenzar el turno (30g por bowl).',
          critical: false,
          icon: 'heroicons:sparkles'
        },
        {
          name: 'Pechuga Fresca Entera de Reserva',
          location: 'Cajón Inferior Frío Máximo',
          purpose: 'Materia prima para corte diario en tabla roja (carnes crudas).',
          critical: true,
          icon: 'heroicons:shield-exclamation'
        }
      ]
    },
    {
      id: 'fridge2',
      title: 'Nevera 2: Vegetales & Biberones de Salsa',
      subtitle: 'Zona Fría de Frescos Listos para Consumo',
      icon: 'heroicons:beaker',
      accentColor: 'emerald',
      badge: 'Listos para Consumo',
      temp: '4°C a 6°C',
      description: 'Insumos que van directo al bowl sin cocción posterior, más salsas caseras dosificadas.',
      items: [
        {
          name: 'Biberón #1: Salsa Miel-Sriracha Casera',
          location: 'Puerta Nevera / Estante Medio',
          purpose: 'Dosificador con pico limpio. Porción: 35g por bowl. Agitar siempre antes de usar.',
          critical: true,
          icon: 'heroicons:beaker'
        },
        {
          name: 'Biberón #2: Salsa de Soya & Vinagre de Arroz',
          location: 'Puerta Nevera',
          purpose: 'Insumos líquidos para producción y ajustes de aderezo.',
          critical: false,
          icon: 'heroicons:beaker'
        },
        {
          name: 'Táper Hermético: Cebollín Picado Fino',
          location: 'Bandeja Superior con Papel Secante',
          purpose: 'Topping final fresco (5g por bowl). El papel secante absorbe humedad y alarga frescura 4 días.',
          critical: true,
          icon: 'heroicons:leaf'
        },
        {
          name: 'Inserto: Zanahoria en Julianas Finas',
          location: 'Bandeja Media - Recipiente Sellado',
          purpose: 'Vegetal crocante listo (35g por bowl). Mantener escurrido sin agua estancada.',
          critical: false,
          icon: 'heroicons:sparkles'
        },
        {
          name: 'Cajón de Frescos: Pepino Cohombro',
          location: 'Cajón Inferior de Vegetales',
          purpose: 'Pepino lavado y sanitizado listo para corte en rodajas/cubos (40g por bowl).',
          critical: false,
          icon: 'heroicons:sparkles'
        }
      ]
    },
    {
      id: 'hot',
      title: 'Zona Caliente: Wok & Salteado Rápido',
      subtitle: 'Cocción y Glaseado de Proteínas',
      icon: 'heroicons:fire',
      accentColor: 'amber',
      badge: 'Fuego Alto (3-4 min)',
      temp: 'Alta Potencia (Wok > 180°C)',
      description: 'Donde la proteína marinada pasa por salteado rápido de 3 minutos y se glasea con la salsa en los últimos 30 segundos.',
      items: [
        {
          name: 'Wok o Sartén Antiadherente Grueso',
          location: 'Quemador Principal',
          purpose: 'Precalentar antes de poner la porción. No sobrecargar para lograr dorado parejo.',
          critical: true,
          icon: 'heroicons:fire'
        },
        {
          name: 'Aceite Vegetal Dosificador',
          location: 'Costado del Quemador',
          purpose: '10ml exactos por tanda de pollo. Solo lo justo para lubricar y dorar.',
          critical: false,
          icon: 'heroicons:beaker'
        },
        {
          name: 'Pinzas de Cocina & Espátula',
          location: 'Porta-utensilios Caliente',
          purpose: 'Uso exclusivo para voltear pollo en sartén y transferir al bowl de ensamble.',
          critical: false,
          icon: 'heroicons:wrench-screwdriver'
        }
      ]
    }
  ];

  const filteredZones = activeZone === 'all' 
    ? zones 
    : zones.filter(z => z.id === activeZone);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Banner Informativo Operativo */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1.5">
                <Icon icon="heroicons:map-pin" className="text-xs" />
                Mapeo de Cocina Boku Bento
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md text-xs font-semibold">
                Cero Desperdicio & Cero Cruce
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-1.5">
              Layout Visual de Estaciones, Neveras y Mesón
            </h3>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal">
              Guía física para personal de cocina: cada insumo tiene una ubicación fija e inmutable. 
              Garantiza que el ensamble del bowl tarde menos de <strong className="text-white font-semibold">2 minutos</strong> y se cumpla el protocolo de inocuidad alimentaria.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 shrink-0">
            <button
              onClick={() => setActiveZone('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeZone === 'all' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              Todas ({zones.length})
            </button>
            {zones.map(z => (
              <button
                key={z.id}
                onClick={() => setActiveZone(z.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeZone === z.id 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                <Icon icon={z.icon} className="text-sm" />
                <span>{z.title.split(':')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Regla de Oro / Buenas Prácticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex items-start gap-3.5">
          <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <Icon icon="heroicons:scale" className="text-base" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">Gramera Obligatoria</h4>
            <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
              Nunca calcular a ojo. El bowl se coloca en la báscula y se tara a 0g antes de cada ingrediente.
            </p>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-4 flex items-start gap-3.5">
          <div className="w-8 h-8 bg-rose-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <Icon icon="heroicons:shield-exclamation" className="text-base" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">Separación Total</h4>
            <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
              Nevera 1 (carnes crudas) y Nevera 2 (frescos listos) jamás intercambian recipientes ni pinzas.
            </p>
          </div>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 flex items-start gap-3.5">
          <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <Icon icon="heroicons:arrow-path" className="text-base" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">Sistema FIFO / PEPS</h4>
            <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
              Lo primero que entra es lo primero que sale. Todo inserto y biberón debe tener fecha de lote visible.
            </p>
          </div>
        </div>
      </div>

      {/* ── Zonas Mapeadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredZones.map(zone => (
          <div 
            key={zone.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col hover:border-slate-300 transition-all"
          >
            {/* Header de la Zona */}
            <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm ${
                  zone.accentColor === 'indigo' ? 'bg-indigo-600' :
                  zone.accentColor === 'rose' ? 'bg-rose-600' :
                  zone.accentColor === 'emerald' ? 'bg-emerald-600' :
                  'bg-amber-600'
                }`}>
                  <Icon icon={zone.icon} className="text-xl" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 tracking-tight">{zone.title}</h4>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">{zone.subtitle}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-xs font-semibold font-mono mb-1">
                  {zone.temp}
                </span>
                <p className="text-xs font-semibold text-indigo-600">{zone.badge}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
              {zone.description}
            </p>

            {/* Lista de Insumos y Equipos en la Zona */}
            <div className="space-y-2 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                Contenido & Disposición ({zone.items.length})
              </p>
              {zone.items.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-lg border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm transition-all flex items-start gap-3 group"
                >
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                    item.critical ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon icon={item.icon} className="text-base" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {item.name}
                      </p>
                      {item.critical && (
                        <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          Crítico
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs font-medium text-indigo-600">
                      <Icon icon="heroicons:map-pin" className="text-xs" />
                      <span>{item.location}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-normal font-normal">
                      {item.purpose}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default KitchenStationLayout;
