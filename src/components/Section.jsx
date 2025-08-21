// src/components/Section.jsx
export default function Section({ title, id, className = "", children }) {
  const sectionId =
    id ||
    title
      ?.toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  return (
    <section id={sectionId} className={`mt-8 sm:mt-10 ${className}`}>
      <h2 className="inline-block text-xl sm:text-2xl font-extrabold tracking-tight text-alto-text mb-3 border-b-2 border-alto-primary/30">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
