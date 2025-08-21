import { useEffect, useRef, useState } from "react";

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function CategoryBar({ onOpenGuide }) {
  const [sections, setSections] = useState([]);
  const [active, setActive] = useState(null);
  const barRef = useRef(null);
  const ioRef = useRef(null);

  // Leer secciones del DOM cuando monta
  useEffect(() => {
    const nodes = document.querySelectorAll("[data-aa-section]");
    const list = Array.from(nodes).map((n) => {
      const id = n.id || slugify(n.getAttribute("data-aa-section") || "");
      if (!n.id) n.id = id;
      return { id, label: n.getAttribute("data-aa-section") || id, el: n };
    });
    setSections(list);
  }, []);

  // Observer con rootMargin basado en la altura real de la barra
  useEffect(() => {
    if (!sections.length) return;
    const barH = barRef.current?.offsetHeight || 48;
    const marginTop = -(barH + 8);
    const marginBottom = -Math.round(window.innerHeight * 0.45);

    ioRef.current?.disconnect();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(e.target.id);
          }
        }
      },
      { root: null, rootMargin: `${marginTop}px 0px ${marginBottom}px 0px`, threshold: [0.2, 0.4, 0.6] }
    );
    sections.forEach(({ el }) => io.observe(el));
    ioRef.current = io;
    return () => io.disconnect();
  }, [sections]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const barH = barRef.current?.offsetHeight || 48;
    const y = el.getBoundingClientRect().top + window.scrollY - barH - 8;
    setActive(id); // fallback visual inmediato
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div
      ref={barRef}
      className="sticky z-50 bg-[rgba(250,247,242,0.92)] backdrop-blur border-b border-black/5"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
      aria-label="Categorías del menú"
    >
      <div className="w-full px-3 sm:px-4 py-2 flex items-center gap-2">
        {/* Carril scrolleable de categorías */}
        <div className="flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2 w-max">
            {sections.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                aria-pressed={active === id}
                className={[
                  "px-3 py-1 rounded-full text-sm border transition whitespace-nowrap",
                  active === id
                    ? "bg-[#2f4131] text-white border-[#2f4131] shadow"
                    : "bg-white text-neutral-800 border-neutral-300 hover:border-neutral-400",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Botón Alérgenos fijo a la derecha */}
        <button
          type="button"
          onClick={onOpenGuide}
          className="shrink-0 h-8 px-2.5 rounded-full text-xs border border-[#2f4131]/30 text-[#2f4131] bg-white/50 hover:bg-[#2f4131] hover:text-white hover:border-[#2f4131] shadow-sm ring-1 ring-black/5 transition focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
          aria-label="Guía dietaria y alérgenos"
        >
          Alérgenos
        </button>
      </div>
    </div>
  );
}

