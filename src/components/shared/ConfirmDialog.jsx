// src/components/shared/ConfirmDialog.jsx
import React from "react";

export default function ConfirmDialog({
  open,
  title,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-80 rounded bg-white p-4 text-center">
        <p className="mb-4 text-sm">{title}</p>
        <div className="flex justify-center gap-4">
          <button
            className="rounded bg-gray-200 px-4 py-2 text-sm"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className="rounded bg-alto-primary px-4 py-2 text-sm text-white"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
