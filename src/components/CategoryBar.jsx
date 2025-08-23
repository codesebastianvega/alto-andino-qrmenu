import { useEffect, useRef, useState } from "react";
import { Chip } from "./Buttons";
import { Icon } from "@iconify-icon/react";
import { categoryIcons } from "../data/categoryIcons";

const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
   .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

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
      { root: null, rootMargin: `${marginTop}px 0px ${marginBottom}px 0px`, threshold: [0.2, 0.5] }
    );
    sections.forEach(({ el }) => io.observe(el));
    ioRef.current = io;
    return () => io.disconnect();
  }, [sections]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el || typeof window === "undefined") return;
    const barH = barRef.current?.offsetHeight || 44;
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - barH - 8,
      behavior: "smooth",
    });
    setActive(id);
  };

  return (
    // STICKY en el WRAPPER EXTERNO (no meter overflow aquí)
    <div
      ref={barRef}
      className="sticky z-[60]"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
      aria-label="Categorías del menú"
    >
        <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 py-2">
          <div className="relative overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-stretch gap-2 w-max">
              {sections.map(({ id, label }) => (
                <Chip
                  key={id}
                  onClick={() => scrollTo(id)}
                  active={active === id}
                  aria-current={active === id ? "true" : undefined}
                  className={[
                    "flex flex-col items-center justify-center gap-0.5",
                    "h-12 min-w-[88px] px-3 text-[12px]",
                    active === id
                      ? "shadow-sm"
                      : "border-[#2f4131]/40 text-[#2f4131] hover:border-[#2f4131]/60 bg-white/80"
                  ].join(" ")}
                >
                  <Icon
                    icon={categoryIcons[id] || "fluent-emoji:white-circle"}
                    width="24"
                    height="24"
                    aria-hidden
                  />
                  <span className="leading-none">{label}</span>
                </Chip>
              ))}

              <Chip
                onClick={onOpenGuide}
                className="flex flex-col items-center justify-center gap-0.5 h-12 min-w-[80px] px-3 text-[12px] border-[#2f4131]/30 text-[#2f4131] bg-white/70 hover:bg-[#2f4131] hover:text-white"
              >
                <Icon icon="fluent-emoji:microbe" width="22" height="22" aria-hidden />
                <span className="leading-none">Alérgenos</span>
              </Chip>
            </div>
            {/* Fades sutiles que se “pierden” en el fondo */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#eee6db]/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#eee6db]/80 to-transparent" />
          </div>
        </div>
      </div>
  );
}

