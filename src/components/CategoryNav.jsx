import React from "react";
import clsx from "clsx";
import { Icon } from "@iconify-icon/react";
import { categoryIcons } from "@/data/categoryIcons";

const CHIP = {
  base: "w-[116px] sm:w-[128px] h-[72px] rounded-xl bg-white ring-1 ring-neutral-200 grid grid-rows-[auto_1fr] place-items-center px-3 py-2 text-center select-none snap-center",
  text: "text-[13px] leading-tight whitespace-normal break-words line-clamp-2",
  icon: "w-6 h-6",
  inactive: "text-neutral-700",
  active: "bg-emerald-100 ring-emerald-300 text-emerald-800",
};

const SCROLL_OFFSET = 96; // px; fallback si no hay CSS var

function getIconDef(icon, id) {
  if (icon) return icon;
  const entry = categoryIcons[id];
  return typeof entry === "string" ? entry : entry?.icon;
}

function scrollToSection(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const y = window.scrollY + rect.top - SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
}

export default function CategoryNav({
  categories = [], // [{ id, label, icon?, targetId?, tintClass? }]
  activeId, // opcional
  onSelect, // recibe (cat)
  variant = import.meta?.env?.VITE_FEATURE_TABS === "true" ? "tabs" : "bar",
}) {
  const [selected, setSelected] = React.useState(activeId ?? categories[0]?.id);
  const railRef = React.useRef(null);
  const manualRef = React.useRef(0);

  React.useEffect(() => {
    if (activeId) setSelected(activeId);
  }, [activeId]);

  const handleSelect = (cat, idx) => {
    setSelected(cat.id);
    manualRef.current = Date.now();
    onSelect?.(cat);
    if (variant === "bar") {
      const target = cat.targetId || `section-${cat.id}`;
      scrollToSection(target);
    }
    requestAnimationFrame(() => {
      railRef.current?.children?.[idx]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    });
  };

  React.useEffect(() => {
    if (variant !== "bar") return;
    const secs = categories
      .map((c) => document.getElementById(c.targetId || `section-${c.id}`))
      .filter(Boolean);
    if (!secs.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (Date.now() - manualRef.current < 700) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible?.target?.id) return;
        const id = visible.target.id.replace(/^section-/, "");
        if (id && id !== selected) {
          setSelected(id);
          const cat = categories.find((c) => c.id === id);
          cat && onSelect?.(cat);
        }
      },
      { threshold: [0.5] },
    );
    secs.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [categories, selected, variant, onSelect]);

  const Wrapper = ({ children }) =>
    variant === "tabs" ? (
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>
    ) : (
      <div
        ref={railRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
        onWheel={(e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY;
        }}
        role="tablist"
        aria-label="Categorías"
      >
        {children}
      </div>
    );

  return (
    <Wrapper>
      {categories.map((cat, idx) => {
        const active = selected === cat.id;
        const iconName = getIconDef(cat.icon, cat.id) || "ph:squares-four";
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleSelect(cat, idx)}
            className={clsx(CHIP.base, active && CHIP.active)}
            role="tab"
            aria-selected={active}
            aria-controls={cat.targetId || `section-${cat.id}`}
          >
            <Icon
              className={clsx(CHIP.icon, active ? "text-emerald-800" : CHIP.inactive)}
              icon={iconName}
            />
            <span className={clsx(CHIP.text, active ? "text-emerald-800" : CHIP.inactive)}>
              {cat.label}
            </span>
          </button>
        );
      })}
    </Wrapper>
  );
}