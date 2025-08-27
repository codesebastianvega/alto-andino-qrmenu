import { useLayoutEffect } from "react";

export function useLockBodyScroll(active) {
  useLayoutEffect(() => {
    if (!active) return;
    const { overflow, paddingRight } = document.documentElement.style;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    if (scrollBarWidth > 0) {
      document.documentElement.style.paddingRight = `${scrollBarWidth}px`;
    }
    return () => {
      document.documentElement.style.overflow = overflow || "";
      document.documentElement.style.paddingRight = paddingRight || "";
    };
  }, [active]);
}