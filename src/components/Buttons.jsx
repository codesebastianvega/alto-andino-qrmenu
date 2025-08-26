// Helper local para combinar clases sin depender de "clsx"
const cx = (...s) => s.filter(Boolean).join(" ");

export function Chip({ active, onClick, children, className = "", shape = "pill" }) {
  const rounded = shape === "card" ? "rounded-xl" : "rounded-full";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "px-3 py-1 text-sm border transition",
        active
          ? "bg-alto-primary text-white border-alto-primary shadow"
          : "bg-white text-neutral-800 border-neutral-300 hover:border-neutral-400",
        rounded,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Button({ variant = "primary", className = "", type = "button", ...props }) {
  const base = "btn " + (variant === "primary" ? "btn-primary" : "btn-outline");
  return (
    <button
      type={type}
      {...props}
      className={
        base +
        " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131] " +
        className
      }
    />
  );
}

// Botón de texto “Añadir” (no-FAB)
export function AddButton({
  children = "Añadir",
  className = "",
  disabled,
  onClick,
  type = "button",
  hideText = false,
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={hideText ? "Agregar" : undefined}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold shadow-sm transition select-none",
        "bg-[#2f4131] text-white hover:bg-[#243326]",
        "border border-black/10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]",
        "px-3 min-w-[90px] h-9 sm:h-8 w-auto",
        "active:translate-y-[1px]",
        "disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      {!hideText && <span>{children}</span>}
    </button>
  );
}

// FAB circular “+” (usado en cada card)
export function AddIconButton({ className = "", disabled = false, variant = "solid", ...props }) {
  const baseColor =
    variant === "light"
      ? "bg-white text-[#2f4131]"
      : "bg-[#2f4131] text-white";
  return (
    <button
      type="button"
      {...props}
      disabled={disabled}
      className={cx(
        // base shape & color
        "grid place-items-center rounded-full shadow-sm ring-1 ring-black/5",
        // sizes: 36px móvil / 32px >=sm
        "w-9 h-9 sm:w-8 sm:h-8",
        // motion & focus
        "transition will-change-transform hover:scale-105 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2f4131]",
        // disabled
        disabled && "opacity-40 cursor-not-allowed",
        baseColor,
        className
      )}
      aria-label={props["aria-label"] || "Agregar"}
    >
      <span aria-hidden className="-mt-[1px] text-xl leading-none">
        +
      </span>
    </button>
  );
}

/**
 * Inventory status chip.
 *
 * @param {string} [intent]
 *   Visual style: "warn", "error" or "neutral". Overrides `variant`.
 * @param {string} [variant="neutral"]
 *   Legacy prop kept for backward compatibility: "low", "soldout" or "neutral".
 * @param {string} [size="xs"]
 *   Chip size: "xs" (default) or "sm".
 */
export function StatusChip({
  intent,
  variant = "neutral",
  size = "xs",
  className = "",
  children,
}) {
  const intentMap = {
    warn: "bg-amber-50 text-amber-800 border-amber-300",
    error: "bg-red-50 text-red-800 border-red-300",
    neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
  };

  const variantMap = {
    low: "warn",
    soldout: "neutral",
    neutral: "neutral",
  };

  const sizeMap = {
    xs: "px-2 py-[3px] text-[11px]",
    sm: "px-3 py-1 text-sm",
  };

  const color = intentMap[intent || variantMap[variant] || "neutral"];
  const dimension = sizeMap[size] || sizeMap.xs;

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border leading-none font-medium",
        dimension,
        color,
        className
      )}
    >
      {children}
    </span>
  );
}

// Tamaños reutilizables para pills
export const PILL_XS = "h-7 px-2.5 text-xs";
export const PILL_SM = "h-8 px-3 text-sm";

export default AddButton;
