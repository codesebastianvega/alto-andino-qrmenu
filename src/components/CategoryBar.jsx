import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify-icon/react";
import { categoryIcons } from "../data/categoryIcons";

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

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

export default function CategoryBar({ onOpenGuide }) {
  const [sections, setSections] = useState([]);
  const [active, setActive] = useState(null);
  const barRef = useRef(null);
  const ioRef = useRef(null);

  useEffect(() => {
    const nodes = document.querySelectorAll("[data-aa-section]");
    const list = Array.from(nodes).map((n) => {
      const id = n.id || slugify(n.getAttribute("data-aa-section") || "");
      if (!n.id) n.id = id;
      return { id, label: n.getAttribute("data-aa-section") || id, el: n };
    });
    setSections(list);
  }, []);

  useEffect(() => {
    if (!sections.length) return;
    if (typeof window === "undefined") return;
    const barH = barRef.current?.offsetHeight || 44;
    const marginTop = -(barH + 8);
    const marginBottom = -Math.round(window.innerHeight * 0.45);

    ioRef.current?.disconnect();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      {
        root: null,
        rootMargin: `${marginTop}px 0px ${marginBottom}px 0px`,
        threshold: [0.2, 0.5],
      }
    );
    sections.forEach(({ el }) => io.observe(el));
    ioRef.current = io;
    return () => io.disconnect();
  }, [sections]);

  const scrollTo = (id, evt) => {
    const el = document.getElementById(id);
    if (!el || typeof window === "undefined") return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    const barH = barRef.current?.offsetHeight || 44;
    window.scrollBy({ top: -(barH + 8), behavior: "smooth" });
    evt?.currentTarget?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
    setActive(id);
  };

  return (
    <div
      ref={barRef}
      className="sticky z-[60]"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
      aria-label="Categorías del menú"
    >
      <div className="-mx-4 sm:-mx-6 py-2">
        <div className="relative">
          <div className="flex overflow-x-auto snap-x snap-mandatory px-4 gap-3 [transform:translateZ(0)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sections.map(({ id, label }) => (
              <button
                key={id}
                onClick={(e) => scrollTo(id, e)}
                aria-current={active === id ? "true" : undefined}
                className={[
                  "flex-none shrink-0 basis-[112px] w-[112px] h-[128px] snap-start",
                  "flex flex-col items-center justify-center",
                  "rounded-xl border bg-white/70 backdrop-blur-sm",
                  "text-[12px] leading-tight text-center text-[#2f4131]",
                  active === id
                    ? "border-[#2f4131] bg-[#2f4131] text-white"
                    : "border-[#2f4131]/35 hover:border-[#2f4131]/60",
                ].join(" ")}
              >
                <IconWithFallback id={id} />
                <span className="w-full h-[38px] line-clamp-2">{label}</span>
              </button>
            ))}

            <button
              onClick={onOpenGuide}
              className="flex-none shrink-0 basis-[112px] w-[112px] h-[128px] snap-start flex flex-col items-center justify-center rounded-xl border bg-white/70 backdrop-blur-sm text-[12px] leading-tight text-center text-[#2f4131] border-[#2f4131]/35 hover:border-[#2f4131]/60"
            >
              <Icon
                icon="fluent-emoji:microbe"
                width="32"
                height="32"
                className="mb-2 shrink-0"
                aria-hidden
              />
              <span className="w-full h-[38px] line-clamp-2">Alérgenos</span>
            </button>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#efe8de]/85 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#efe8de]/85 to-transparent" />
        </div>
      </div>
    </div>
  );
}
