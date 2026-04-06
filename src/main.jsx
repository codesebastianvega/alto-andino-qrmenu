// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
const LoginPage = React.lazy(() => import("./pages/auth/LoginPage.jsx"));
const RegisterPage = React.lazy(() => import("./pages/auth/RegisterPage.jsx"));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Aluna platform landing page at root */}
          <Route
            path="/"
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

          {/* Global Auth Routes */}
          <Route
            path="/login"
            element={
              <AuthProvider>
                <React.Suspense fallback={<div />}>
                  <LoginPage />
                </React.Suspense>
              </AuthProvider>
            }
          />
          <Route
            path="/registro"
            element={
              <AuthProvider>
                <React.Suspense fallback={<div />}>
                  <RegisterPage />
                </React.Suspense>
              </AuthProvider>
            }
          />

          {/* Superadmin Routes */}
          <Route path="/superadmin/*" element={
            <AuthProvider>
              <React.Suspense fallback={<div className="p-8 italic">Cargando panel de control...</div>}>
                <SuperAdminLayout />
              </React.Suspense>
            </AuthProvider>
          }>
            <Route index element={<SuperAdminMetrics />} />
            <Route path="brands" element={<SuperAdminBrands />} />
            <Route path="brands/:id" element={<SuperAdminBrandDetail />} />
            <Route path="plans" element={<SuperAdminPlans />} />
            <Route path="settings" element={<SuperAdminSettings />} />
          </Route>

          {/* Brand Experience: This route captures the brand slug and everything after */}
          <Route
            path="/:brand_slug/*"
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

          {/* Compatibility: If a hash is used at root without slug (old style), redirect or handler can be added here */}
          <Route path="/aluna" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>

  </React.StrictMode>,
);
