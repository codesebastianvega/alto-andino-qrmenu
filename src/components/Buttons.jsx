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
