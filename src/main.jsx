// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./index.css";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { MenuDataProvider } from "./context/MenuDataContext";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <MenuDataProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </MenuDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
