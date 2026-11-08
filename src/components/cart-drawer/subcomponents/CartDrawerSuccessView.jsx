import React from "react";
import { Icon } from "@iconify-icon/react";

export default function CartDrawerSuccessView({
  show,
  lastOrderId,
  fulfillmentType,
  onClose,
  setShowSuccess,
  clearCart
}) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300 rounded-t-[28px] md:rounded-none md:rounded-l-[32px]">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 scale-animation">
        <Icon icon="heroicons:check-badge" className="text-5xl text-green-600" />
      </div>
      <h3 className="text-3xl font-black text-gray-900 mb-3">¡Pedido Recibido!</h3>
      <p className="text-gray-500 mb-8 max-w-[280px]">
        Tu pedido{" "}
        <span className="font-bold text-gray-900">
          #{lastOrderId?.slice(0, 4).toUpperCase()}
        </span>{" "}
        ha sido registrado.{" "}
        {fulfillmentType === "dine_in" || fulfillmentType === "takeaway"
          ? "En breve lo pasaremos a cocina para prepararlo."
          : "Por favor completa el pago para iniciar la preparación."}
      </p>

      <button
        type="button"
        onClick={() => {
          window.location.href = `#order/${lastOrderId}`;
          onClose?.();
          setShowSuccess(false);
          clearCart?.();
        }}
        className="w-full h-14 bg-orange-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-100 mb-4 hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        Seguir Mi Pedido <Icon icon="heroicons:arrow-right" />
      </button>

      <button
        type="button"
        onClick={() => {
          setShowSuccess(false);
          clearCart?.();
          onClose?.();
        }}
        className="w-full h-14 bg-[#2f4131] text-white rounded-2xl font-bold text-lg mb-4 hover:bg-[#202c21] transition-colors cursor-pointer"
      >
        Cerrar Menú
      </button>
    </div>
  );
}
