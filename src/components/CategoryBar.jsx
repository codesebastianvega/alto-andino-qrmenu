import { useEffect, useRef, useState } from "react";
import { PILL_XS, PILL_SM } from "./Buttons";

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
      className="sticky z-[60] bg-[rgba(250,247,242,0.92)] backdrop-blur border-b border-black/5"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
      aria-label="Categorías del menú"
    >
      {/* full-bleed */}
      <div className="w-full px-3 sm:px-4 py-2 flex items-center gap-2">
        {/* carril scrolleable */}
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
                    : "bg-white text-neutral-800 border-neutral-300 hover:border-neutral-400"
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* botón Guía / Alérgenos (tamaño XS/SM) */}
        <button
          type="button"
          onClick={onOpenGuide}
          className={[
            "shrink-0 rounded-full border border-[#2f4131]/30 text-[#2f4131] bg-white/50",
            "hover:bg-[#2f4131] hover:text-white hover:border-[#2f4131]",
            "shadow-sm ring-1 ring-black/5 transition focus:outline-none",
            "focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]",
            PILL_XS, "sm:" + PILL_SM
          ].join(" ")}
          aria-label="Guía dietaria y alérgenos"

        >
          Alérgenos
        </button>
      </div>
    </div>
  );
}
