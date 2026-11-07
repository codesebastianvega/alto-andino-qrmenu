import React from "react";
import { supabase } from "@/config/supabase";
import { translateGroup } from "@/utils/formatters";
import { MILK_OPTIONS } from "@/config/milkOptions";
import { toast as toastFn } from "@/components/Toast";
import { safeStorage as localStorage, safeSessionStorage as sessionStorage } from "@/utils/safeStorage";

export const cartToast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 3000, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts })
};

export const getTable = () => {
  try {
    const sp = new URL(location.href).searchParams;
    const fromUrl = sp.get("mesa") || sp.get("t");
    if (fromUrl) return fromUrl;

    const sess = sessionStorage.getItem("aa_current_mesa");
    if (sess) return sess;

    for (const k of ["aa_table", "aa_table_num", "aa_t", "mesa", "table"]) {
      const v = localStorage.getItem(k);
      if (v) return v;
    }
    return "";
  } catch {
    return "";
  }
};

export const getLocationId = (brandId) => {
  try {
    // 1. URL search params (most fresh)
    const params = new URLSearchParams(window.location.search);
    const urlLoc = params.get("loc");
    if (urlLoc) return urlLoc;

    // 2. Session storage (persisted for the visit)
    const sess = sessionStorage.getItem("aa_current_location_id");
    if (sess) return sess;
    
    return "";
  } catch {
    return "";
  }
};

export const getTableCandidates = (rawTable) => {
  const original = String(rawTable || "").trim();
  if (!original) return [];

  const normalized = original.replace(/^mesa\s+/i, "").trim();
  return [...new Set([original, normalized].filter(Boolean))];
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

export const renderOptionsPills = (opts) => {
  if (!opts) return null;
  const parts = [];
  if (Array.isArray(opts)) {
    parts.push(...opts);
  } else if (typeof opts === "object") {
    for (const [k, v] of Object.entries(opts)) {
      if (Array.isArray(v)) {
        if (v.length > 0) {
          parts.push(`${translateGroup(k)}: ${v.join(", ")}`);
        }
      } else if (v) {
        parts.push(`${translateGroup(k)}: ${v}`);
      }
    }
  }
  
  if (!parts.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {parts.map((p, i) => (
        <span
          key={i}
          className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-[11px] lg:text-xs font-semibold text-stone-600 ring-1 ring-inset ring-stone-200/80 shadow-xs"
        >
          {p}
        </span>
      ))}
    </div>
  );
};

export const getMilkLabel = (milkId) => {
  return MILK_OPTIONS.find((m) => m.id === milkId)?.label || milkId;
};
