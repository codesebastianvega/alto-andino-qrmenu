import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children, targetId = "modal-root" }) {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      let el = document.getElementById(targetId);

      // Si no existe, lo creamos y lo agregamos al body
      if (!el) {
        el = document.createElement("div");
        el.id = targetId;
        document.body.appendChild(el);
      }

      setTarget(el);
    }
  }, [targetId]);

  return target ? createPortal(children, target) : null;
}