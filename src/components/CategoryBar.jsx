import { useEffect, useRef, useState } from "react";
import { Chip } from "./Buttons";

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
      {/* Card contenedor full-bleed */}
      <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 py-2">
        <div className="relative rounded-xl bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 ring-1 ring-black/10 border border-white/40">
          {/* carril scrolleable */}
          <div className="relative overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-2 w-max px-3 py-2">
              {sections.map(({ id, label }) => (
                <Chip
                  key={id}
                  onClick={() => scrollTo(id)}
                  active={active === id}
                  className={[
                    "whitespace-nowrap",
                    "h-8 px-3 text-sm", // tamaño consistente
                    active === id
                      ? "shadow-sm"
                      : "border-[#2f4131]/30 text-[#2f4131] hover:border-[#2f4131]/50"
                  ].join(" ")}
                  aria-current={active === id ? "true" : undefined}
                >
                  {label}
                </Chip>
              ))}

              {/* Botón Alérgenos más discreto */}
              <Chip
                onClick={onOpenGuide}
                className="h-7 px-2.5 text-xs border-[#2f4131]/30 text-[#2f4131] bg-white/60 hover:bg-[#2f4131] hover:text-white"
              >
                Alérgenos
              </Chip>
            </div>

            {/* Fades laterales para insinuar scroll */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white/80 to-transparent rounded-l-xl" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white/80 to-transparent rounded-r-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

