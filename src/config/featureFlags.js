function toBool(v) {
  const s = String(v ?? "").toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

export const FEATURE_TABS = toBool(import.meta.env.VITE_FEATURE_TABS);
export const PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL || "/";
