import React from 'react';
import { COMPARISON_ROWS } from '../data/impactComparisonData';

export default function ImpactMatrixSection({
  activeView,
  mobileTableTab,
  setMobileTableTab
}) {
  return (
    <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pb-16 sm:pb-24">
      <div className="rounded-2xl sm:rounded-3xl bg-[#121216] border border-white/10 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/10">
          <h3
            className="text-lg sm:text-xl font-bold text-white"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Tabla Comparativa de Canales Gastronómicos
          </h3>
          <p className="text-xs text-gray-400 mt-1 font-light">
            Por qué entregar una solución "llave en mano" con fotos reales supera a cualquier alternativa del mercado.
          </p>
        </div>

        {/* Mobile Comparison Switcher */}
        <div className="p-3 sm:hidden border-b border-white/10 bg-white/[0.02]">
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-2 text-center tracking-wider">
            Comparar Aluna Fotos Reales contra:
          </p>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10">
            <button
              type="button"
              onClick={() => setMobileTableTab('pdf')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTableTab === 'pdf'
                  ? 'bg-white/20 text-white shadow-sm border border-white/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>📄 vs Carta PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTableTab('boku')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTableTab === 'boku'
                  ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>🤖 vs Menú IA</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full sm:min-w-[640px] text-left text-xs text-gray-300">
            <thead className="bg-white/5 uppercase text-[10px] tracking-wider text-gray-400">
              <tr>
                <th className="p-3 sm:p-4 w-[36%] sm:w-auto">Característica</th>
                <th
                  className={`p-3 sm:p-4 text-gray-400 w-[32%] sm:w-auto ${
                    mobileTableTab === 'pdf' ? 'table-cell' : 'hidden sm:table-cell'
                  }`}
                >
                  Carta Física / PDF
                </th>
                <th
                  className={`p-3 sm:p-4 transition-all w-[32%] sm:w-auto ${
                    mobileTableTab === 'boku' ? 'table-cell' : 'hidden sm:table-cell'
                  } ${
                    activeView === 'boku'
                      ? 'bg-amber-500/20 text-amber-300 font-black border-t-2 border-amber-500 shadow-inner'
                      : 'text-amber-300/80'
                  }`}
                >
                  Menú IA (BOKU)
                </th>
                <th
                  className={`p-3 sm:p-4 transition-all w-[32%] sm:w-auto ${
                    activeView === 'alto-andino'
                      ? 'bg-emerald-500/25 text-emerald-300 font-black border-t-2 border-emerald-400 shadow-inner'
                      : 'text-emerald-400 bg-emerald-500/10 font-black'
                  }`}
                >
                  Aluna + Fotos Reales
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx}>
                  <td className="p-3 sm:p-4 font-bold text-white">{row.feature}</td>
                  <td
                    className={`p-3 sm:p-4 text-red-400 ${
                      mobileTableTab === 'pdf' ? 'table-cell' : 'hidden sm:table-cell'
                    }`}
                  >
                    <span className="sm:hidden">{row.pdfMobile}</span>
                    <span className="hidden sm:inline">{row.pdfDesktop}</span>
                  </td>
                  <td
                    className={`p-3 sm:p-4 ${
                      mobileTableTab === 'boku' ? 'table-cell' : 'hidden sm:table-cell'
                    } ${
                      activeView === 'boku'
                        ? 'bg-amber-500/10 text-amber-200 font-bold'
                        : 'text-amber-300'
                    }`}
                  >
                    <span className="sm:hidden">{row.bokuMobile}</span>
                    <span className="hidden sm:inline">{row.bokuDesktop}</span>
                  </td>
                  <td
                    className={`p-3 sm:p-4 ${
                      activeView === 'alto-andino'
                        ? 'bg-emerald-500/15 text-emerald-300 font-black'
                        : 'bg-emerald-500/5 text-emerald-400 font-bold'
                    }`}
                  >
                    <span className="sm:hidden">{row.altoMobile}</span>
                    <span className="hidden sm:inline">{row.altoDesktop}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
