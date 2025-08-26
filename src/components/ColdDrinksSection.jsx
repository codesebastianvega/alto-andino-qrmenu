import ProductSection from "./ProductSection";
import { sodas, otherDrinks } from "../data/menuItems";

export default function ColdDrinksSection({ query, onCount, onQuickView }) {
  const groups = [
    { title: "Gaseosas y Sodas", items: sodas },
    { title: "Jugos y otras bebidas frías", items: otherDrinks },
  ];

  return (
    <ProductSection
      id="bebidasfrias"
      title="Bebidas frías"
      query={query}
      groups={groups}
      onCount={onCount}
      onQuickView={onQuickView}
    />
  );
}

