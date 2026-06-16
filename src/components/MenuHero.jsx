import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Loader2, MapPin, Plus, Search, Sparkles, X } from 'lucide-react';
import { Icon } from '@iconify-icon/react';
import { AnimatePresence, motion } from 'framer-motion';
import { getStockState } from '../utils/stock';
import { useMenuData } from '../context/MenuDataContext';
import { useAuth } from '../context/AuthContext';
import { categoryIcons } from '../data/categoryIcons';

const HERO_CATEGORY_ICONS = {
  todos: 'ph:squares-four',
  desayunos: 'ph:sun-horizon',
  panes: 'ph:bread',
  bowls: 'ph:bowl-food',
  platos: 'ph:fork-knife',
  sandwiches: 'ph:sandwich',
  smoothies: 'ph:drop',
  cafe: 'ph:coffee',
  veggie: 'ph:leaf',
  postres: 'ph:cake',
  bebidasfrias: 'ph:snowflake'
};

const FALLBACK_CATEGORY_ICON = 'ph:fork-knife';
const FAB_STORAGE_KEY = 'aluna_menu_guide_fab_position';

const GUIDE_STEPS = {
  start: {
    id: 'kind',
    title: '¿Qué se te antoja?',
    options: [
      { value: 'comida', label: 'Comida' },
      { value: 'bebida', label: 'Bebida' },
      { value: 'ambas', label: 'Ambas' },
      { value: 'sorpresa', label: 'Sorpréndeme' }
    ]
  },
  comida: {
    id: 'foodMood',
    title: '¿Qué tipo de comida quieres?',
    options: [
      { value: 'fresca', label: 'Fresca / ligera', keywords: ['fresco', 'ensalada', 'poke', 'bowl', 'veggie', 'verde', 'ligero'] },
      { value: 'caliente', label: 'Caliente / reconfortante', keywords: ['caliente', 'horno', 'pan', 'plato', 'sopa'] },
      { value: 'salada', label: 'Salada / intensa', keywords: ['salado', 'queso', 'pollo', 'res', 'cerdo', 'sandwich', 'plato'] },
      { value: 'dulce', label: 'Algo dulce', keywords: ['postre', 'torta', 'cake', 'brownie', 'cookie', 'dulce', 'chocolate'] }
    ]
  },
  bebida: {
    id: 'drinkMood',
    title: '¿Cómo quieres la bebida?',
    options: [
      { value: 'caliente', label: 'Caliente', keywords: ['cafe', 'latte', 'te', 'caliente', 'infusion'] },
      { value: 'fria', label: 'Fría / refrescante', keywords: ['fria', 'ice', 'jugo', 'limonada', 'smoothie', 'bebida'] },
      { value: 'cremosa', label: 'Cremosa / especial', keywords: ['smoothie', 'latte', 'cremoso', 'especial'] },
      { value: 'cualquiera', label: 'Cualquiera', keywords: ['bebida', 'cafe', 'jugo', 'smoothie', 'limonada', 'latte'] }
    ]
  },
  ambas: {
    id: 'mixedMood',
    title: '¿Qué manda más ahora?',
    options: [
      { value: 'comer', label: 'Quiero comer', keywords: ['bowl', 'poke', 'plato', 'sandwich', 'pan', 'desayuno'] },
      { value: 'tomar', label: 'Tengo sed', keywords: ['bebida', 'cafe', 'jugo', 'smoothie', 'limonada', 'latte'] },
      { value: 'dulce', label: 'Algo dulce', keywords: ['postre', 'torta', 'cake', 'brownie', 'cookie', 'dulce'] },
      { value: 'sorpresa', label: 'Sorpréndeme', keywords: [] }
    ]
  }
};

const THINKING_MESSAGES = [
  'Revisando lo disponible ahora...',
  'Cruzando tu antojo con la carta...',
  'Entrando a la despensa...',
  'Buscando una buena coincidencia...',
  'Afinando la recomendación...'
];

function getTimeContext() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { label: 'Buenos días' };
  if (hour >= 12 && hour < 18) return { label: 'Buenas tardes' };
  return { label: 'Buenas noches' };
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getOptionKeywords(stepId, value) {
  const steps = Object.values(GUIDE_STEPS);
  const option = steps
    .flatMap((step) => (step.id === stepId ? step.options : []))
    .find((item) => item.value === value);
  return option?.keywords || [];
}

function scoreProduct(product, answers) {
  const text = normalizeText(`${product.name} ${product.desc} ${product.categoryName} ${product.categorySlug}`);
  let score = 0;

  Object.entries(answers).forEach(([stepId, optionValue]) => {
    getOptionKeywords(stepId, optionValue).forEach((keyword) => {
      if (text.includes(normalizeText(keyword))) score += 4;
    });
  });

  if (answers.kind === 'comida' && /bowl|poke|plato|sandwich|pan|desayuno|ensalada/.test(text)) score += 5;
  if (answers.kind === 'bebida' && /bebida|cafe|smoothie|jugo|limonada|fria|latte|te/.test(text)) score += 6;
  if (answers.kind === 'ambas') score += 1;
  if (answers.kind === 'sorpresa') score += product.name.length % 6;

  if (answers.foodMood === 'dulce' || answers.mixedMood === 'dulce') {
    if (/postre|torta|cake|brownie|cookie|dulce|chocolate/.test(text)) score += 8;
    if (/sandwich|bowl|poke|plato|cerdo|pollo|res|salado/.test(text)) score -= 5;
  }

  if (answers.drinkMood === 'caliente') {
    if (/cafe|latte|te|caliente|infusion/.test(text)) score += 8;
    if (/fria|ice|jugo|limonada|smoothie/.test(text)) score -= 6;
  }

  if (answers.drinkMood === 'fria') {
    if (/fria|ice|jugo|limonada|smoothie|bebida/.test(text)) score += 8;
    if (/caliente|horno|sopa/.test(text)) score -= 6;
  }

  if (answers.drinkMood === 'cremosa') {
    if (/smoothie|latte|cremoso|especial/.test(text)) score += 7;
  }

  if (answers.foodMood === 'fresca') {
    if (/fresco|ensalada|poke|bowl|veggie|verde|ligero/.test(text)) score += 6;
    if (/calent|horno|sopa/.test(text)) score -= 6;
  }

  if (answers.foodMood === 'caliente') {
    if (/caliente|horno|pan|plato|sopa/.test(text)) score += 6;
    if (/fria|ice|smoothie|jugo|limonada/.test(text)) score -= 5;
  }

  if (answers.foodMood === 'salada') {
    if (/salado|queso|pollo|res|cerdo|sandwich|plato|poke|bowl/.test(text)) score += 6;
    if (/postre|torta|cake|brownie|cookie|dulce|chocolate/.test(text)) score -= 6;
  }

  if (answers.kind === 'comida' && /bebida|cafe|smoothie|jugo|limonada|latte/.test(text)) score -= 6;
  if (answers.kind === 'bebida' && /sandwich|bowl|poke|plato|pan|cerdo|pollo|res/.test(text)) score -= 6;

  if (answers.mixedMood === 'comer' && /bowl|poke|plato|sandwich|pan|desayuno/.test(text)) score += 6;
  if (answers.mixedMood === 'tomar' && /bebida|cafe|jugo|smoothie|limonada|latte/.test(text)) score += 6;

  return score;
}

function createMatchMessage(product, answers) {
  if (answers.kind === 'bebida' && answers.drinkMood === 'caliente') {
    return `Encontré ${product.name}: algo caliente para acompañar este momento.`;
  }
  if (answers.kind === 'bebida' && answers.drinkMood === 'fria') {
    return `Encontré ${product.name}: algo fresco para quitar la sed.`;
  }
  if (answers.kind === 'bebida') {
    return `Encontré ${product.name}: una bebida que encaja con tu antojo.`;
  }
  if (answers.foodMood === 'dulce' || answers.mixedMood === 'dulce') {
    return `Encontré ${product.name}: algo dulce para cerrar bien el antojo.`;
  }
  if (answers.foodMood === 'fresca') {
    return `Encontré ${product.name}: algo fresco y completo sin sentirse pesado.`;
  }
  if (answers.foodMood === 'caliente') {
    return `Encontré ${product.name}: algo caliente y reconfortante.`;
  }
  if (answers.foodMood === 'salada') {
    return `Encontré ${product.name}: una opción salada con buen carácter.`;
  }
  if (answers.mixedMood === 'tomar') {
    return `Encontré ${product.name}: algo para tomar y salir de la duda.`;
  }
  if (answers.kind === 'sorpresa' || answers.mixedMood === 'sorpresa') {
    return `Me fui por ${product.name}: una opción especial de la carta.`;
  }
  return `Encontré ${product.name}: buena opción para este momento.`;
}

function getInitialFabPosition() {
  if (typeof window === 'undefined') return { x: 280, y: 600 };
  try {
    const saved = JSON.parse(window.localStorage.getItem(FAB_STORAGE_KEY) || 'null');
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) return clampFabPosition(saved);
  } catch {
    // Ignore invalid local storage data.
  }
  return clampFabPosition({
    x: window.innerWidth - 104,
    y: window.innerHeight - 230
  });
}

function clampFabPosition(position) {
  if (typeof window === 'undefined') return position;
  const maxX = Math.max(8, window.innerWidth - 92);
  const bottomReserved = window.innerWidth < 768 ? 188 : 130;
  const maxY = Math.max(96, window.innerHeight - bottomReserved);
  return {
    x: Math.min(Math.max(8, position.x), maxX),
    y: Math.min(Math.max(84, position.y), maxY)
  };
}

export default function MenuHero({ query, setQuery, activeCategory, setActiveCategory, categories = [] }) {
  const { label: greeting } = getTimeContext();
  const [user] = useState({ name: 'Invitado', isLogged: false });
  const { homeSettings, restaurantSettings, categories: activeCategories, productsByCategory, currentLocation, locations } = useMenuData();
  const { activeBrand } = useAuth();

  const brandName = restaurantSettings?.business_name || activeBrand?.name || 'Aluna';
  const logoUrl = restaurantSettings?.logo_url || activeBrand?.logo_url;
  const primaryColor = restaurantSettings?.primary_color || '#4A7856';
  const accentColor = restaurantSettings?.theme_secondary || '#E6B05C';
  const heroBg = restaurantSettings?.theme_background || '#F5F5F7';
  const displayLocation = currentLocation || locations?.find((loc) => loc.is_main) || locations?.[0];
  const locationLabel = displayLocation?.name || brandName;
  const locationHint = displayLocation?.city || displayLocation?.address || 'Listo para ordenar';

  const candidates = useMemo(() => {
    return activeCategories.flatMap((cat) => {
      const items = productsByCategory[cat.slug] || [];
      return items
        .filter((p) => {
          const st = getStockState(p.id);
          return st === 'in' || st === 'low';
        })
        .map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          img: p.image_url,
          desc: p.description || '',
          categorySlug: cat.slug,
          categoryName: cat.name || cat.label || cat.slug
        }));
    });
  }, [activeCategories, productsByCategory]);

  const [recIndex, setRecIndex] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideAnswers, setGuideAnswers] = useState({});
  const [guideStepKey, setGuideStepKey] = useState('start');
  const [suggestedProduct, setSuggestedProduct] = useState(null);
  const [guideMessage, setGuideMessage] = useState('');
  const [isGuideThinking, setIsGuideThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState(THINKING_MESSAGES[0]);
  const [suggestionCycle, setSuggestionCycle] = useState(0);
  const [fabPosition, setFabPosition] = useState(getInitialFabPosition);
  const dragRef = useRef(null);
  const suppressFabClickRef = useRef(false);
  const thinkingTimeoutRef = useRef(null);
  const thinkingIntervalRef = useRef(null);

  useEffect(() => {
    if (recIndex >= candidates.length) setRecIndex(0);
  }, [candidates.length, recIndex]);

  useEffect(() => {
    return () => {
      if (thinkingTimeoutRef.current) window.clearTimeout(thinkingTimeoutRef.current);
      if (thinkingIntervalRef.current) window.clearInterval(thinkingIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setFabPosition((current) => clampFabPosition(current));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const instantProduct = candidates.length ? candidates[recIndex] : null;
  const currentSuggestion = suggestedProduct || instantProduct;
  const currentStep = GUIDE_STEPS[guideStepKey] || GUIDE_STEPS.start;
  const guideHasBranch = guideStepKey !== 'start';
  const guideProgressTotal = guideAnswers.kind && guideAnswers.kind !== 'sorpresa' ? 2 : 1;
  const guideProgressIndex = guideHasBranch || suggestedProduct || isGuideThinking ? guideProgressTotal : 1;

  const clearThinkingTimers = () => {
    if (thinkingTimeoutRef.current) window.clearTimeout(thinkingTimeoutRef.current);
    if (thinkingIntervalRef.current) window.clearInterval(thinkingIntervalRef.current);
  };

  const generateSuggestion = (answers = guideAnswers, cycle = suggestionCycle) => {
    if (!candidates.length) return;
    clearThinkingTimers();

    let messageIndex = cycle % THINKING_MESSAGES.length;
    setIsGuideThinking(true);
    setGuideMessage('');
    setThinkingMessage(THINKING_MESSAGES[messageIndex]);

    thinkingIntervalRef.current = window.setInterval(() => {
      messageIndex = (messageIndex + 1) % THINKING_MESSAGES.length;
      setThinkingMessage(THINKING_MESSAGES[messageIndex]);
    }, 620);

    thinkingTimeoutRef.current = window.setTimeout(() => {
      clearThinkingTimers();
      const ranked = candidates
        .map((product, index) => ({ product, index, score: scoreProduct(product, answers) }))
        .sort((a, b) => b.score - a.score || a.index - b.index);
      const pool = ranked.filter((item) => item.score > 0);
      const list = pool.length ? pool : ranked;
      const selected = list[cycle % list.length]?.product || candidates[0];
      const selectedIndex = candidates.findIndex((product) => product.id === selected.id);

      setSuggestedProduct(selected);
      if (selectedIndex >= 0) setRecIndex(selectedIndex);
      setGuideMessage(createMatchMessage(selected, answers));
      setIsGuideThinking(false);
    }, 2100);
  };

  const openGuide = () => {
    setGuideOpen(true);
  };

  const chooseGuideOption = (stepId, optionValue) => {
    const nextAnswers = { ...guideAnswers, [stepId]: optionValue };
    setGuideAnswers(nextAnswers);
    setSuggestedProduct(null);
    setGuideMessage('');

    if (stepId === 'kind') {
      if (optionValue === 'sorpresa') {
        const nextCycle = suggestionCycle + 1;
        setSuggestionCycle(nextCycle);
        generateSuggestion(nextAnswers, nextCycle);
        return;
      }
      setGuideStepKey(optionValue);
      return;
    }

    const nextCycle = suggestionCycle + 1;
    setSuggestionCycle(nextCycle);
    generateSuggestion(nextAnswers, nextCycle);
  };

  const resetGuide = () => {
    clearThinkingTimers();
    setGuideAnswers({});
    setGuideStepKey('start');
    setSuggestedProduct(null);
    setGuideMessage('');
    setIsGuideThinking(false);
    setThinkingMessage(THINKING_MESSAGES[0]);
  };

  const anotherSuggestion = () => {
    const nextCycle = suggestionCycle + 1;
    setSuggestionCycle(nextCycle);
    generateSuggestion(guideAnswers, nextCycle);
  };

  const handleQuickView = () => {
    if (!currentSuggestion?.id) return;
    const payload = {
      id: currentSuggestion.id,
      productId: currentSuggestion.id,
      name: currentSuggestion.name,
      price: currentSuggestion.price,
      subtitle: currentSuggestion.desc,
      image_url: currentSuggestion.img,
      image: currentSuggestion.img
    };
    window.dispatchEvent(new CustomEvent('aa:quickview', { detail: payload }));
    setGuideOpen(false);
  };

  const handleFabPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: fabPosition.x,
      originY: fabPosition.y,
      moved: false
    };
  };

  const handleFabPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 8) drag.moved = true;
    if (!drag.moved) return;

    setFabPosition(clampFabPosition({ x: drag.originX + deltaX, y: drag.originY + deltaY }));
  };

  const handleFabPointerUp = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (drag.moved) {
      const next = clampFabPosition({
        x: drag.originX + event.clientX - drag.startX,
        y: drag.originY + event.clientY - drag.startY
      });
      setFabPosition(next);
      suppressFabClickRef.current = true;
      window.setTimeout(() => {
        suppressFabClickRef.current = false;
      }, 0);
      try {
        window.localStorage.setItem(FAB_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage failures.
      }
    } else if (event.pointerType === 'touch') {
      openGuide();
    }

    dragRef.current = null;
  };

  return (
    <div className="w-full flex justify-center mb-6">
      {instantProduct && (
        <button
          type="button"
          onPointerDown={handleFabPointerDown}
          onPointerMove={handleFabPointerMove}
          onPointerUp={handleFabPointerUp}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
          onClick={() => {
            if (suppressFabClickRef.current) return;
            openGuide();
          }}
          className="fixed z-[90] flex touch-none select-none items-center gap-2 rounded-full border border-white/80 bg-white/92 p-2 pr-3 text-[11px] font-black uppercase tracking-wide text-[#1A1A1A] shadow-[0_14px_36px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-transform active:scale-95 lg:hidden"
          style={{ left: fabPosition.x, top: fabPosition.y }}
          aria-label="Abrir guía de antojo"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ backgroundColor: primaryColor }}>
            <Sparkles size={14} />
          </span>
          <span>Guía</span>
        </button>
      )}

      <div className="w-full relative z-10 flex flex-col items-start">
        <div
          className="absolute -top-28 left-1/2 -z-10 h-[315px] w-[calc(100%+2rem)] -translate-x-1/2 rounded-b-[2.75rem] lg:h-[390px] lg:w-screen"
          style={{
            background: `
              radial-gradient(circle at 12% 4%, ${primaryColor}24 0, transparent 34%),
              radial-gradient(circle at 90% 0%, ${accentColor}20 0, transparent 30%),
              linear-gradient(180deg, #ffffff 0%, ${heroBg} 78%, transparent 100%)
            `
          }}
        />

        <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 w-full text-left lg:max-w-3xl"
        >
          <div className="mb-3 flex flex-col items-start gap-2">
            <div className="flex items-center gap-3 md:hidden">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/75 shadow-[0_12px_24px_rgba(0,0,0,0.07)] ring-1 ring-white/80 backdrop-blur-xl">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={brandName}
                    className="h-full w-full object-contain p-2"
                    style={{ filter: 'brightness(0) saturate(100%)' }}
                  />
                ) : (
                  <span className="text-sm font-black uppercase" style={{ color: primaryColor }}>
                    {brandName.slice(0, 2)}
                  </span>
                )}
              </div>
              <div className="min-w-0 text-left">
                <p className="max-w-[220px] truncate text-[15px] font-black leading-tight text-[#1A1A1A]">
                  {brandName}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1A1A1A]/35">
                  Menú digital
                </p>
              </div>
            </div>
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/45 px-3 py-1 text-[11px] font-bold text-[#1A1A1A]/55 backdrop-blur-md">
              <MapPin size={12} className="text-[#1A1A1A]/55" />
              <span className="max-w-[230px] truncate">{locationLabel}</span>
              <span className="text-[#1A1A1A]/25">•</span>
              <span className="max-w-[120px] truncate">{locationHint}</span>
            </div>
          </div>

          <h1 className="mb-1.5 text-2xl font-extrabold tracking-tight text-[#1A1A1A] md:text-3xl">
            Comer <span style={{ color: primaryColor }}>sano</span> nunca fue tan fácil
          </h1>
          <p className="text-xs font-medium text-[#1A1A1A]/40 md:text-sm">
            Ingredientes locales, directo a tu mesa.
          </p>
        </motion.div>

        {instantProduct && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-5 hidden w-full rounded-[1.5rem] border border-white/80 bg-white/82 p-4 shadow-[0_18px_50px_rgba(28,28,28,0.07)] backdrop-blur-xl lg:block"
          >
            <div className="flex items-center justify-between gap-5">
              <div>
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white" style={{ backgroundColor: primaryColor }}>
                  <Sparkles size={12} />
                  Guía de antojo
                </div>
                <h3 className="text-lg font-black text-[#1A1A1A]">{greeting}</h3>
                <p className="text-sm font-medium text-[#1A1A1A]/50">Haz un match rápido con algo de la carta.</p>
              </div>
              <button
                type="button"
                onClick={openGuide}
                className="shrink-0 rounded-full px-5 py-2 text-sm font-black text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Abrir guía
              </button>
            </div>
          </motion.div>
        )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative mb-5 w-full max-w-2xl self-center group"
        >
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-[#1A1A1A]/30 group-focus-within:text-[#E6B05C] transition-colors">
            <Search size={16} strokeWidth={2.5} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar bowls, cafe, postres..."
            className="w-full bg-white shadow-sm border border-black/5 focus:border-[#E6B05C]/50 rounded-full py-3 px-12 text-[#1A1A1A] text-sm font-medium placeholder:text-[#1A1A1A]/30 outline-none transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-4 flex items-center justify-center w-8 text-black/30 hover:text-black/60"
            >
              <span className="text-xl leading-none">&times;</span>
            </button>
          )}
        </motion.div>

        <div className="relative w-full overflow-visible">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full flex items-center justify-start md:justify-center gap-2.5 overflow-x-auto hide-scrollbar scrollbar-hide pb-2 pt-1 px-1 bg-transparent"
          >
            {[{ slug: 'todos', label: 'Todos' }, ...categories].map((cat, idx) => {
              const catId = cat.slug || cat.id;
              const catLabel = cat.label || cat.name || catId;
              const icon = HERO_CATEGORY_ICONS[catId] || categoryIcons[catId] || cat.icon || FALLBACK_CATEGORY_ICON;
              const isActive = activeCategory === catId;

              return (
                <button
                  type="button"
                  key={`${catId}-${idx}`}
                  onClick={() => setActiveCategory(catId)}
                  className={`shrink-0 flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-extrabold transition-all duration-300 ${
                    isActive
                      ? 'border-transparent bg-white text-[#1A1A1A] shadow-[0_8px_22px_rgba(0,0,0,0.08)]'
                      : 'border-black/5 bg-white/60 text-[#1A1A1A]/60 hover:bg-white'
                  }`}
                  style={isActive ? { boxShadow: `0 10px 24px ${primaryColor}1f` } : undefined}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: isActive ? `${primaryColor}12` : 'rgba(255,255,255,0.72)',
                      color: isActive ? primaryColor : 'rgba(26,26,26,0.58)'
                    }}
                  >
                    <Icon icon={icon} width="17" height="17" />
                  </span>
                  <span className="max-w-[120px] truncate">{catLabel}</span>
                </button>
              );
            })}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          onClick={() => window.location.hash = '#experiencias'}
          className="w-full mt-2 rounded-[1.5rem] overflow-hidden relative cursor-pointer group h-28 md:h-32 shadow-sm"
        >
          <img
            src={homeSettings?.menu_banner_img || 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=1200'}
            alt="Experiencias"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A2421]/90 via-[#1A2421]/60 to-transparent" />

          <div className="absolute inset-0 p-5 md:p-6 flex items-center justify-between z-10">
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-[#E6B05C] text-[#1A1A1A] text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full">
                  {homeSettings?.menu_banner_tag || 'Exclusivo'}
                </span>
                <span className="text-white/60 text-[10px] font-bold">
                  {homeSettings?.menu_banner_subtitle || 'Talleres & Catas'}
                </span>
              </div>
              <h3
                className="font-extrabold text-white text-lg md:text-xl leading-tight"
                dangerouslySetInnerHTML={{ __html: homeSettings?.menu_banner_title?.replace(/\n/g, '<br/>') || `Vive la experiencia<br/>${brandName}` }}
              />
            </div>

            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 group-hover:bg-white group-hover:text-[#1A2421] group-hover:scale-110 transition-all">
              <ArrowRight size={16} />
            </div>
          </div>
        </motion.div>
      </div>

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
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white" style={{ backgroundColor: primaryColor }}>
                    <Sparkles size={12} />
                    Guía de antojo
                  </div>
                  <h3 className="text-xl font-black leading-tight text-[#1A1A1A]">
                    {greeting}
                    {user.isLogged ? `, ${user.name}` : ''}
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
                    <p className="text-xs font-semibold text-[#1A1A1A]/40">Estoy cruzando tus respuestas con la carta disponible.</p>
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
                        {typeof suggestedProduct.price === 'number' ? `$${suggestedProduct.price.toLocaleString()}` : suggestedProduct.price}
                      </span>
                    </span>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-transform group-hover:scale-105" style={{ backgroundColor: accentColor }}>
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
                  onClick={suggestedProduct ? anotherSuggestion : () => generateSuggestion(guideAnswers, suggestionCycle + 1)}
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
    </div>
  );
}
