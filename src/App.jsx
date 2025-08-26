// src/App.jsx
import { useEffect, useMemo, useState } from "react";

// Layout / UI
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductLists from "./components/ProductLists";
import SearchBar from "./components/SearchBar";
import HeroHeadline from "./components/HeroHeadline";
import PromoBannerCarousel from "./components/PromoBannerCarousel";
import GuideModal from "./components/GuideModal";
import DietaryGuide from "./components/DietaryGuide";

// Carrito
import FloatingCartBar from "./components/FloatingCartBar";
import CartDrawer from "./components/CartDrawer";
import { useCart } from "./context/CartContext";
import { banners as buildBanners } from "./data/banners";
import {
  cats,
  breakfastItems,
  mainDishes,
  dessertBaseItems,
  preBowl,
  smoothies,
  funcionales,
  coffees,
  infusions,
  sodas,
  otherDrinks,
  sandwichItems,
  sandwichPriceByItem,
} from "./data/menuItems";
import { getStockState, slugify } from "./utils/stock";

// Póster QR
import QrPoster from "./components/QrPoster";
import Toast from "./components/Toast";

const FEATURE_TABS = import.meta.env.VITE_FEATURE_TABS === "1";
const VALID_CATEGORIES = ["todos", ...cats];

export default function App() {
  const [open, setOpen] = useState(false);
  const [openGuide, setOpenGuide] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const cart = useCart();
  const banners = buildBanners(import.meta.env);

  function handleCategorySelect(cat) {
    const slug = typeof cat === "string" ? cat : cat.id;
    setSelectedCategory(slug);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat && VALID_CATEGORIES.includes(cat)) setSelectedCategory(cat);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("cat", selectedCategory);
    window.history.replaceState(null, "", url);
    if (selectedCategory !== "todos") {
      const panelId = `panel-${selectedCategory}`;
      requestAnimationFrame(() => {
        document.getElementById(panelId)?.focus();
      });
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (!VALID_CATEGORIES.includes(selectedCategory)) {
      setSelectedCategory("todos");
    }
  }, [selectedCategory]);

  const productMap = useMemo(() => {
    const collections = [
      breakfastItems,
      mainDishes,
      dessertBaseItems,
      [preBowl],
      smoothies,
      funcionales,
      coffees,
      infusions,
      sodas,
      otherDrinks,
    ];
    if (sandwichItems && sandwichPriceByItem) {
      const mapped = sandwichItems.map((it) => {
        const mapping = sandwichPriceByItem[it.key];
        const price = mapping?.unico ?? mapping?.clasico ?? mapping?.grande;
        return { id: "sandwich:" + it.key, name: it.name, price, desc: it.desc };
      });
      collections.push(mapped);
    }
    const map = {};
    for (const col of collections) {
      if (!Array.isArray(col)) continue;
      for (const p of col) {
        const pid = p.id || p.productId;
        if (!pid) continue;
        const prod = {
          ...p,
          id: pid,
          productId: pid,
          name: p.name || p.title,
          title: p.title || p.name,
          subtitle: p.desc || p.subtitle,
          price: p.price,
          image: p.image,
        };
        const ids = [p.id, p.productId].filter(Boolean);
        if (ids.length === 0) ids.push(pid);
        for (const ident of ids) {
          map[ident] = prod;
        }
      }
    }
    return map;
  }, [
    breakfastItems,
    mainDishes,
    dessertBaseItems,
    preBowl,
    smoothies,
    funcionales,
    coffees,
    infusions,
    sodas,
    otherDrinks,
    sandwichItems,
    sandwichPriceByItem,
  ]);

  const counts = useMemo(() => {
    const count = (items = []) =>
      items.filter((p) => {
        const pid =
          p.id ||
          p.productId ||
          (p.key ? "sandwich:" + p.key : slugify(p.name));
        const st = getStockState(pid);
        return st === "ok" || st === "low";
      }).length;
    const result = {
      desayunos: count(breakfastItems),
      bowls: count([preBowl]),
      platos: count(mainDishes),
      sandwiches: count(
        sandwichItems?.map((it) => ({ id: "sandwich:" + it.key, name: it.name })) || []
      ),
      smoothies: count([...(smoothies || []), ...(funcionales || [])]),
      cafe: count([...(coffees || []), ...(infusions || [])]),
      bebidasfrias: count([...(sodas || []), ...(otherDrinks || [])]),
      postres: count(dessertBaseItems),
    };
    result.todos = Object.values(result).reduce((sum, n) => sum + n, 0);
    return result;
  }, [
    breakfastItems,
    preBowl,
    mainDishes,
    sandwichItems,
    smoothies,
    funcionales,
    coffees,
    infusions,
    sodas,
    otherDrinks,
    dessertBaseItems,
  ]);

  function resolveProductById(id) {
    if (!id) return null;
    return productMap[id] || null;
  }

  // ✅ Modo póster QR (?qr=1) – se muestra SOLO el QR
  const isQr = (() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("qr") === "1";
  })();
  if (isQr) {
    const publicUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    return <QrPoster url={publicUrl} />;
  }

  // ✅ Modo menú normal
  return (
    <div className="bg-alto-beige text-alto-text leading-snug">
      <Header onCartOpen={() => setOpen(true)} onGuideOpen={() => setOpenGuide(true)} />

      <div className="mx-auto max-w-3xl p-5 sm:p-6 md:p-8">
        <div className="mt-2 mb-6">
          <HeroHeadline />
          <SearchBar value={query} onQueryChange={setQuery} />
        </div>
        <PromoBannerCarousel items={banners} resolveProductById={resolveProductById} />
        <ProductLists
          query={query}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          counts={counts}
          featureTabs={FEATURE_TABS}
        />

        <Footer />

        {/* Barra flotante y Drawer del carrito */}
        <FloatingCartBar
          items={cart.items}
          total={cart.total}
          onOpen={() => setOpen(true)}
        />
        <CartDrawer open={open} onClose={() => setOpen(false)} />
      </div>

      <GuideModal open={openGuide} onClose={() => setOpenGuide(false)}>
        <DietaryGuide />
      </GuideModal>
      <Toast />
    </div>
  );
}
