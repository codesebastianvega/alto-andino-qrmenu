import clsx from "clsx";

export function Chip({ active, onClick, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={
        "px-3 py-1 rounded-full text-sm border transition " +
        (active
          ? "bg-alto-primary text-white border-alto-primary shadow"
          : "bg-white text-neutral-800 border-neutral-300 hover:border-neutral-400") +
        " " +
        className
      }
    >
      {children}
    </button>
  );
}
export function Button({ variant = "primary", className = "", ...props }) {
  const base = "btn " + (variant === "primary" ? "btn-primary" : "btn-outline");
  return <button {...props} className={base + " " + className} />;
}

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
      aria-label={hideText ? "Añadir" : undefined}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold shadow-sm transition select-none",
        "bg-[#2f4131] text-white hover:bg-[#243326]",
        "border border-black/10",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgba(47,65,49,0.3)]",
        "px-3 min-w-[90px] h-9 sm:h-8 w-auto",
        "active:translate-y-[1px]",
        "disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      {!hideText && <span>{children}</span>}
    </button>
  );
}

export function AddIconButton({ className = "", disabled = false, ...props }) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled}
      className={clsx(
        // base shape & color
        "grid place-items-center rounded-full bg-[#2f4131] text-white shadow-sm ring-1 ring-black/5",
        // sizes
        "w-9 h-9 sm:w-8 sm:h-8",
        // motion & focus
        "transition will-change-transform hover:scale-105 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(47,65,49,0.3)] focus-visible:ring-offset-2",
        // disabled
        disabled && "opacity-40 pointer-events-none",
        className
      )}
    >
      {/* Visual “+” y soporte de accesibilidad vía aria-label desde el padre */}
      <span aria-hidden className="-mt-[1px] text-xl leading-none">+</span>
    </button>
  );
}

export function StatusChip({ variant = "neutral", className = "", children }) {
  const map = {
    low: "bg-amber-50 text-amber-800 border-amber-300",
    soldout: "bg-neutral-100 text-neutral-700 border-neutral-200",
    neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-[3px] text-[11px] leading-none font-medium",
        map[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export default AddButton;
