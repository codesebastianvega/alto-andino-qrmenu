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

// QR
import QrPoster from "./components/QrPoster";
import useQueryParam from "./utils/useQueryParam";

export default function App() {
  const [open, setOpen] = useState(false);
  const cart = useCart();

  // 🔹 Modo póster QR: si la URL viene con ?qr=1, mostramos solo el QR
  const isQr = useQueryParam("qr") === "1";
  if (isQr) {
    const publicUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    return <QrPoster url={publicUrl} />;
  }

  // 🔹 Modo menú normal
  return (
    <div className="mx-auto max-w-3xl bg-alto-beige text-alto-text p-5 sm:p-6 md:p-8 leading-snug">
      <Header />

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

      <FloatingCartBar
        count={cart.count}
        total={cart.total}
        onOpen={() => setOpen(true)}
      />
      {open && <CartDrawer onClose={() => setOpen(false)} />}
    </div>
  );
}
