import React from "react";

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function Section({ title, children, count, id: customId }) {
  const id = customId ?? "section-" + slugify(title || "");
  return (
    <section
      id={id}
      data-aa-section={title}
      className="scroll-mt-24 mt-6 sm:mt-8"
    >
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
        {title}
        {count != null && (
          <span className="ml-2 text-sm text-zinc-500 font-medium align-middle">
            ({count})
          </span>
        )}
      </h2>
      <div className="mt-1 mb-4 sm:mb-5 h-[2px] w-12 rounded bg-[#2f4131]/25" />
      <div className="mt-2 sm:mt-3">{children}</div>
    </section>
  );
}
