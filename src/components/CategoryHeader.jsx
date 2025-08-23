export default function CategoryHeader() {
  return (
    <section
      aria-labelledby="cat-title"
      className="px-4 md:px-6 mt-3 md:mt-4 mb-2 md:mb-3"
    >
      <h2
        id="cat-title"
        className="text-lg md:text-xl font-semibold tracking-tight text-[#2f4131]"
      >
        Explora por categoría
      </h2>
      <p className="text-sm md:text-[15px] text-zinc-600">
        Elige una categoría o desliza para ver más →
      </p>
    </section>
  );
}
