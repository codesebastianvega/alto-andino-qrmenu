import React, { useEffect, useState } from "react";
function getCartBarHeight() {
  try {
    const el = document.querySelector("[data-aa-cartbar]");
    return el ? el.offsetHeight : 0;
  } catch { return 0; }
}
export default function Toast() {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const update = () => setOffset(getCartBarHeight());
    update();
    const ro = new ResizeObserver(update);
    const target = document.querySelector("[data-aa-cartbar]");
    if (target) ro.observe(target);
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("resize", update); ro.disconnect(); };
  }, []);

  useEffect(() => {
    const onToast = (e) => {
      const text = e?.detail?.message || "Añadido al carrito";
      setMsg(text);
      setShow(true);
      const id = setTimeout(() => setShow(false), 1600);
      return () => clearTimeout(id);
    };
    document.addEventListener("aa:toast", onToast);
    return () => document.removeEventListener("aa:toast", onToast);
  }, []);

  return (
    <div
      aria-live="polite"
      className={[
        "fixed left-1/2 -translate-x-1/2 z-[120]",
        "transition-transform duration-200",
        show ? "translate-y-0" : "translate-y-8",
      ].join(" ")}
      style={{ bottom: `calc(${offset}px + env(safe-area-inset-bottom, 0px) + 10px)` }}
    >
      <div className="rounded-full bg-[#2f4131] text-white px-4 h-9 grid place-items-center shadow-2xl ring-1 ring-black/10">
        <span className="text-sm font-medium">{msg}</span>
      </div>
    </div>
  );
}
export const toast = (message) => {
  try { document.dispatchEvent(new CustomEvent("aa:toast", { detail: { message } })); } catch {}
};
