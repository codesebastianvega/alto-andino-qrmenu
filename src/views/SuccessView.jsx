// src/views/SuccessView.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabaseClient";
import { formatCOP } from "@/utils/money";

export default function SuccessView() {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId") || window.sessionStorage.getItem("lastOrderId");

  useEffect(() => {
    if (!orderId || !supabase) return;
    supabase
      .from("orders")
      .select("id, mode, total_cop")
      .eq("id", orderId)
      .single()
      .then(({ data }) => setOrder(data));
  }, [orderId]);

  if (!orderId) {
    return <div className="p-4">No se encontró la orden</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">¡Pedido recibido!</h2>
      {order && (
        <div className="space-y-1 text-sm">
          <p>Número de orden: {order.id}</p>
          <p className="capitalize">Modo: {order.mode}</p>
          <p>Total: {formatCOP(order.total_cop)}</p>
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <button
          className="flex-1 rounded bg-[#2f4131] py-2 text-white"
          onClick={() => navigate("/")}
        >
          Seguir comprando
        </button>
        <button
          className="flex-1 rounded border py-2"
          onClick={() => window.open(`/orders/${orderId}`, "_blank")}
        >
          Ver pedido en caja
        </button>
      </div>
    </div>
  );
}
