// src/components/QrPoster.jsx
import QRCode from "react-qr-code";

export default function QrPoster({ url }) {
  const handlePrint = () => window.print();
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("URL copiada al portapapeles");
    } catch {
      alert("No se pudo copiar. Copia manualmente: " + url);
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
        <h1 className="text-lg font-extrabold">Menú QR</h1>
        <p className="text-xs text-neutral-600 mb-4">
          Escanéame para ver el menú
        </p>

        <div className="bg-white p-4 rounded-2xl border inline-block">
          <QRCode value={url} size={220} />
        </div>

        <p className="mt-4 text-[12px] break-all">{url}</p>

        <div className="mt-5 flex gap-2 justify-center no-print">
          <button
            className="px-3 py-2 rounded-lg border bg-neutral-50 hover:bg-neutral-100 text-sm"
            onClick={handleCopy}
          >
            Copiar URL
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-alto-primary text-white hover:opacity-90 text-sm"
            onClick={handlePrint}
          >
            Imprimir
          </button>
        </div>

        <p className="mt-3 text-[10px] text-neutral-500 no-print">
          Hecho con GPT-5 Thinking ✨
        </p>
      </div>
    </div>
  );
}
