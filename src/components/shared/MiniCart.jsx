// src/components/shared/MiniCart.jsx
import { useAppState } from "../../state/appState";

export default function MiniCart() {
  const { cart } = useAppState();
  const count = cart?.items?.length || 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow md:top-0 md:bottom-auto md:left-auto md:right-0 md:m-4 md:w-64 md:rounded md:border">
      <div className="flex items-center justify-between border-t p-4 md:border-0">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          <span className="text-sm">{count}</span>
        </div>
        <button
          disabled
          className="cursor-not-allowed rounded bg-gray-300 px-4 py-2 text-gray-500"
        >
          Revisar pedido
        </button>
      </div>
    </div>
  );
}

