import React from 'react';
import { Icon } from '@iconify-icon/react';
import { FormField, TextInput } from '../ui';
import AIAvatar from '../../ui/AIAvatar';
import { AI_AVATAR_PRESETS, AI_PERSONALITY_PRESETS } from '../../../constants/aiPresets';
import { toast as toastFn } from '../../Toast';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export default function AIMeseroTab({
  data,
  setData,
  activeBrand
}) {
  return (
    <div className="space-y-6 animate-fadeUp">
      {/* AI BRAIN HUB */}
      <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-xl relative border border-white/10 group">
        {/* Dynamic Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] -ml-48 -mb-48" />
        
        <div className="relative z-10 p-6 sm:p-10 space-y-8">
          {/* Header AI */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full">
                <div className="relative">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping absolute inset-0" />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full relative" />
                </div>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Neural Engine Active</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Cerebro Digital <span className="text-emerald-400">Gemini</span>
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
                Configura la identidad, tono y comportamiento de tu Mesero Digital con IA. Este asistente atenderá a tus clientes en el menú público, recomendará platos y gestionará pedidos.
              </p>
            </div>
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl self-start md:self-auto">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md">
                <Icon icon="solar:sparkles-bold" className="text-white text-sm" />
              </div>
              <span className="text-[11px] font-bold text-slate-300">Mesero Digital Único</span>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* UNIFIED CONCIERGE BLOCK */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 hover:bg-white/[0.05] transition-colors duration-500 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-950/40">
                    <Icon icon="solar:chef-hat-heart-bold-duotone" className="text-white text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Mesero & Conserje Digital</h3>
                    <p className="text-emerald-400/90 text-xs font-semibold">Atención, recomendaciones de carta y cierre de ventas</p>
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Activo en Menú
                </span>
              </div>

              <div className="space-y-6">
                {/* 1. Nombre y Subtítulo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label={<span className="text-slate-300 font-semibold text-xs">Nombre de tu Asistente</span>}>
                    <TextInput 
                      value={data.concierge_h1 || ''} 
                      onChange={(e) => setData({ ...data, concierge_h1: e.target.value })} 
                      className="bg-white/5 border-white/10 text-white focus:ring-emerald-500/20 rounded-xl"
                      placeholder="Ej. Boki, Lumi, Chef Boku" 
                    />
                  </FormField>
                  <FormField label={<span className="text-slate-300 font-semibold text-xs">Rol / Subtítulo</span>}>
                    <TextInput 
                      value={data.concierge_subtitle || ''} 
                      onChange={(e) => setData({ ...data, concierge_subtitle: e.target.value })} 
                      className="bg-white/5 border-white/10 text-white focus:ring-emerald-500/20 rounded-xl"
                      placeholder="Ej. Tu mesero digital en Boku Bento" 
                    />
                  </FormField>
                </div>

                {/* 2. Selector de Avatar SVG Prediseñado */}
                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-3">
                    Avatar del Asistente (Elige un SVG predeterminado o ingresa tu imagen)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {AI_AVATAR_PRESETS.map((preset) => {
                      const isSelected = data.concierge_img === preset.id || (!data.concierge_img && preset.id === 'lumi_spark');
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setData({ ...data, concierge_img: preset.id })}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 relative ${
                            isSelected 
                              ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-500/30 shadow-lg' 
                              : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400'
                          }`}
                        >
                          <AIAvatar avatar={preset.id} className="w-10 h-10 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">{preset.name}</p>
                            <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-semibold block">{preset.tag}</span>
                          </div>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] absolute top-2 right-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Input opcional para URL de imagen propia */}
                  <div className="flex items-center gap-2">
                    <TextInput 
                      value={data.concierge_img?.startsWith('http') ? data.concierge_img : ''} 
                      onChange={(e) => setData({ ...data, concierge_img: e.target.value })} 
                      className="bg-white/5 border-white/10 text-white focus:ring-emerald-500/20 rounded-xl text-xs flex-1"
                      placeholder="O pega una URL de imagen propia (https://...)" 
                    />
                    <div className="flex items-center gap-2">
                       <input 
                         type="color" 
                         value={data.concierge_bg_color || '#1A2421'} 
                         onChange={(e) => setData({ ...data, concierge_bg_color: e.target.value })} 
                         className="w-9 h-9 rounded-xl overflow-hidden bg-transparent border-none cursor-pointer" 
                         title="Color de fondo de la sección" 
                       />
                    </div>
                  </div>
                </div>

                {/* 3. Selector de Personalidad */}
                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-3">
                    Personalidad y Tono (Carga un estilo con un clic)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {AI_PERSONALITY_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          const assistantName = data.concierge_h1?.trim() || 'Lumi';
                          const brandName = activeBrand?.name || 'nuestro restaurante';
                          const newPrompt = p.template(assistantName, brandName);
                          setData(prev => ({ ...prev, concierge_prompt_template: newPrompt }));
                          toast.success(`Personalidad "${p.name}" aplicada`);
                        }}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-white/10 text-left transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white group-hover:text-emerald-300">{p.name}</span>
                          <span className="text-[9px] uppercase tracking-wider text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full">{p.badge}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">{p.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Instrucciones del Sistema (Editable) */}
                <FormField label={<span className="text-slate-400 text-xs">Instrucciones del Sistema (System Prompt Maestro)</span>}>
                  <div className="relative group">
                     <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                     <textarea 
                       value={data.concierge_prompt_template || ''}
                       onChange={(e) => setData({ ...data, concierge_prompt_template: e.target.value })}
                       className="relative w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 text-xs font-mono text-emerald-400 h-36 focus:ring-2 focus:ring-emerald-500/40 outline-none scrollbar-thin resize-none leading-relaxed"
                       placeholder="Instrucciones para Gemini..."
                     />
                  </div>
                </FormField>

                {/* 5. Vista Previa en Vivo */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                  <AIAvatar avatar={data.concierge_img || 'lumi_spark'} className="w-12 h-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{data.concierge_h1 || 'Lumi'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{data.concierge_subtitle || 'Tu asistente gastronómico'}</p>
                    <span className="inline-block mt-1 text-[9px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Vista Previa en Menú & Chat
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
