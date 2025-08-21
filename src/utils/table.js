// src/utils/table.js
// Lee el número de mesa (?t=) de la URL y lo recuerda en localStorage.
export function getTableId() {
  try {
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
