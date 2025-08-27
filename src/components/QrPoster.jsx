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

      // Pequeña animación visual en el borde del QR/URL
      const el = document.querySelector(".qr-border");
      if (el) {
        el.classList.add("copied");
        setTimeout(() => el.classList.remove("copied"), 400);
      }

      if (typeof window !== "undefined")
        window.alert("URL copiada al portapapeles");
    } catch {
      if (typeof window !== "undefined")
        window.alert("No se pudo copiar. Copia manualmente: " + qrTarget);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-alto-beige p-6 text-alto-text print:bg-white">
      <div className="w-full max-w-md rounded-3xl border bg-white p-6 text-center shadow-xl print:border-0 print:shadow-none">
        <img
          src="/logoalto.png"
          alt="Alto Andino"
          className="mx-auto mb-3 h-20 w-20 object-contain"
        />
        <h1 className="text-lg font-extrabold">
          Menú QR {table ? `· Mesa ${table}` : ""}
        </h1>
        <p className="mb-4 text-xs text-neutral-600">
          {table ? "Escanéame para esta mesa" : "Escanéame para ver el menú"}
        </p>

        <div className="inline-block rounded-2xl border bg-white p-4 qr-fade qr-border">
          <QRCode value={qrTarget} size={220} />
        </div>

        <p
          className="mt-4 break-all text-[12px] qr-fade"
          style={{ animationDelay: "120ms" }}
        >
          {qrTarget}
        </p>

        <div className="no-print mt-5 flex justify-center gap-2">
          <button
            type="button"
            className="rounded-lg border bg-neutral-50 px-3 py-2 text-sm hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2"
            onClick={handleCopy}
          >
            Copiar URL
          </button>
          <button
            type="button"
            className="rounded-lg bg-alto-primary px-3 py-2 text-sm text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2"
            onClick={handlePrint}
          >
            Imprimir
          </button>
        </div>

        <p className="no-print mt-3 text-[10px] text-neutral-500">
          Hecho por Sebastian con GPT-5 Thinking ✨
        </p>
      </div>
    </div>
  );
}