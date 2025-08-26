import { useState } from "react";
import { Icon } from "@iconify-icon/react";
import { categoryIcons } from "../data/categoryIcons";

function IconWithFallback({ id, size = 32, className }) {
  const entry = categoryIcons[id];
  const initial = typeof entry === "string" ? entry : entry?.icon;
  const fallback = typeof entry === "object" ? entry?.fallback : undefined;
  const [icon, setIcon] = useState(initial);
  if (!icon) return null;
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
  variant = "chip",
}) {
  const baseItemClasses =
    variant === "chip"
      ? "flex-none w-[100px] basis-[100px] h-[110px] snap-start rounded-xl bg-white/60 backdrop-blur-sm transition-colors transition-shadow duration-150 focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,.3)] focus:ring-offset-2"
      : "flex-none shrink-0 basis-[112px] w-[112px] h-[128px]";
  const labelHeight = variant === "chip" ? "h-[34px]" : "h-[38px]";
  return (
    <nav
      className="sticky z-[60] px-0"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
      aria-label="Categorías del menú"
    >
      <ul className="flex overflow-x-auto snap-x snap-mandatory gap-3 py-2 [transform:translateZ(0)]">
        {categories.map((cat) => {
          const active = activeId === cat.id;
          const tint = cat.tintClass || "bg-zinc-100";
          const labelTextClasses =
            variant === "chip"
              ? `text-[13px] leading-tight ${active ? "text-[#2f4131]" : "text-zinc-800"}`
              : "text-[12px] leading-tight";
          return (
            <li key={cat.id} className="first:ml-1 last:mr-1">
              <button
                onClick={() => {
                  if (cat.id === "todos") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  } else {
                    const target = document.getElementById(
                      cat?.targetId || `section-${cat.id}`
                    );
                    target?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                  onSelect?.(cat);
                }}
                type="button"
                aria-label={cat.label}
                aria-current={active ? "true" : undefined}
                className={`${baseItemClasses} flex flex-col items-center justify-center text-center ${
                  active
                    ? "border border-transparent bg-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,.65),_0_8px_22px_rgba(36,51,38,.16)] text-[#2f4131]"
                    : variant === "chip"
                    ? "border border-zinc-200 hover:border-zinc-300"
                    : "text-[#2f4131] border-[#2f4131]/35 hover:border-[#2f4131]/60 focus:border-[#2f4131]/60"
                }`}
              >
                {variant === "chip" ? (
                  <span
                    className={`grid place-items-center h-11 w-11 md:h-12 md:w-12 rounded-full ${tint} ${
                      active ? "shadow-[inset_0_1px_0_rgba(255,255,255,.75)]" : ""
                    }`}
                  >
                    <IconWithFallback
                      id={cat.id}
                      className={`h-6 w-6 md:h-7 md:w-7 shrink-0 ${
                        active ? "text-[#2f4131]" : ""
                      }`}
                    />
                  </span>
                ) : (
                  <IconWithFallback id={cat.id} className="mb-2 shrink-0" />
                )}
                <span
                  className={`w-full ${labelHeight} overflow-hidden ${
                    variant === "chip" ? "mt-2" : ""
                  }`}
                >
                  <span
                    className={`${labelTextClasses} flex items-center justify-center`}
                  >
                    <span
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {cat.label}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

