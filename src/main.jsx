import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import { CartProvider } from "./context/CartContext"; // ⟵ IMPORTANTE

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CartProvider>
      {" "}
      {/* ⟵ ENVUELVE TODA LA APP */}
      <App />
    </CartProvider>
  </React.StrictMode>
);
