import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Icon } from "@iconify-icon/react";
import { categoryIcons } from "../data/categoryIcons";

function IconWithFallback({ id, icon: iconProp, size = 24, className }) {
  const entry = iconProp ?? categoryIcons[id];
  const initial = typeof entry === "string" ? entry : entry?.icon;
  const fallback = typeof entry === "object" ? entry?.fallback : undefined;
  const [icon, setIcon] = useState(initial);
  if (!icon) return null;
  if (typeof icon === "string" && !icon.includes(":")) {
    return <span className="text-2xl leading-none align-middle">{icon}</span>;
  }
  return (
    <Icon
      icon={icon}
      width={size}
      height={size}
      className={className}
      aria-hidden
      onError={() => fallback && setIcon(fallback)}
    />
  );
}

export default function CategoryBar({
  categories = [],
  activeId,
  onSelect,
  featureTabs = false,
}) {
  const railRef = useRef(null);
  const [selected, setSelected] = useState(activeId ?? categories[0]?.id);
  const [manualSelectAt, setManualSelectAt] = useState(0);

  useEffect(() => {
    if (activeId !== undefined) setSelected(activeId);
  }, [activeId]);

  function handleSelect(id, idx) {
    setSelected(id);
    setManualSelectAt(Date.now());
    const cat = categories.find((c) => c.id === id);
    if (featureTabs) {
      cat && onSelect?.(cat);
    } else {
      if (cat) {
        onSelect?.(cat);
        const target = document.getElementById(cat.targetId || `section-${id}`);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        onSelect?.({ id });
      }
    }
    requestAnimationFrame(() =>
      railRef.current?.children[idx]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      })
    );
  }

  function handleKey(e) {
    const idx = categories.findIndex((c) => c.id === selected);
    const last = categories.length - 1;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = Math.min(idx + 1, last);
      handleSelect(categories[next].id, next);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = Math.max(idx - 1, 0);
      handleSelect(categories[prev].id, prev);
    } else if (e.key === "Home") {
      e.preventDefault();
      handleSelect(categories[0].id, 0);
    } else if (e.key === "End") {
      e.preventDefault();
      handleSelect(categories[last].id, last);
    }
  }

  useEffect(() => {
    const secs = categories
      .map((c) => document.getElementById(c.targetId || `section-${c.id}`))
      .filter(Boolean);
    if (!secs.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (Date.now() - manualSelectAt < 800) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          const id = visible.target.id.replace(/^section-/, "");
          if (id && id !== selected) {
            setSelected(id);
            const cat = categories.find((c) => c.id === id);
            cat && onSelect?.(cat);
          }
        }
      },
      { threshold: [0.5] }
    );
    secs.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [categories, manualSelectAt, selected, onSelect]);

  return (
    <div className="sticky top-0 z-40 bg-transparent backdrop-blur-[2px] border-b border-black/5 dark:border-white/10">
      <div
        role="tablist"
        className="-mx-4 px-4 py-2 flex gap-3 md:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none relative"
        onWheel={(e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        ref={railRef}
      >
        {categories.map((cat, idx) => {
          const active = selected === cat.id;
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={active}
              aria-controls={`section-${cat.id}`}
              tabIndex={active ? 0 : -1}
              onKeyDown={handleKey}
              onClick={() => handleSelect(cat.id, idx)}
              className={clsx(
                "inline-flex flex-col items-center justify-center text-center snap-start rounded-2xl w-24 md:w-28 h-20 px-2",
                "bg-white/12 backdrop-blur-md border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.08)]",
                "text-neutral-800 dark:text-neutral-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]",
                "hover:bg-white/20 hover:border-white/30",
                "aria-selected:bg-white/28 aria-selected:border-white/40"
              )}
            >
              <span className="w-10 h-10 rounded-full grid place-items-center shrink-0 bg-white/20 border border-white/30">
                <IconWithFallback id={cat.id} className="w-6 h-6 object-contain" />
              </span>
              <span className="mt-1 text-xs font-medium leading-tight whitespace-normal break-words line-clamp-2">
                {cat.label}
              </span>
            </button>
          );
        })}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-[#efe7dd] to-transparent dark:from-neutral-900" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-[#efe7dd] to-transparent dark:from-neutral-900" />
      </div>
    </div>
  );
}

