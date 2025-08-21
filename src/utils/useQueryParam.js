import { useMemo } from "react";

export function useQueryParam(name) {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return new URLSearchParams(window.location.search).get(name);
  }, [name, typeof window !== "undefined" ? window.location.search : null]);
}
