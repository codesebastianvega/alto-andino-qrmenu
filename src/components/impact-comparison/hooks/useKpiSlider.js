import { useState, useRef } from 'react';

export function useKpiSlider(itemsCount = 6) {
  const kpiScrollRef = useRef(null);
  const [activeKpiIndex, setActiveKpiIndex] = useState(0);

  const handleKpiScroll = () => {
    if (!kpiScrollRef.current) return;
    const { scrollLeft, offsetWidth } = kpiScrollRef.current;
    if (offsetWidth > 0) {
      const cardWidth = offsetWidth * 0.85;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveKpiIndex(Math.min(Math.max(index, 0), itemsCount - 1));
    }
  };

  const scrollToKpi = (index) => {
    if (!kpiScrollRef.current) return;
    const cardWidth = kpiScrollRef.current.offsetWidth * 0.86;
    kpiScrollRef.current.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    });
    setActiveKpiIndex(index);
  };

  return {
    kpiScrollRef,
    activeKpiIndex,
    handleKpiScroll,
    scrollToKpi
  };
}
