import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { createMatchMessage } from '../data/heroGuideData';

export default function HeroFoodGuideModal({
  guideOpen,
  setGuideOpen,
  greeting,
  user,
  primaryColor,
  accentColor,
  guideProgressTotal,
  guideProgressIndex,
  suggestedProduct,
  isGuideThinking,
  currentStep,
  chooseGuideOption,
  thinkingMessage,
  guideMessage,
  guideAnswers,
  handleQuickView,
  resetGuide,
  anotherSuggestion,
  generateSuggestion,
  candidates
}) {
  return (
    <AnimatePresence>
      {guideOpen && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/35 px-4 pb-28 backdrop-blur-sm md:items-stretch md:justify-start md:p-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setGuideOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Guía de antojo"
            initial={{ opacity: 0, y: 36, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 36, x: -28 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/80 bg-white p-4 shadow-[0_28px_80px_rgba(0,0,0,0.28)] md:h-full md:max-w-sm md:rounded-l-none md:rounded-r-[2rem] md:p-5"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div
                  className="mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Sparkles size={12} />
                  Guía de antojo
                </div>
                <h3 className="text-xl font-black leading-tight text-[#1A1A1A]">
                  {greeting}
                  {user?.isLogged ? `, ${user.name}` : ''}
                </h3>
                <p className="mt-1 text-sm font-medium leading-snug text-[#1A1A1A]/50">
                  Responde rápido y hacemos match con algo de la carta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-[#1A1A1A]/60"
                aria-label="Cerrar guía de antojo"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mb-4 flex gap-1.5">
              {Array.from({ length: guideProgressTotal }).map((_, index) => (
                <span
                  key={index}
                  className="h-1.5 flex-1 rounded-full"
                  style={{ backgroundColor: index < guideProgressIndex ? primaryColor : 'rgba(0,0,0,0.08)' }}
                />
              ))}
            </div>

            {!suggestedProduct && !isGuideThinking && (
              <div className="rounded-2xl border border-black/5 bg-[#FAFAFA] p-3">
                <p className="mb-3 text-sm font-black text-[#1A1A1A]">{currentStep.title}</p>
                <div className="grid grid-cols-1 gap-2">
                  {currentStep.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => chooseGuideOption(currentStep.id, option.value)}
                      className="flex h-11 items-center justify-between rounded-2xl border border-black/5 bg-white px-4 text-left text-sm font-black text-[#1A1A1A] shadow-sm"
                    >
                      {option.label}
                      <ArrowRight size={14} className="text-[#1A1A1A]/30" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isGuideThinking && (
              <div className="rounded-2xl border border-black/5 bg-[#FAFAFA] p-5">
                <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 text-center">
                  <Loader2 size={22} className="animate-spin" style={{ color: primaryColor }} />
                  <p className="text-sm font-black text-[#1A1A1A]">{thinkingMessage}</p>
                  <p className="text-xs font-semibold text-[#1A1A1A]/40">
                    Estoy cruzando tus respuestas con la carta disponible.
                  </p>
                </div>
              </div>
            )}

            {suggestedProduct && !isGuideThinking && (
              <div className="rounded-2xl border border-black/5 bg-[#FAFAFA] p-3">
                <p className="mb-3 text-sm font-semibold leading-snug" style={{ color: primaryColor }}>
                  {guideMessage || createMatchMessage(suggestedProduct, guideAnswers)}
                </p>
                <button type="button" onClick={handleQuickView} className="group flex w-full items-center gap-3 text-left">
                  <img
                    src={suggestedProduct.img}
                    alt={suggestedProduct.name}
                    className="h-16 w-16 rounded-2xl object-cover ring-1 ring-black/5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-black leading-tight text-[#1A1A1A]">
                      {suggestedProduct.name}
                    </span>
                    <span className="mt-1 block text-sm font-bold text-[#1A1A1A]/45">
                      {typeof suggestedProduct.price === 'number'
                        ? `$${suggestedProduct.price.toLocaleString()}`
                        : suggestedProduct.price}
                    </span>
                  </span>
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-transform group-hover:scale-105"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Plus size={17} strokeWidth={3} />
                  </span>
                </button>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={resetGuide}
                className="h-11 rounded-full border border-black/5 bg-white text-sm font-black text-[#1A1A1A]/60"
              >
                Reiniciar
              </button>
              <button
                type="button"
                onClick={suggestedProduct ? anotherSuggestion : () => generateSuggestion(guideAnswers)}
                disabled={isGuideThinking || !candidates.length}
                className="h-11 rounded-full text-sm font-black text-white disabled:opacity-70"
                style={{ backgroundColor: primaryColor }}
              >
                {suggestedProduct ? 'Otra sugerencia' : 'Sorpréndeme'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
