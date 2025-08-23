import { useState } from "react";
import { Icon } from "@iconify-icon/react";
import { categoryIcons } from "../data/categoryIcons";

function IconWithFallback({ id }) {
  const entry = categoryIcons[id];
  const initial = typeof entry === "string" ? entry : entry?.icon;
  const fallback = typeof entry === "object" ? entry?.fallback : undefined;
  const [icon, setIcon] = useState(initial);
  if (!icon) return null;
  return (
    <Icon
      icon={icon}
      width="32"
      height="32"
      className="mb-2 shrink-0"
      aria-hidden
      onError={() => fallback && setIcon(fallback)}
    />
  );
}

export default function CategoryBar({ categories = [], activeId, onSelect }) {
  return (
    <div
      className="sticky z-[60]"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
      aria-label="Categorías del menú"
    >
      <div className="-mx-4 sm:-mx-6 py-2">
        <div className="flex overflow-x-auto snap-x snap-mandatory px-4 gap-3 [transform:translateZ(0)]">
          {categories.map((cat) => {
            const active = activeId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  const target = document.getElementById(
                    cat?.targetId || `section-${cat.id}`
                  );
                  target?.scrollIntoView({ behavior: "smooth", block: "start" });
                  onSelect?.(cat);
                }}
                aria-current={active ? "true" : undefined}
                className={`flex-none shrink-0 basis-[112px] w-[112px] h-[128px] rounded-xl border bg-white/70 backdrop-blur-sm snap-start transition-colors flex flex-col items-center justify-center text-[12px] leading-tight text-center ${
                  active
                    ? "bg-[#2f4131]/5 text-[#2f4131] border-[#2f4131]"
                    : "text-[#2f4131] border-[#2f4131]/35 hover:border-[#2f4131]/60"
                }`}
              >
                <IconWithFallback id={cat.id} />
                <span
                  className="w-full h-[38px] overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

