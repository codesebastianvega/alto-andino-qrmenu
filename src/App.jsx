// src/App.jsx
import { useState } from "react";

// Layout / UI
import Header from "./components/Header";
import Footer from "./components/Footer";
import Section from "./components/Section";

// Secciones
import { Breakfasts, Mains, Desserts } from "./components/ProductLists";
import Sandwiches from "./components/Sandwiches";
import SmoothiesSection from "./components/SmoothiesSection";
import CoffeeSection from "./components/CoffeeSection";
import BowlsSection from "./components/BowlsSection";

// Carrito
import FloatingCartBar from "./components/FloatingCartBar";
import CartDrawer from "./components/CartDrawer";
import { useCart } from "./context/CartContext";

// Póster QR
import QrPoster from "./components/QrPoster";

export default function App() {
  const [open, setOpen] = useState(false);
  const cart = useCart();

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
      <Header />

      <div className="mx-auto max-w-3xl p-5 sm:p-6 md:p-8">
        <Section title="Desayunos">
          <Breakfasts />
        </Section>
        <Section title="Bowls">
          <BowlsSection />
        </Section>
        <Section title="Platos Fuertes">
          <Mains />
        </Section>
        <Section title="Sándwiches">
          <Sandwiches />
        </Section>
        <Section title="Smoothies & Funcionales">
          <SmoothiesSection />
        </Section>
        <Section title="Café de especialidad">
          <CoffeeSection />
        </Section>
        <Section title="Postres">
          <Desserts />
        </Section>

        <Footer />

        {/* Barra flotante y Drawer del carrito */}
        <FloatingCartBar
          items={cart.items}
          total={cart.total}
          onOpen={() => setOpen(true)}
        />
        <CartDrawer open={open} onClose={() => setOpen(false)} />
      </div>
    </div>
  );
}
