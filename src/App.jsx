// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import { CATS, isValidCat } from "./constants/categories";

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
    const p = new URLSearchParams(window.location.search).get("cat");
    if (p && isValidCat(p)) setSelectedCategory(p);
  }, []);

  useEffect(() => {
    if (!isValidCat(selectedCategory)) setSelectedCategory("todos");
  }, [selectedCategory]);

  useEffect(() => {
    if (!FEATURE_TABS) return;
    const url = new URL(window.location.href);
    url.searchParams.set("cat", selectedCategory);
    window.history.replaceState(null, "", url);
  }, [FEATURE_TABS, selectedCategory]);

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
    result.todos = CATS.filter((c) => c !== "todos").reduce(
      (sum, cat) => sum + (result[cat] || 0),
      0
    );
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

  const hasFloatingCartBar = cart.items && cart.items.length > 0;

  // ✅ Modo menú normal
  return (
    <div className="bg-alto-beige text-alto-text leading-snug">
      <Header onCartOpen={() => setOpen(true)} onGuideOpen={() => setOpenGuide(true)} />

      <main
        className={`mx-auto max-w-3xl px-5 sm:px-6 md:px-8 pt-5 sm:pt-6 md:pt-8 ${
          hasFloatingCartBar ? "pb-24" : "pb-8"
        }`}
      >
        <div className="mt-2 mb-6">
          <HeroHeadline />
          <SearchBar value={query} onQueryChange={setQuery} />
        </div>
        <PromoBannerCarousel
          items={banners}
          resolveProductById={resolveProductById}
        />
        <ProductLists
          query={query}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          counts={counts}
          featureTabs={FEATURE_TABS}
        />

        <Footer />
      </main>

      {/* Barra flotante y Drawer del carrito */}
      <FloatingCartBar
        items={cart.items}
        total={cart.total}
        onOpen={() => setOpen(true)}
      />
      <CartDrawer open={open} onClose={() => setOpen(false)} />

      <GuideModal open={openGuide} onClose={() => setOpenGuide(false)}>
        <DietaryGuide />
      </GuideModal>
      <Toast />
    </div>
  );
}
