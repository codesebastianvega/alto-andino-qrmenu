// src/views/Hub.jsx
import { useEffect, useState } from "react";
import { useAppState } from "../state/appState";

export default function Hub({ onSelect }) {
  const { setMode, setArea } = useAppState();
  const params = new URLSearchParams(window.location.search);
  const mesa = params.get("mesa");

  const [step, setStep] = useState(mesa ? 2 : 1);

  useEffect(() => {
    if (mesa) {
      setMode("mesa");
      setArea("menu");
    }
  }, [mesa, setMode, setArea]);

  const handleMode = (m) => {
    setMode(m);
    setStep(2);
  };

  const handleArea = (a) => {
    setArea(a);
    onSelect(a);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      {mesa && (
        <div className="mb-4 rounded bg-gray-200 px-4 py-2 text-lg font-semibold">
          Mesa #{mesa}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="mb-2 text-xl font-bold">Elige cómo ordenar</h2>
          <div className="flex flex-col gap-2">
            <button
              className="rounded bg-green-600 px-6 py-3 text-white"
              onClick={() => handleMode("mesa")}
            >
              Mesa
            </button>
            <button
              className="rounded bg-green-600 px-6 py-3 text-white"
              onClick={() => handleMode("pickup")}
            >
              Recoger
            </button>
            <button
              className="rounded bg-green-600 px-6 py-3 text-white"
              onClick={() => handleMode("delivery")}
            >
              Domicilio
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="mb-2 text-xl font-bold">¿Qué quieres ver?</h2>
          <div className="flex flex-col gap-2">
            <button
              className="rounded bg-blue-600 px-6 py-3 text-white"
              onClick={() => handleArea("menu")}
            >
              Menú
            </button>
            <button
              className="rounded bg-blue-600 px-6 py-3 text-white"
              onClick={() => handleArea("tienda")}
            >
              Tienda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

