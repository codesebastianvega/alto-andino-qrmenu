import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Icon } from "@iconify-icon/react";

function IconWithFallback({ icon, size = 24, className }) {
  const initial = typeof icon === "string" ? icon : icon?.icon;
  const fallback = typeof icon === "object" ? icon?.fallback : undefined;
  const [current, setCurrent] = useState(initial);
  if (!current) return null;
  if (typeof current === "string" && !current.includes(":")) {
    return <span className="text-2xl leading-none align-middle">{current}</span>;
  }
  return (
    <Icon
      icon={current}
      width={size}
      height={size}
      className={className}
      aria-hidden
      onError={() => fallback && setCurrent(fallback)}
    />
  );
}

export default function CategoryTabs({
  value,
  onChange,
  items = [],
}) {
  const railRef = useRef(null);
  const [selected, setSelected] = useState(value ?? items[0]?.id);
  const [manualSelectAt, setManualSelectAt] = useState(0);

  useEffect(() => {
    if (value !== undefined) setSelected(value);
  }, [value]);

  function handleSelect(id, idx) {
    setSelected(id);
    setManualSelectAt(Date.now());
    onChange?.(id);
    document
      .getElementById(`panel-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    requestAnimationFrame(() =>
      railRef.current?.children[idx]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      })
    );
  }

  function handleKey(e) {
    const idx = items.findIndex((c) => c.id === selected);
    const last = items.length - 1;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = Math.min(idx + 1, last);
      handleSelect(items[next].id, next);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = Math.max(idx - 1, 0);
      handleSelect(items[prev].id, prev);
    } else if (e.key === "Home") {
      e.preventDefault();
      handleSelect(items[0].id, 0);
    } else if (e.key === "End") {
      e.preventDefault();
      handleSelect(items[last].id, last);
    }
  }

  useEffect(() => {
    const secs = items
      .map((c) => document.getElementById(`panel-${c.id}`))
      .filter(Boolean);
    if (!secs.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (Date.now() - manualSelectAt < 800) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          const id = visible.target.id.replace(/^panel-/, "");
          if (id && id !== selected) {
            setSelected(id);
            onChange?.(id);
          }
        }
      },
      { threshold: [0.5] }
    );
    secs.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items, manualSelectAt, selected, onChange]);

  return (
    <div className="sticky top-0 z-40 bg-transparent backdrop-blur-[2px] border-b border-black/5 dark:border-white/10">
      <div className="relative">
        <div
          role="tablist"
          className="-mx-4 px-4 py-2 flex gap-3 md:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none"
          onWheel={(e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          ref={railRef}
        >
          {items.map((item, idx) => {
            const active = selected === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${item.id}`}
                tabIndex={active ? 0 : -1}
                onKeyDown={handleKey}
                onClick={() => handleSelect(item.id, idx)}
                className={clsx(
                  "inline-flex flex-col items-center justify-center text-center snap-start rounded-2xl w-20 h-20 px-2",
                  "bg-white/12 backdrop-blur-md border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.08)]",
                  "text-neutral-800 dark:text-neutral-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]",
                  active && "ring-2 ring-[#2f4131]/50 bg-white/28 border-white/40",
                  "hover:bg-white/20 hover:border-white/30"
                )}
              >
                <span className="w-10 h-10 rounded-full grid place-items-center shrink-0 bg-white/20 border border-white/30">
                  <IconWithFallback icon={item.icon} className="w-6 h-6 object-contain" />
                </span>
                <span className="mt-1 text-xs font-medium leading-tight whitespace-normal break-words line-clamp-2">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-[var(--app-bg,#efe7dd)] to-transparent dark:from-neutral-900" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-[var(--app-bg,#efe7dd)] to-transparent dark:from-neutral-900" />
      </div>
    </div>
  );
}

