import React, { useEffect, useMemo, useState } from "react";
import * as menu from "../data/menuItems";
import stock from "../data/stock.json";
import { slugify } from "../utils/stock";

function gatherCatalog() {
  const items = [];
  const push = (id, name, category) => items.push({ id: String(id), name: String(name || id), category });
  const addArray = (arr = [], cat) => {
    for (const it of arr) push(it?.id || slugify(it?.name || ""), it?.name, cat);
  };
  addArray(menu.breakfastItems, "desayunos");
  addArray(menu.breakfastAdditions, "desayunos");
  addArray(menu.mainDishes, "platos");
  addArray(menu.dessertBaseItems, "postres");
  addArray(menu.smoothies, "smoothies");
  addArray(menu.funcionales, "smoothies");
  addArray(menu.coffees, "cafe");
  addArray(menu.teasAndChai, "cafe");
  addArray(menu.infusions, "cafe");
  addArray(menu.moreInfusions, "cafe");
  addArray(menu.sodas, "bebidasfrias");
  addArray(menu.otherDrinks, "bebidasfrias");
  addArray(menu.sandwichTraditionals, "sandwiches");
  addArray(menu.sandwichAdditions, "sandwiches");
  if (Array.isArray(menu.sandwichItems)) {
    for (const it of menu.sandwichItems)
      push(`sandwich:${it?.key || slugify(it?.name || "")}`, it?.name, "sandwiches");
  }
  if (Array.isArray(menu.cumbreFlavors)) {
    for (const f of menu.cumbreFlavors) push(`cumbre:${f?.id}`, `Cumbre Andino — ${f?.label}`, "postres");
  }
  push("bowl-personalizado", "Bowl personalizado", "bowls");
  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

function download(filename, text) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function StockAdmin() {
  const catalog = useMemo(gatherCatalog, []);
  const categories = useMemo(() => {
    const cats = new Set(["todas"]);
    catalog.forEach((c) => cats.add(c.category || "otros"));
    return Array.from(cats);
  }, [catalog]);
  const [filterCat, setFilterCat] = useState("todas");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState(() => {
    const base = Object.fromEntries(catalog.map((it) => [it.id, "in"]));
    const current = (stock && stock.products) || {};
    return { ...base, ...current };
  });

  const setState = (id, state) =>
    setProducts((prev) => ({
      ...prev,
      [id]: state === "in" ? true : state === "out" ? false : state,
    }));

  const normalizeState = (value) => {
    if (value === "low" || value === "soon") return value;
    if (value === false || value === "out") return "out";
    return "in";
  };

  const json = useMemo(
    () => JSON.stringify({ products }, null, 2),
    [products]
  );

  useEffect(() => {
    // Intentar precargar desde localStorage para continuar sesiones previas
    try {
      const raw = localStorage.getItem("aa_stock_admin");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.products) setProducts({ ...products, ...parsed.products });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("aa_stock_admin", json);
    } catch {}
  }, [json]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((it) => {
      const okCat = filterCat === "todas" || it.category === filterCat;
      if (!okCat) return false;
      if (!q) return true;
      return it.id.toLowerCase().includes(q) || String(it.name || "").toLowerCase().includes(q);
    });
  }, [catalog, query, filterCat]);

  const counts = useMemo(() => {
    const acc = { in: 0, low: 0, soon: 0, out: 0 };
    for (const id of Object.keys(products)) {
      const state = normalizeState(products[id]);
      acc[state] = (acc[state] || 0) + 1;
    }
    return acc;
  }, [products]);

  const onImport = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed && parsed.products && typeof parsed.products === "object") {
          setProducts((prev) => ({ ...prev, ...parsed.products }));
        }
      } catch {}
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-bold">Administrador de Stock (solo local)</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Marca cada producto como disponible (in), pocas unidades (low) o agotado (out). Luego descarga el
        JSON y reemplaza <code>src/data/stock.json</code> en el repo.
      </p>

      <div className="sticky top-0 z-10 mt-3 rounded-lg bg-white/80 p-3 backdrop-blur-md ring-1 ring-black/5">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Buscar por nombre o ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-[220px] flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="rounded-md border px-2 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input type="file" accept="application/json" onChange={(e) => onImport(e.target.files?.[0])} />
            Importar JSON
          </label>
          <div className="ml-auto hidden text-xs text-neutral-700 sm:block">
            in: {counts.in} · low: {counts.low} · soon: {counts.soon} · out: {counts.out}
          </div>
          <button
            type="button"
            className="rounded-md bg-[#2f4131] px-3 py-2 text-sm font-semibold text-white hover:bg-[#263729]"
            onClick={() => download("stock.json", json)}
          >
            Descargar stock.json
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map((it) => (
          <div key={it.id} className="rounded-xl bg-white p-3 ring-1 ring-black/5">
            <div className="text-sm font-medium text-neutral-900">{it.name}</div>
            <div className="text-[12px] font-mono text-neutral-600">{it.id}</div>
            <div className="mt-2 flex gap-2">
              {[
                { k: "in", label: "in" },
                { k: "low", label: "low" },
                { k: "soon", label: "soon" },
                { k: "out", label: "out" },
              ].map((opt) => {
                const current = normalizeState(products[it.id]);
                return (
                <button
                  key={opt.k}
                  type="button"
                  className={[
                    "rounded-md px-2 py-1 text-xs ring-1",
                    current === opt.k
                      ? "bg-[#2f4131] text-white ring-[#2f4131]"
                      : "bg-white text-neutral-800 ring-neutral-300 hover:bg-neutral-50",
                  ].join(" ")}
                  onClick={() => setState(it.id, opt.k)}
                >
                  {opt.label}
                </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-neutral-900">Preview JSON</h2>
        <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-neutral-900 p-3 text-xs text-neutral-100">{json}</pre>
      </div>
    </div>
  );
}
