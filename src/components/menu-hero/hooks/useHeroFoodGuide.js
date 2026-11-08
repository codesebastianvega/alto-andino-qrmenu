import { useState, useMemo, useRef, useEffect } from 'react';
import { getStockState } from '../../../utils/stock';
import {
  GUIDE_STEPS,
  THINKING_MESSAGES,
  FAB_STORAGE_KEY,
  scoreProduct,
  createMatchMessage,
  clampFabPosition,
  getInitialFabPosition
} from '../data/heroGuideData';

export function useHeroFoodGuide({ activeCategories = [], productsByCategory = {} }) {
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

  const handleFabPointerCancel = () => {
    dragRef.current = null;
  };

  const handleFabClick = () => {
    if (suppressFabClickRef.current) return;
    openGuide();
  };

  return {
    candidates,
    instantProduct,
    currentSuggestion,
    suggestedProduct,
    guideOpen,
    setGuideOpen,
    guideAnswers,
    currentStep,
    guideProgressTotal,
    guideProgressIndex,
    isGuideThinking,
    thinkingMessage,
    guideMessage,
    fabPosition,
    openGuide,
    chooseGuideOption,
    resetGuide,
    anotherSuggestion,
    handleQuickView,
    handleFabPointerDown,
    handleFabPointerMove,
    handleFabPointerUp,
    handleFabPointerCancel,
    handleFabClick
  };
}
