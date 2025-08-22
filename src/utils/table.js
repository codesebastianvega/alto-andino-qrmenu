// src/utils/table.js
export function getTableId() {
  try {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    const t = params.get("t");
    if (t) {
      window.localStorage?.setItem("aa_table", t);
      return t;
    }
    return window.localStorage?.getItem("aa_table") || "";
  } catch {
    return "";
  }
}
