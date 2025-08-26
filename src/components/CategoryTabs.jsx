import { useRef, useState } from "react";
import { Icon } from "@iconify-icon/react";

function IconWithFallback({ icon, size = 32, className }) {
  const initial = typeof icon === "string" ? icon : icon?.icon;
  const fallback = typeof icon === "object" ? icon?.fallback : undefined;
  const [current, setCurrent] = useState(initial);
  if (!current) return null;
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

export default function CategoryTabs({ value, onChange, items = [], fullBleed = true }) {
  const tabRefs = useRef([]);
  const baseItemClasses =
    "flex-none w-[100px] basis-[100px] h-[110px] snap-start rounded-xl bg-white/60 backdrop-blur-sm transition-colors transition-shadow duration-150 focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,.3)] focus:ring-offset-2";

  function focusTab(index) {
    const ref = tabRefs.current[index];
    ref?.focus();
  }

  function handleKeyDown(e, index) {
    const lastIndex = items.length - 1;
    if (e.key === "ArrowRight" || e.key === "Right") {
      e.preventDefault();
      const next = index === lastIndex ? 0 : index + 1;
      onChange?.(items[next].id);
      focusTab(next);
    } else if (e.key === "ArrowLeft" || e.key === "Left") {
      e.preventDefault();
      const prev = index === 0 ? lastIndex : index - 1;
      onChange?.(items[prev].id);
      focusTab(prev);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange?.(items[0].id);
      focusTab(0);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange?.(items[lastIndex].id);
      focusTab(lastIndex);
    }
  }

  const nav = (
    <nav
      className="sticky z-[60] px-0"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
      aria-label="Categorías del menú"
    >
      <div
        role="tablist"
        className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory gap-3 scroll-px-4 py-2 [transform:translateZ(0)]"
      >
        {items.map((item, idx) => {
          const selected = value === item.id;
          const tint = item.tintClass || "bg-zinc-100";
          return (
              <button
                key={item.id}
                ref={(el) => (tabRefs.current[idx] = el)}
                type="button"
                id={`tab-${item.id}`}
                role="tab"
                aria-selected={selected}
                aria-label={item.label}
                aria-current={selected ? "true" : undefined}
                aria-controls={
                  item.id === "todos" ? undefined : `panel-${item.id}`
                }
                tabIndex={selected ? 0 : -1}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                onClick={() => onChange?.(item.id)}
                className={`${baseItemClasses} first:ml-1 last:mr-1 flex flex-col items-center justify-center text-center ${
                  selected
                    ? "border border-transparent bg-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,.65),_0_8px_22px_rgba(36,51,38,.16)] text-[#2f4131]"
                    : "border border-zinc-200 hover:border-zinc-300"
                }`}
              >
              <span
                className={`grid place-items-center h-11 w-11 md:h-12 md:w-12 rounded-full ${tint} ${
                  selected ? "shadow-[inset_0_1px_0_rgba(255,255,255,.75)]" : ""
                }`}
              >
                <IconWithFallback
                  icon={item.icon}
                  className={`h-6 w-6 md:h-7 md:w-7 shrink-0 ${
                    selected ? "text-[#2f4131]" : ""
                  }`}
                />
              </span>
              <span className="w-full h-[34px] overflow-hidden mt-2">
                <span
                  className={`text-[13px] leading-tight flex items-center justify-center ${
                    selected ? "text-[#2f4131]" : "text-zinc-800"
                  }`}
                >
                  <span
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {item.label}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  if (fullBleed) {
    return <div className="-mx-4 md:-mx-6 px-4 md:px-6">{nav}</div>;
  }
  return nav;
}
