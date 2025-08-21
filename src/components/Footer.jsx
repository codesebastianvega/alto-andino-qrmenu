export default function Footer() {
  const ig = "https://www.instagram.com/altoandino";
  const wa = "https://wa.me/573222285900";
  const googleReview =
    "https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID"; // Reemplaza YOUR_PLACE_ID
  return (
    <footer className="pt-6 mt-8 border-t text-[11px] text-neutral-600">
      <div className="flex flex-wrap items-center gap-3">
        <a href={ig} target="_blank" rel="noreferrer" className="underline">
          Instagram
        </a>
        <span>·</span>
        <a href={wa} target="_blank" rel="noreferrer" className="underline">
          WhatsApp
        </a>
        <span>·</span>
        <a
          href={googleReview}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Déjanos tu reseña en Google
        </a>
      </div>
      <p className="mt-2">
        Carrera 15 # 1 – 111, San Pablo · Hecho con ❤️ por Alto Andino · App
        creada con GPT‑5 Thinking
      </p>
      <p className="mt-1">
        Precios en COP (IVA incluido). Vigencia agosto 2025.
      </p>
    </footer>
  );
}
