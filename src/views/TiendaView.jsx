// src/views/TiendaView.jsx
import { useEffect, useState } from "react";
import { fetchCategories, fetchProducts } from "@/services/catalog";
import { useAppState } from "@/state/appState";
import { formatCOP } from "@/utils/money";

const PLACEHOLDER_IMG =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const MODE_BADGES = {
  delivery: "No va a domicilio",
  mesa: "Solo para llevar/entrega",
  pickup: "No disponible para recoger",
};

export default function TiendaView({ onSwitch }) {
  const {
    categories,
    products,
    setCategories,
    setProducts,
    mode,
    tableId,
  } = useAppState();

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [onlyCompatible, setOnlyCompatible] = useState(false);

  useEffect(() => setVisible(true), []);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const [cats, prods] = await Promise.all([
          fetchCategories({ type: "retail" }),
          fetchProducts({ type: "retail" }),
        ]);
        if (active) {
          setCategories(cats);
          setProducts(prods);
        }
      } catch (e) {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [setCategories, setProducts]);

  useEffect(() => {
    setVisibleCount(20);
  }, [query, cat]);

  const shopCategories = categories.filter((c) =>
    products.some((p) => p.type === "retail" && p.category_id === c.id)
  );

  const filtered = products
    .filter((p) => p.type === "retail")
    .filter((p) => (cat ? p.category_id === cat : true))
    .filter((p) => {
      const t = query.toLowerCase();
      return (
        p.name.toLowerCase().includes(t) ||
        (p.tags || []).some((tag) => tag.toLowerCase().includes(t))
      );
    })
    .filter((p) =>
      onlyCompatible ? (p.fulfillment_modes || []).includes(mode) : true
    );

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        setVisibleCount((v) => Math.min(v + 20, filtered.length));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [filtered.length]);

  const visibleProducts = filtered.slice(0, visibleCount);

  const handleImgError = (e) => {
    if (e.currentTarget.dataset.fallback) return;
    e.currentTarget.dataset.fallback = "1";
    e.currentTarget.src = PLACEHOLDER_IMG;
  };

  return (
    <div
      className={`p-4 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <h1 className="mb-4 text-2xl font-bold">Tienda</h1>
      {mode === "mesa" && tableId && (
        <div className="mb-4 rounded bg-gray-200 px-4 py-2 text-center">
          Mesa {tableId}
        </div>
      )}

      {error && (
        <div className="mb-4 text-center text-sm text-red-600">
          En mantenimiento
        </div>
      )}

      <input
        type="search"
        placeholder="Buscar…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 w-full rounded border border-black/10 p-2"
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCat(null)}
          className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${
            cat === null
              ? "bg-alto-primary text-white"
              : "bg-gray-200 text-gray-900"
          }`}
        >
          Todos
        </button>
        {shopCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${
              cat === c.id
                ? "bg-alto-primary text-white"
                : "bg-gray-200 text-gray-900"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <label className="mb-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={onlyCompatible}
          onChange={(e) => setOnlyCompatible(e.target.checked)}
        />
        Mostrar solo compatibles
      </label>

      {loading && (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-24 w-full animate-pulse rounded bg-gray-200"
            />
          ))}
        </div>
      )}

      {!loading && visibleProducts.length === 0 && (
        <div className="text-center text-sm text-neutral-500">
          No hay productos.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {visibleProducts.map((p) => {
          const unavailable = !p.is_available || p.stock <= 0;
          const img = p.image_url || `/img/products/${p.slug || p.id}.jpg`;
          const compatible = (p.fulfillment_modes || []).includes(mode);
          const badge = MODE_BADGES[mode];
          return (
            <div
              key={p.id}
              className="relative rounded-lg border border-black/5 bg-white p-2 shadow-sm"
            >
              <img
                src={img}
                alt={p.name}
                onError={handleImgError}
                className="h-24 w-full rounded object-cover"
              />
              {unavailable && (
                <span className="absolute left-0 top-0 rounded-br bg-black/70 px-2 py-1 text-xs text-white">
                  Agotado
                </span>
              )}
              {!compatible && (
                <span className="absolute right-0 top-0 rounded-bl bg-black/70 px-2 py-1 text-xs text-white">
                  {badge}
                </span>
              )}
              <div className="mt-2">
                <h3 className="text-sm font-medium">{p.name}</h3>
                <div className="text-xs text-neutral-600">
                  {p.unit} · Stock: {p.stock}
                </div>
                <div className="mt-1 text-sm font-semibold">
                  {formatCOP(p.price_cop)}
                </div>
              </div>
              <button
                disabled={unavailable || !compatible}
                title={!compatible ? badge : undefined}
                className={`mt-2 w-full rounded-full px-3 py-1 text-sm ${
                  unavailable || !compatible
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-alto-primary text-white"
                }`}
              >
                Agregar
              </button>
            </div>
          );
        })}
      </div>

      <button className="mt-6 text-blue-600 underline" onClick={onSwitch}>
        Ir al Menú
      </button>
    </div>
  );
}

