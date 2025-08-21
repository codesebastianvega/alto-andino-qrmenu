import React from "react";

export default function Section({ title, children }) {
  const id = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return (
    <section id={id} data-aa-section={title} className="scroll-mt-20">
      <h2 className="text-2xl font-extrabold text-neutral-900 flex items-end gap-3">
        {title}
        <span className="h-[3px] w-14 bg-[#2f4131]/20 rounded-md translate-y-[8px]" />
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

