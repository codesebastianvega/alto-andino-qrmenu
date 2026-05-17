// src/utils/table.js
import { safeStorage as localStorage } from "./safeStorage";

export function getTableId() {
  try {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    const t = params.get("t");
    if (t) {
      localStorage.setItem("aa_table", t);
      return t;
    }
    return localStorage.getItem("aa_table") || "";
  } catch {
    return "";
  }
}
