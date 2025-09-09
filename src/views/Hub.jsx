// src/views/Hub.jsx
import { useState } from "react";
import { useAppState } from "../state/appState";
import ConfirmDialog from "../components/shared/ConfirmDialog";

export default function Hub({ onSelect }) {
  const {
    setMode,
    setArea,
    getIncompatibleItemsForMode,
    removeItemsByIds,
  } = useAppState();

  const [step, setStep] = useState(1);
  const [confirm, setConfirm] = useState({ open: false, mode: null, items: [] });

  const handleMode = (m) => {
    const incompatible = getIncompatibleItemsForMode(m);
    if (incompatible.length > 0) {
      setConfirm({ open: true, mode: m, items: incompatible });
    } else {
      setMode(m);
      setStep(2);
    }
  };

  const confirmChange = () => {
    removeItemsByIds(confirm.items);
    setMode(confirm.mode);
    setStep(2);
    setConfirm({ open: false, mode: null, items: [] });
  };

  const cancelChange = () => setConfirm({ open: false, mode: null, items: [] });

  const handleArea = (a) => {
    setArea(a);
    onSelect(a);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">

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
      <ConfirmDialog
        open={confirm.open}
        title={`Tienes ${confirm.items.length} ítems no compatibles con ${confirm.mode}. ¿Quitarlos y cambiar, o cancelar?`}
        confirmText="Quitar y cambiar"
        cancelText="Cancelar"
        onConfirm={confirmChange}
        onCancel={cancelChange}
      />
    </div>
  );
}

