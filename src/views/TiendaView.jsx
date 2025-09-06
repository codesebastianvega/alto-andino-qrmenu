// src/views/TiendaView.jsx
import { useEffect, useState } from "react";

export default function TiendaView({ onSwitch }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(true), []);

  const cats = ["Semillas", "Frutos secos", "Panes", "Lácteos"];

  return (
    <div className={`p-4 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
      <h1 className="mb-4 text-2xl font-bold">Tienda</h1>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {cats.map((c) => (
          <div key={c} className="rounded-full bg-gray-200 px-3 py-1 text-sm whitespace-nowrap">
            {c}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1,2,3,4].map((n) => (
          <div key={n} className="h-24 w-full animate-pulse rounded bg-gray-200" />
        ))}
      </div>
      <button className="mt-6 text-blue-600 underline" onClick={onSwitch}>
        Ir al Menú
      </button>
    </div>
  );
}

