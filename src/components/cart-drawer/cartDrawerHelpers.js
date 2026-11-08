import { supabase } from "@/config/supabase";
import { safeStorage as localStorage } from "@/utils/safeStorage";
import { toast as toastFn } from "../Toast";
import { translateGroup } from "@/utils/formatters";
import { formatCOP } from "@/utils/money";
import { getItemUnit } from "@/context/CartContext";
import { MILK_OPTIONS } from "@/config/milkOptions";

export const toast = {
  success: (msg) => toastFn(msg, { duration: 3000 }),
  error: (msg) => toastFn(msg, { duration: 4000 })
};

export const safeNum = (raw) => {
  const n = String(raw || "").replace(/\D/g, "");
  return n.startsWith("57") ? n : n ? `57${n}` : "";
};

export const getTable = () => {
  try {
    const sp = new URL(location.href).searchParams;
    const fromUrl = sp.get("mesa") || sp.get("t");
    if (fromUrl) return fromUrl;

    // Standardized localStorage key from App.jsx
    const persisted = localStorage.getItem("aa_current_mesa");
    if (persisted) return persisted;

    // Fallback to legacy keys
    for (const k of ["aa_table", "aa_table_num", "aa_t", "mesa", "table"]) {
      const v = localStorage.getItem(k);
      if (v) return v;
    }
    return "";
  } catch {
    return "";
  }
};

export const getLocationId = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlLoc = params.get("loc") || params.get("l") || params.get("location");
    if (urlLoc) return urlLoc;

    // Standardized localStorage key from App.jsx
    const persisted = localStorage.getItem("aa_current_location_id");
    if (persisted) return persisted;

    return "";
  } catch {
    return "";
  }
};

export const getTableCandidates = (rawTable) => {
  const original = String(rawTable || "").trim();
  if (!original) return [];

  const normalized = original.replace(/^mesa\s+/i, "").trim();
  const prefixed = `Mesa ${normalized}`;
  return [...new Set([original, normalized, prefixed].filter(Boolean))];
};

export const findTableRecord = async ({ mesa, brandId, locationId }) => {
  const candidates = getTableCandidates(mesa);
  if (!candidates.length || !brandId) return null;

  for (const candidate of candidates) {
    let query = supabase
      .from('restaurant_tables')
      .select('id, location_id')
      .eq('table_number', candidate)
      .eq('brand_id', brandId);

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data } = await query.maybeSingle();
    if (data) return data;
  }

  return null;
};

export const buildWaText = ({ items = [], total = 0, note = "", brandName = "Aluna" }) => {
  const mesa = getTable();
  const lines = [`*Pedido ${brandName}*`];
  if (mesa) lines.push(`Mesa: ${mesa}`);
  items.forEach((it, idx) => {
    const unit = getItemUnit(it);
    const qty = Number(it.qty || 1);
    const name = [it.name, it.variant].filter(Boolean).join(" · ");
    const itemTotal = unit * qty;
    lines.push(`• ${qty}× ${name} — ${formatCOP(itemTotal)}`);
    // Opciones por líneas
    const opts = it.options || {};
    if (Array.isArray(opts)) {
      if (opts.length) lines.push("  *Opciones:* " + opts.join(", "));
    } else {
      for (const [k, v] of Object.entries(opts)) {
        if (!v || (Array.isArray(v) && v.length === 0)) continue;
        const val = Array.isArray(v) ? v.join(", ") : v;
        lines.push(`  *${translateGroup(k)}:* ${val}`);
      }
    }
    if (it.milk) lines.push("  *Leche:* " + (MILK_OPTIONS.find((m) => m.id === it.milk)?.label || it.milk));
    if (it.note) lines.push("  _Nota:_ " + it.note);
    if (idx !== items.length - 1) lines.push("");
  });
  if (note) lines.push("_Nota general:_ " + note);
  lines.push("*Total:* " + formatCOP(total));
  return encodeURIComponent(lines.join("\n"));
};
