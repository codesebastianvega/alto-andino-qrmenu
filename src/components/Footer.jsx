// src/components/Footer.jsx

// Enlaces configurables (puedes moverlos a variables de entorno en Vercel)
const IG_URL =
  import.meta.env.VITE_INSTAGRAM_URL ||
  "https://instagram.com/altoandinozipaquira";
const PHONE = import.meta.env.VITE_WHATSAPP || "573222285900"; // 57 + número sin + ni espacios
const REVIEWS_URL =
  import.meta.env.VITE_GOOGLE_REVIEWS_URL ||
  "https://g.page/r/CUlqcqk_KCXBEBM/review";

// Botón "suave" reutilizable, con icono a la izquierda y estilos coherentes
function SoftButton({ href, onClick, children, className = "", ariaLabel }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold " +
    "border shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2";
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={`${base} ${className}`}
    >
      {children}
    </a>
  ) : (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${base} ${className}`}
    >
      {children}
    </button>
  );
}

export default function Footer() {
  return (
    <footer className="mt-10 pt-8 pb-24 text-center border-t border-neutral-200">
      <p className="text-sm text-alto-text">
        <span className="font-semibold">¿Te gustó la experiencia?</span>{" "}
        Síguenos o déjanos tu reseña — ¡nos ayudas un montón!
      </p>

      {/* Botones coherentes con la paleta: IG (neutro), WA (verde suave), Reviews (ámbar suave) */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {/* Instagram — neutro elegante */}
        <SoftButton
          href={IG_URL}
          ariaLabel="Abrir Instagram de Alto Andino"
          className="border-neutral-300 bg-white/90 text-alto-text hover:bg-white focus:ring-neutral-300"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4.2" />
            <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
          </svg>
          <span>Instagram</span>
        </SoftButton>

        {/* WhatsApp — verde suave coherente con la marca */}
        <SoftButton
          href={`https://wa.me/${PHONE}`}
          ariaLabel="Abrir WhatsApp de Alto Andino"
          className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus:ring-emerald-300"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M20.5 3.5A10.5 10.5 0 0 0 3.4 18.1L2 22l4-1.3A10.5 10.5 0 1 0 20.5 3.5ZM12 20a8 8 0 1 1 6.6-3.4l-.4.5.9 2.8-2.9-.9-.5.3A8 8 0 0 1 12 20Zm4.6-6.2c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.6.1c-.2.2-.7.8-.8.9-.1.1-.3.1-.5 0s-1-.4-1.9-1.2c-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.3.1-.5l.4-.6c.1-.1.1-.3 0-.5-.1-.2-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.7 1.1 2.9c.1.2 2 3.1 4.8 4.3.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3Z" />
          </svg>
          <span>WhatsApp</span>
        </SoftButton>

        {/* Reseñas — ámbar suave (estética cálida/greige) */}
        <SoftButton
          href={REVIEWS_URL}
          ariaLabel="Abrir reseñas en Google"
          className="border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 focus:ring-amber-300"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="m12 2 2.6 6.7 7.1.5-5.4 4.4 1.8 6.9L12 17.8 5.9 20.5l1.8-6.9L2.3 9.2l7.1-.5L12 2z" />
          </svg>
          <span>Reseñas</span>
        </SoftButton>
      </div>

      <p className="mt-5 text-[11px] text-neutral-500">
        Diseñado por Sebas (UXIO) y desarrollado con{" "}
        <span className="font-semibold">GPT-5 Thinking</span> ✨
      </p>
    </footer>
  );
}
