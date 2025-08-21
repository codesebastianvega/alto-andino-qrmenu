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

export function AddIconButton({ onClick, disabled, className = "", type = "button", ariaLabel = "Añadir" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        "grid place-items-center rounded-full shadow-sm border select-none transition",
        "bg-[#2f4131] text-white hover:bg-[#243326] border-black/10",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgba(47,65,49,0.3)]",
        "h-10 w-10 sm:h-9 sm:w-9",
        "active:translate-y-[1px]",
        "disabled:bg-neutral-200 disabled:text-neutral-500 disabled:border-neutral-200 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}

export default AddButton;
