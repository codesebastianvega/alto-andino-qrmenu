import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCOP } from '../../utils/money';
import { Database, Save, X, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';

const PRODUCT_EMOJIS = ['🍔', '🍕', '🌮', '🥗', '🍩', '🍹', '☕', '🍰', '🍜', '🍣'];

export default function BulkCostEditor({ products, onSave, onCancel }) {
  const [localProducts, setLocalProducts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Clone products to local state and ensure they have a cost
    setLocalProducts(products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price || 0,
      cost: p.cost || 0,
      image_url: p.image_url
    })));
  }, [products]);

  const handleCostChange = (id, value) => {
    const numValue = parseFloat(value) || 0;
    setLocalProducts(prev => prev.map(p => 
      p.id === id ? { ...p, cost: numValue } : p
    ));
  };

  const handleBatchSave = async () => {
    setIsSaving(true);
    try {
      const updates = localProducts.map(p => ({
        id: p.id,
        cost: p.cost,
        margin: p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0
      }));
      await onSave(updates);
    } catch (error) {
      console.error('Error saving bulk costs:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getMarginVariant = (price, cost) => {
    if (price <= 0) return 'text-gray-400';
    const margin = ((price - cost) / price) * 100;
    if (margin < 20) return 'text-rose-500';
    if (margin < 40) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="bg-white/95 backdrop-blur-2xl w-full max-w-5xl max-h-[90vh] rounded-[3rem] border border-white/40 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden"
      >
        {/* Header - Emerald/Gold Theme */}
        <div className="px-10 py-8 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-emerald-50/50 via-transparent to-amber-50/30">
          <div className="flex gap-5 items-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-[0_10px_25px_-5px_rgba(16,185,129,0.3)]">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Editor de <span className="text-emerald-600">Costos Masivo</span>
              </h2>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-0.5">Mantenimiento de Margen e Integridad</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={onCancel}
              className="px-6 py-3 text-sm font-black text-gray-400 hover:text-gray-900 transition-all uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button 
              onClick={handleBatchSave}
              disabled={isSaving}
              className="px-8 py-3 bg-gray-900 text-white rounded-2xl text-sm font-black shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] hover:bg-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3 border border-gray-800"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Sincronizando...</span>
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span className="uppercase tracking-widest">Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50/50 px-10 py-3 border-b border-amber-100 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <p className="text-[11px] font-black text-amber-700 uppercase tracking-tight">
            Los cambios afectarán el cálculo de rentabilidad en tiempo real y la Matriz BCG.
          </p>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto px-8 py-6 custom-scrollbar">
          <table className="w-full border-separate border-spacing-y-3">
            <thead className="sticky top-0 bg-white/50 backdrop-blur-sm z-10">
              <tr>
                <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-4">Producto</th>
                <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-4">Precio Venta</th>
                <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-4">Costo Unitario</th>
                <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-4">Margen %</th>
              </tr>
            </thead>
            <tbody className="pb-10">
              {localProducts.map((p, idx) => (
                <tr key={p.id} className="group transition-all">
                  <td className="px-6 py-4 bg-white border border-gray-100 rounded-l-[1.5rem] group-hover:border-emerald-200 group-hover:bg-emerald-50/10 shadow-sm transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <span className="text-lg">{PRODUCT_EMOJIS[idx % PRODUCT_EMOJIS.length]}</span>
                        )}
                      </div>
                      <span className="text-sm font-black text-gray-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 bg-white border-y border-gray-100 group-hover:border-emerald-200 group-hover:bg-emerald-50/10 shadow-sm transition-all">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-gray-300" />
                      <span className="text-sm font-black text-gray-500 tabular-nums">{p.price.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 bg-white border-y border-gray-100 group-hover:border-emerald-200 group-hover:bg-emerald-50/10 shadow-sm transition-all">
                    <div className="relative max-w-[160px]">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-400">$</span>
                      <input 
                        type="number"
                        value={p.cost}
                        onChange={(e) => handleCostChange(p.id, e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-gray-50/50 border border-transparent rounded-2xl text-sm font-black tabular-nums focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500 transition-all outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 bg-white border border-l-0 border-gray-100 rounded-r-[1.5rem] group-hover:border-emerald-200 group-hover:bg-emerald-50/10 shadow-sm transition-all">
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`w-3.5 h-3.5 ${getMarginVariant(p.price, p.cost)}`} />
                      <span className={`text-sm font-black tabular-nums ${getMarginVariant(p.price, p.cost)}`}>
                        {p.price > 0 
                          ? (((p.price - p.cost) / p.price) * 100).toFixed(1) 
                          : '0'}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
