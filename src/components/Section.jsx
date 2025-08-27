import React, { useEffect, useRef, useState } from "react";
import { slugify } from "@/utils/stock";

export default function Section({ title, children, count, id: customId }) {
  const id = customId ?? "section-" + slugify(title || "");
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id={id}
      data-aa-section={title}
      className={`mb-6 scroll-mt-28 last:mb-0 md:scroll-mt-32 transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
        {title}
        {count != null && (
          <span className="ml-2 align-middle text-sm font-medium text-zinc-500">
            ({count})
          </span>
        )}
      </h2>
      <div className="mb-4 mt-1 h-[2px] w-12 rounded bg-[#2f4131]/25 sm:mb-5" />
      <div className="mt-2 sm:mt-3">{children}</div>
    </section>
  );
}