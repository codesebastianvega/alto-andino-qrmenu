import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify-icon/react";

const CHIP = {
  base: "w-[116px] sm:w-[128px] h-[72px] rounded-xl bg-white ring-1 ring-neutral-200 grid grid-rows-[auto_1fr] place-items-center px-3 py-2 text-center select-none snap-center",
  text: "text-[13px] leading-tight whitespace-normal break-words line-clamp-2",
  icon: "w-6 h-6",
  inactive: "text-neutral-700",
  active: "bg-emerald-100 ring-emerald-300 text-emerald-800",
};

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
      <div
        role="tablist"
        className="-mx-4 px-4 py-2 flex gap-3 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory scroll-smooth"
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
              className={[CHIP.base, active ? CHIP.active : ""].join(" ")}
            >
              <IconWithFallback
                icon={item.icon}
                className={[CHIP.icon, active ? "text-emerald-800" : CHIP.inactive].join(" ")}
              />
              <span
                className={[CHIP.text, active ? "text-emerald-800" : CHIP.inactive].join(" ")}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

