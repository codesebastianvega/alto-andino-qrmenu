// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";
import "./index.css";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { BrandProvider } from "./context/BrandContext";
import { MenuDataProvider } from "./context/MenuDataContext";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Aluna Landing (lazy)
const AlunaLanding = React.lazy(() => import("./pages/AlunaLanding.jsx"));

// Superadmin Pages (lazy)
const SuperAdminLayout = React.lazy(() => import("./pages/superadmin/SuperAdminLayout.jsx"));
const SuperAdminMetrics = React.lazy(() => import("./pages/superadmin/SuperAdminMetrics.jsx"));
const SuperAdminBrands = React.lazy(() => import("./pages/superadmin/SuperAdminBrands.jsx"));
const SuperAdminBrandDetail = React.lazy(() => import("./pages/superadmin/SuperAdminBrandDetail.jsx"));
const SuperAdminPlans = React.lazy(() => import("./pages/superadmin/SuperAdminPlans.jsx"));
const SuperAdminSettings = React.lazy(() => import("./pages/superadmin/SuperAdminSettings.jsx"));

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

          {/* Superadmin Routes */}
          <Route path="/superadmin" element={
            <React.Suspense fallback={<div className="p-8">Cargando...</div>}>
              <SuperAdminLayout />
            </React.Suspense>
          }>
            <Route index element={
              <React.Suspense fallback={<div className="p-8">Cargando...</div>}>
                <SuperAdminMetrics />
              </React.Suspense>
            } />
            <Route path="brands" element={
              <React.Suspense fallback={<div className="p-8">Cargando...</div>}>
                <SuperAdminBrands />
              </React.Suspense>
            } />
            <Route path="brands/:id" element={
              <React.Suspense fallback={<div className="p-8">Cargando...</div>}>
                <SuperAdminBrandDetail />
              </React.Suspense>
            } />
            <Route path="plans" element={
              <React.Suspense fallback={<div className="p-8">Cargando...</div>}>
                <SuperAdminPlans />
              </React.Suspense>
            } />
            <Route path="settings" element={
              <React.Suspense fallback={<div className="p-8">Cargando...</div>}>
                <SuperAdminSettings />
              </React.Suspense>
            } />
          </Route>

          {/* Everything else: existing app (hash routing) */}
          <Route
            path="/*"
            element={
              <AuthProvider>
                <BrandProvider>
                  <MenuDataProvider>
                    <CartProvider>
                      <App />
                    </CartProvider>
                  </MenuDataProvider>
                </BrandProvider>
              </AuthProvider>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
