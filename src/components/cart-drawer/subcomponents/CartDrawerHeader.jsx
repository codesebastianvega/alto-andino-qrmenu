import React from "react";
import { Icon } from "@iconify-icon/react";

export default function CartDrawerHeader({ itemCount, onClearRequest, onClose }) {
  return (
    <>
      {/* Handle Mobile */}
      <div className="flex-shrink-0 pt-3 flex justify-center pb-2 md:hidden">
        <div className="h-1.5 w-12 rounded-full bg-neutral-300/80" />
      </div>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pb-3 pt-3 md:px-6 md:pt-6 md:pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="bg-[#2f4131]/10 p-2 rounded-full hidden md:block">
            <Icon icon="heroicons:shopping-cart" className="h-6 w-6 text-[#2f4131]" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
              Tu Pedido
            </h2>
            <p className="text-sm text-neutral-500 font-medium md:mt-0.5">
              {itemCount} {itemCount === 1 ? "artículo" : "artículos"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {itemCount > 0 && (
            <button
              type="button"
              onClick={onClearRequest}
              className="rounded-full p-2.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors hidden md:flex"
              aria-label="Vaciar carrito"
              title="Vaciar carrito"
            >
              <Icon icon="heroicons:trash" className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition-colors"
            aria-label="Cerrar panel"
          >
            <Icon icon="heroicons:x-mark" className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>
      </div>
    </>
  );
}
