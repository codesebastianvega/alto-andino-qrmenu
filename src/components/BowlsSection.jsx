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
  // Find the 'custom' product or use the first one as representative
  const customProduct = products.find(p => p.configOptions?.creator_type) || products[0];
  const preBowl = products.find(p => !p.configOptions?.creator_type) || products[1];

  const openBuilder = () => setOpen(true);

  const addPre = () => {
    if (!preBowl) return;
    addItem({
      productId: preBowl.id,
      name: preBowl.name,
      price: preBowl.price,
      options: preBowl.configOptions || {},
    });
  };

  const show = preBowl && matchesQuery({ title: preBowl.name, description: preBowl.desc }, query);
  const count = show ? 1 : 0;

  useEffect(() => {
    onCount?.(count);
  }, [count, onCount]);

  if (!count && query) return null;

  const st = preBowl ? getStockState(preBowl.id) : null;
  const unavailable = st === "out" || (preBowl && isUnavailable(preBowl));

  return (
    <div id={id} className="space-y-4">
      {/* Card del prearmado (usa ProductCard) */}

      {/* Card del prearmado (usa ProductCard) */}
      <div className="mt-4">
        {preBowl && (
        <ProductCard
          item={preBowl}
          onAdd={() => {
            if (unavailable) return toast("Producto no disponible");
            addPre();
          }}
          onQuickView={() => onQuickView?.(preBowl)}
        />
        )}
      </div>

      {/* Modal de armado (Generalizado) */}
      {open && (
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
