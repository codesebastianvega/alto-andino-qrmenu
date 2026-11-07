import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Check } from 'lucide-react';
import { WHATSAPP_CONFIG } from '../../../config/whatsapp';

export default function ImpactPlansSection() {
  return (
    <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pb-14 sm:pb-20">
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4A853]/10 border border-[#D4A853]/30 text-[#D4A853] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Alianza Estratégica: Uxio Creativo × Aluna POS</span>
        </div>
        <h2
          className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Elige cómo transformar tu restaurante
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 mt-2.5 font-light leading-relaxed max-w-2xl mx-auto">
          <strong>Uxio Creativo</strong> produce los videos Reels y fotos gastronómicas que despiertan antojo en redes. <strong>Aluna</strong> pone la plataforma tecnológica para cerrar los pedidos en la mesa y a domicilio con cero comisiones.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 max-w-7xl mx-auto items-stretch">
        {/* Plan 1: Despegue Llave en Mano */}
        <div className="rounded-2xl sm:rounded-3xl bg-[#121216] border border-white/15 p-5 sm:p-7 relative flex flex-col justify-between hover:border-white/30 transition-all duration-300 group">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Entrada Ágil
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold uppercase">
                El Más Accesible
              </span>
            </div>

            <h3
              className="text-xl sm:text-2xl font-bold text-white"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Despegue Llave en Mano
            </h3>

            <p className="text-xs text-gray-400 mt-2 leading-relaxed font-light">
              Todo lo necesario para salir del papel o PDF y tener tu menú con fotos reales operando esta misma semana sin fricción.
            </p>

            <div className="my-4 sm:my-5 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white">$150.000</span>
                <span className="text-xs text-gray-400 font-medium">COP (Setup & Fotos único)</span>
              </div>
              <p className="text-[11px] text-[#D4A853] font-medium">+ $29.900 COP/mes (desde el mes 2)</p>
              <div className="pt-1">
                <span className="inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  🎁 Mes 1 de Aluna Emprendedor Gratis
                </span>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-gray-300 font-light">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Sesión Fotográfica Flash:</strong> Hasta 10 platos y bebidas estrella con iluminación y retoque profesional.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Montaje Completo del Menú:</strong> Nosotros subimos platos, ingredientes, precios y alérgenos en Aluna.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Optimización de Ficha de Google Maps:</strong> Portada gastronómica, enlace directo al menú y horario.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Diseño de Códigos QR:</strong> Plantillas elegantes listas para imprimir en mesas y barra.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Aluna Emprendedor Incluida:</strong> Pedidos en mesa, WhatsApp directo y panel móvil (hasta 60 pedidos/mes; escala a Esencial $59.900 para meseros y mayor volumen).
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-6 sm:pt-7">
            <a
              href={WHATSAPP_CONFIG.getLink(WHATSAPP_CONFIG.templates.growthPlan1())}
              target="_blank"
              rel="noreferrer"
              className="w-full block text-center bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-full text-xs uppercase tracking-wider transition border border-white/20"
            >
              Elegir Plan Despegue ($150k)
            </a>
          </div>
        </div>

        {/* Plan 2: Crecimiento & Contenido */}
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#1C1810] via-[#121216] to-[#121216] border-2 border-[#D4A853] p-5 sm:p-7 relative flex flex-col justify-between shadow-[0_0_50px_rgba(212,168,83,0.18)] group">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4A853]">
                Alianza Growth
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#D4A853] text-black text-[9px] font-black uppercase">
                Más Vendido
              </span>
            </div>

            <h3
              className="text-xl sm:text-2xl font-bold text-white"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Crecimiento & Contenido
            </h3>

            <p className="text-xs text-gray-400 mt-2 leading-relaxed font-light">
              Para restaurantes que quieren que un creador de contenido les traiga clientes desde redes y cierre la venta en la mesa.
            </p>

            <div className="my-4 sm:my-5 p-3.5 rounded-xl bg-[#D4A853]/10 border border-[#D4A853]/30 space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-[#D4A853]">$790.000</span>
                <span className="text-xs text-gray-300 font-medium">COP / mes</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium">Todo incluido • Cero cobro de montaje</p>
              <div className="pt-1">
                <span className="inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-[#D4A853]/20 text-[#D4A853] border border-[#D4A853]/30">
                  ✨ Contenido Uxio + Aluna Profesional Incluida
                </span>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-gray-300 font-light">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#D4A853] shrink-0 mt-0.5" />
                <span>
                  <strong>Todo lo del Plan Despegue</strong> (Fotos iniciales, Google Maps, Menú montado y QRs).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#D4A853] shrink-0 mt-0.5" />
                <span>
                  <strong>2 Videos Reels / TikTok al mes:</strong> Producción en video en tu local con foco en textura, preparación y antojo.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#D4A853] shrink-0 mt-0.5" />
                <span>
                  <strong>Fotografía de Novedades mensual:</strong> Sesión para platos nuevos, adiciones o combos especiales.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#D4A853] shrink-0 mt-0.5" />
                <span>
                  <strong>Actualizaciones Continuas de Carta:</strong> Añade platos de temporada o cambia precios sin preocuparte.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#D4A853] shrink-0 mt-0.5" />
                <span>
                  <strong>Aluna Profesional Incluida (Ahorras $149.900/mes):</strong> Pantallas KDS cocina y BDS barra, meseros, domicilios propios y hasta 800 pedidos/mes.
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-6 sm:pt-7">
            <a
              href={WHATSAPP_CONFIG.getLink(WHATSAPP_CONFIG.templates.growthPlan2())}
              target="_blank"
              rel="noreferrer"
              className="w-full block text-center bg-[#D4A853] hover:brightness-110 text-black font-bold py-3 rounded-full text-xs uppercase tracking-wider transition shadow-lg shadow-[#D4A853]/20"
            >
              Elegir Crecimiento & Contenido
            </a>
          </div>
        </div>

        {/* Plan 3: Dominio Gastronómico VIP */}
        <div className="rounded-2xl sm:rounded-3xl bg-[#121216] border border-white/20 p-5 sm:p-7 relative flex flex-col justify-between hover:border-[#D4A853]/40 transition-all duration-300 group">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                Partner VIP Growth
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold uppercase">
                Cupos Limitados
              </span>
            </div>

            <h3
              className="text-xl sm:text-2xl font-bold text-white"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Dominio Gastronómico VIP
            </h3>

            <p className="text-xs text-gray-400 mt-2 leading-relaxed font-light">
              Para marcas consolidadas o gastrobares que quieren liderar su zona con presencia audiovisual continua de alto impacto.
            </p>

            <div className="my-4 sm:my-5 p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white">$1.490.000</span>
                <span className="text-xs text-gray-300 font-medium">COP / mes</span>
              </div>
              <p className="text-[11px] text-purple-300 font-medium">Servicio integral llave en mano</p>
              <div className="pt-1">
                <span className="inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/40">
                  👑 1 Video Semanal + Aluna Premium Incluida
                </span>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-gray-300 font-light">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong>4 Videos Reels / TikTok al mes:</strong> 1 video profesional cada semana estructurado para viralidad local (1 sola jornada de rodaje mensual).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Fotografía Gastronómica Continua:</strong> Cobertura de toda tu carta, coctelería y platos de temporada.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Estrategia Activa Google Maps #1:</strong> Campaña para liderar búsquedas locales con reseñas 5★.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Aluna Premium Multisede (Ahorras $249.900/mes):</strong> Hasta 2.000 pedidos/mes, CRM de clientes, meseros y analítica avanzada.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Soporte VIP Directo por WhatsApp:</strong> Atención prioritaria para cambios urgentes de carta en minutos.
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-6 sm:pt-7">
            <a
              href={WHATSAPP_CONFIG.getLink(WHATSAPP_CONFIG.templates.growthPlan3())}
              target="_blank"
              rel="noreferrer"
              className="w-full block text-center bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-full text-xs uppercase tracking-wider transition border border-white/20"
            >
              Elegir Dominio VIP
            </a>
          </div>
        </div>
      </div>

      {/* Banner para clientes que solo buscan software */}
      <div className="mt-8 sm:mt-12 p-4 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              ¿Solo buscas el Software?
            </span>
            <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-white/10 text-gray-300 font-mono">
              Modo Autoservicio
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 font-light">
            Si ya tienes tus propias fotografías profesionales y creador de contenido, contrata directamente la plataforma <strong>Aluna SaaS desde $29.900 COP / mes</strong> (Emprendedor $29.900, Esencial $59.900, Profesional $149.900, Premium $249.900).
          </p>
        </div>
        <Link
          to="/#planes"
          className="shrink-0 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-full text-xs uppercase tracking-wider transition border border-white/15"
        >
          Ver Planes Solo Software
        </Link>
      </div>
    </section>
  );
}
