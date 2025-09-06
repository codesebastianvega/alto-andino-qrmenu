// src/views/MenuView.jsx
import { useEffect, useState } from "react";
import { fetchCategories, fetchProducts } from "@/services/catalog";
import { useAppState } from "@/state/appState";
import { formatCOP } from "@/utils/money";

const PLACEHOLDER_IMG =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export default function MenuView({ onSwitch }) {
  const {
    categories,
    products,
    setCategories,
    setProducts,
  } = useAppState();

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState(null);
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => setVisible(true), []);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const [cats, prods] = await Promise.all([
          fetchCategories({ type: "prepared" }),
          fetchProducts({ type: "prepared" }),
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

  const menuCategories = categories.filter((c) =>
    products.some((p) => p.type === "prepared" && p.category_id === c.id)
  );

  const filtered = products
    .filter((p) => p.type === "prepared")
    .filter((p) => (cat ? p.category_id === cat : true))
    .filter((p) => {
      const t = query.toLowerCase();
      return (
        p.name.toLowerCase().includes(t) ||
        (p.tags || []).some((tag) => tag.toLowerCase().includes(t))
      );
    });

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
      <h1 className="mb-4 text-2xl font-bold">Menú</h1>

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
        {menuCategories.map((c) => (
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

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-20 w-full animate-pulse rounded bg-gray-200"
            />
          ))}
        </div>
      )}

      {!loading && visibleProducts.length === 0 && (
        <div className="text-center text-sm text-neutral-500">
          No hay productos.
        </div>
      )}

      <div className="space-y-4">
        {visibleProducts.map((p) => {
          const unavailable = !p.is_available || p.stock <= 0;
          const img = p.image_url || `/img/products/${p.slug || p.id}.jpg`;
          return (
            <div
              key={p.id}
              className="relative flex gap-4 rounded-lg border border-black/5 bg-white p-3 shadow-sm"
            >
              <img
                src={img}
                alt={p.name}
                onError={handleImgError}
                className="h-20 w-20 flex-shrink-0 rounded object-cover"
              />
              {unavailable && (
                <span className="absolute left-0 top-0 rounded-br bg-black/70 px-2 py-1 text-xs text-white">
                  Agotado
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-medium">{p.name}</h3>
                <div className="text-sm text-neutral-600">
                  {formatCOP(p.price_cop)}
                </div>
              </div>
              <button
                disabled={unavailable}
                className={`self-center rounded-full px-3 py-1 text-sm ${
                  unavailable
                    ? "bg-gray-300 text-gray-500"
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
        Ir a Tienda
      </button>
    </div>
  );
}

