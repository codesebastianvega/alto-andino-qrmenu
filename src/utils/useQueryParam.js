import { useMemo } from "react";
export function useQueryParam(name) {
  return useMemo(
    () => new URLSearchParams(window.location.search).get(name),
    [name]
  );
}
