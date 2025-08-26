// src/components/QrPoster.jsx
import QRCode from "react-qr-code";

export default function QrPoster({ url }) {
  // Lee ?t= de la URL para “Mesa”
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const table = params?.get("t") || "";
  // Si viene mesa, el QR apunta a url?t=XX; si no, a url “pelado”
  const qrTarget = table ? `${url}?t=${encodeURIComponent(table)}` : url;

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };
  const handleCopy = async () => {
    try {
      await navigator?.clipboard?.writeText(qrTarget);
      if (typeof window !== "undefined") window.alert("URL copiada al portapapeles");
    } catch {
      if (typeof window !== "undefined")
        window.alert("No se pudo copiar. Copia manualmente: " + qrTarget);
    }
  };

  return (
    <div className="min-h-screen bg-alto-beige text-alto-text flex items-center justify-center p-6 print:bg-white">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border p-6 text-center print:shadow-none print:border-0">
        <img
          src="/logoalto.png"
          alt="Alto Andino"
          className="h-20 w-20 mx-auto mb-3 object-contain"
        />
        <h1 className="text-lg font-extrabold">
          Menú QR {table ? `· Mesa ${table}` : ""}
        </h1>
        <p className="text-xs text-neutral-600 mb-4">
          {table ? "Escanéame para esta mesa" : "Escanéame para ver el menú"}
        </p>

        <div className="bg-white p-4 rounded-2xl border inline-block">
          <QRCode value={qrTarget} size={220} />
        </div>

        <p className="mt-4 text-[12px] break-all">{qrTarget}</p>

        <div className="mt-5 flex gap-2 justify-center no-print">
          <button
            type="button"
            className="px-3 py-2 rounded-lg border bg-neutral-50 hover:bg-neutral-100 text-sm"
            onClick={handleCopy}
          >
            Copiar URL
          </button>
          <button
            type="button"
            className="px-3 py-2 rounded-lg bg-alto-primary text-white hover:opacity-90 text-sm"
            onClick={handlePrint}
          >
            Imprimir
          </button>
        </div>

        <p className="mt-3 text-[10px] text-neutral-500 no-print">
          Hecho por Sebastian con GPT-5 Thinking ✨
        </p>
      </div>
    </div>
  );
}
