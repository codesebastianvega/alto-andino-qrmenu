import React from "react";
import Portal from "../../Portal";
import { Icon } from "@iconify-icon/react";

export default function CartDrawerClearModal({
  open,
  onClose,
  confirmBtnRef,
  onConfirmClear
}) {
  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          className="relative z-10 w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-4">
            <Icon icon="heroicons:trash" className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-center text-lg font-bold text-neutral-900 mb-2">
            ¿Vaciar todo el carrito?
          </h3>
          <p className="text-center text-sm text-neutral-500 mb-6">
            Esta acción eliminará todos los productos de tu pedido actual.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-neutral-100 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              ref={confirmBtnRef}
              onClick={onConfirmClear}
              className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-600 transition-colors cursor-pointer"
            >
              Vaciar carrito
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
