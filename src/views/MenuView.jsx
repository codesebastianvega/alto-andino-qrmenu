// src/views/MenuView.jsx
import { useEffect, useState } from "react";

export default function MenuView({ onSwitch }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(true), []);

  return (
    <div className={`p-4 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
      <h1 className="mb-4 text-2xl font-bold">Menú</h1>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {['Desayunos','Bowls','Platos','Sandwiches'].map((label) => (
          <div key={label} className="rounded-full bg-gray-200 px-3 py-1 text-sm">
            {label}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[1,2,3].map((n) => (
          <div key={n} className="h-20 w-full animate-pulse rounded bg-gray-200" />
        ))}
      </div>
      <button className="mt-6 text-blue-600 underline" onClick={onSwitch}>
        Ir a Tienda
      </button>
    </div>
  );
}

