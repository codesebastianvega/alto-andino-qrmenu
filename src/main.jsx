// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";
import "./index.css";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { MenuDataProvider } from "./context/MenuDataContext";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Aluna Landing (lazy)
const AlunaLanding = React.lazy(() => import("./pages/AlunaLanding.jsx"));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Aluna platform landing page */}
          <Route
            path="/aluna"
            element={
              <React.Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D6A4F]"></div>
                </div>
              }>
                <AlunaLanding />
              </React.Suspense>
            }
          />
          {/* Everything else: existing app (hash routing) */}
          <Route
            path="/*"
            element={
              <AuthProvider>
                <MenuDataProvider>
                  <CartProvider>
                    <App />
                  </CartProvider>
                </MenuDataProvider>
              </AuthProvider>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
