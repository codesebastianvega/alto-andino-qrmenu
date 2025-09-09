// src/components/shared/MiniCart.jsx
import { useAppState } from "../../state/appState";
import { useNavigate } from "react-router-dom";
import { formatCOP } from "@/utils/money";
import { toast } from "@/components/Toast";

export default function MiniCart() {
  const {
    cart,
    mode,
    getIncompatibleItemsForMode,
    getCartTotalCop,
    products,
    removeItemsByIds,
  } = useAppState();
  const count = cart?.items?.length || 0;
  const incompatible = getIncompatibleItemsForMode(mode);
  const total = getCartTotalCop();

  const disabled = count === 0 || incompatible.length > 0;

  const navigate = useNavigate();

  const goCheckout = () => {
    if (disabled) return;
    const unavailable = cart.items.filter((it) => {
      const p = products.find((pr) => pr.id === it.productId);
      return p && (!p.is_available || (typeof p.stock === "number" && p.stock <= 0));
    });
    if (unavailable.length > 0) {
      removeItemsByIds(unavailable.map((u) => u.id));
      toast("Quitamos productos sin stock del carrito");
      if (count - unavailable.length === 0) return;
    }
    navigate("/checkout");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow md:top-0 md:bottom-auto md:left-auto md:right-0 md:m-4 md:w-64 md:rounded md:border">
      <div className="flex flex-col gap-2 border-t p-4 md:border-0">
        {incompatible.length > 0 && (
          <button
            className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800"
            title={`Tienes ítems no compatibles con ${mode}. Revísalos`}
          >
            {`Tienes ítems no compatibles con ${mode}. Revísalos`}
          </button>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            <span className="text-sm">
              {count} · {formatCOP(total)}
            </span>
          </div>
          <button
            onClick={goCheckout}
            disabled={disabled}
            className={[
              "rounded px-4 py-2 text-sm",
              disabled
                ? "cursor-not-allowed bg-gray-300 text-gray-500"
                : "bg-[#2f4131] text-white hover:bg-[#243326]",
            ].join(" ")}
          >
            Ir al checkout
          </button>
        </div>
      </div>
    </div>
  );
}

