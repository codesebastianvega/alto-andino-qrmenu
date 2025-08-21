import { useEffect, useMemo, useRef, useState } from "react";

// util para slug simple desde el título de la sección
const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function CategoryBar() {
  const [active, setActive] = useState(null);
  const containerRef = useRef(null);

  // Leer secciones del DOM (Section.jsx añadirá data-aa-section y id)
  const sections = useMemo(() => {
    const nodes = document.querySelectorAll("[data-aa-section]");
    return Array.from(nodes).map((n) => ({
      id: n.id || slugify(n.getAttribute("data-aa-section")),
      label: n.getAttribute("data-aa-section"),
      el: n,
    }));
  }, []);

  useEffect(() => {
    if (!sections.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-48px 0px -60% 0px", threshold: 0.2 }
    );
    sections.forEach(({ el }) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const stickyH = 56; // altura aprox de la barra
    const y = el.getBoundingClientRect().top + window.scrollY - stickyH - 8;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div className="sticky top-0 z-40 bg-[rgba(250,247,242,0.9)] backdrop-blur border-b border-black/5">
      <div
        ref={containerRef}
        className="max-w-3xl mx-auto px-4 py-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex gap-2">
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
    </div>
  );
}

