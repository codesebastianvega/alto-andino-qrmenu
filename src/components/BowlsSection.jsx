import React, { lazy, Suspense, useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { formatCOP } from "@/utils/money";
import { matchesQuery } from "@/utils/strings";
import { PILL_XS, PILL_SM } from "./Buttons";
import { toast } from "./Toast";
import AAImage from "@/components/ui/AAImage";
import { getStockState, isUnavailable } from "@/utils/stock";
import { BOWL_BASE_PRICE } from "@/config/prices";
import ProductCard from "./ProductCard";
import { useMenuData } from "@/context/MenuDataContext";

const BowlBuilder = lazy(() => import("./ProductCreator"));

// ← editar nombres y precios aquí
const BASE_PRICE = BOWL_BASE_PRICE;

export default function BowlsSection({ query, onCount, onQuickView, id }) {
  const { getProductsByCategory } = useMenuData();
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);

  const products = getProductsByCategory('bowls');
  // Assume a product with creator_type is for the 'Arma tu bowl' builder
  const customProduct = products.find(p => p.configOptions?.creator_type);
  // The rest are preconfigured bowls
  const preBowls = products.filter(p => p !== customProduct);

  const visibleBowls = preBowls.filter(p => matchesQuery({ title: p.name, description: p.desc }, query));
  const count = visibleBowls.length + (customProduct && matchesQuery({ title: customProduct.name, description: customProduct.desc }, query) ? 1 : 0);

  const openBuilder = () => setOpen(true);

  useEffect(() => {
    onCount?.(count);
  }, [count, onCount]);

  if (!count && query) return null;

  return (
    <div id={id} className="space-y-4">
      <div className="mt-4 space-y-4 gap-4">
        {visibleBowls.map(bowl => {
          const st = getStockState(bowl.id);
          const unavailable = st === "out" || isUnavailable(bowl);
          return (
            <ProductCard
              key={bowl.id}
              item={bowl}
              onAdd={() => {
                if (unavailable) return toast("Producto no disponible");
                addItem({
                  productId: bowl.id,
                  name: bowl.name,
                  price: bowl.price,
                  options: bowl.configOptions || {},
                });
              }}
              onQuickView={() => onQuickView?.(bowl)}
            />
          );
        })}
      </div>

      {/* Modal de armado (Generalizado) */}
      {open && customProduct && (
        <Suspense fallback={null}>
          <BowlBuilder 
            product={customProduct}
            open={open} 
            onClose={() => setOpen(false)} 
          />
        </Suspense>
      )}
    </div>
  );
}
