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
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold shadow-sm transition select-none",
        "bg-emerald-700 text-white hover:bg-emerald-800",
        "border border-emerald-800/10",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-300",
        "px-4 h-11 w-full sm:w-auto sm:h-10",
        "active:translate-y-px",
        "disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      <span>{children}</span>
    </button>
  );
}

export default AddButton;
