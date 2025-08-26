function labelDe(slug) {
  const labels = {
    todos: "Todos",
    desayunos: "Desayunos",
    bowls: "Bowls",
    platos: "Platos Fuertes",
    sandwiches: "Sándwiches",
    smoothies: "Smoothies & Funcionales",
    cafe: "Café de especialidad",
    bebidasfrias: "Bebidas frías",
    postres: "Postres",
  };
  return labels[slug] || "";
}

export default function CategoryHeader({
  selectedCategory = "todos",
  visibleCount = 0,
}) {
  const label = labelDe(selectedCategory);
  const showHint = selectedCategory === "todos";
  return (
    <section
      aria-labelledby="cat-title"
      className="px-4 md:px-6 mt-3 md:mt-4 mb-2 md:mb-3"
    >
      <h2
        id="cat-title"
        className="text-lg md:text-xl font-semibold tracking-tight text-[#2f4131]"
      >
        {label}
        {selectedCategory !== "todos" && (
          <span className="ml-2 text-sm text-zinc-500 font-medium align-middle">
            ({visibleCount})
          </span>
        )}
      </h2>
      {showHint && (
        <p className="text-sm md:text-[15px] text-zinc-600">
          Elige una categoría o desliza para ver más →
        </p>
      )}
    </section>
  );
}
