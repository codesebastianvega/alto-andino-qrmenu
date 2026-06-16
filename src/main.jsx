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
import { LocationProvider } from "./context/LocationContext";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Aluna Landing (lazy)
const AlunaLanding = React.lazy(() => import("./pages/AlunaLanding.jsx"));

// Superadmin Route Guard & Pages (lazy)
const SuperAdminRoute = React.lazy(() => import("./components/SuperAdminRoute.jsx"));
const SuperAdminLayout = React.lazy(() => import("./pages/superadmin/SuperAdminLayout.jsx"));
const SuperAdminMetrics = React.lazy(() => import("./pages/superadmin/SuperAdminMetrics.jsx"));
const SuperAdminBrands = React.lazy(() => import("./pages/superadmin/SuperAdminBrands.jsx"));
const SuperAdminBrandDetail = React.lazy(() => import("./pages/superadmin/SuperAdminBrandDetail.jsx"));
const SuperAdminLeads = React.lazy(() => import("./pages/superadmin/SuperAdminLeads.jsx"));
const SuperAdminUsers = React.lazy(() => import("./pages/superadmin/SuperAdminUsers.jsx"));
const SuperAdminPlans = React.lazy(() => import("./pages/superadmin/SuperAdminPlans.jsx"));
const SuperAdminSettings = React.lazy(() => import("./pages/superadmin/SuperAdminSettings.jsx"));
const LoginPage = React.lazy(() => import("./pages/auth/LoginPage.jsx"));
const RegisterPage = React.lazy(() => import("./pages/auth/RegisterPage.jsx"));
const CompleteProfilePage = React.lazy(() => import("./pages/auth/CompleteProfilePage.jsx"));
const UniversalCheckout = React.lazy(() => import("./pages/checkout/UniversalCheckout.jsx"));

ReactDOM.createRoot(document.getElementById("root")).render(
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <LocationProvider>
            <Routes>
              {/* Aluna platform entry point */}
              <Route
                path="/"
                element={
                  <BrandProvider>
                    <MenuDataProvider>
                      <CartProvider>
                        <App />
                      </CartProvider>
                    </MenuDataProvider>
                  </BrandProvider>
                }
              />

              {/* Global Checkout Route */}
              <Route
                path="/checkout"
                element={
                  <BrandProvider>
                    <MenuDataProvider>
                      <CartProvider>
                        <React.Suspense fallback={<div />}>
                          <UniversalCheckout />
                        </React.Suspense>
                      </CartProvider>
                    </MenuDataProvider>
                  </BrandProvider>
                }
              />

              {/* Global Auth Routes */}
              <Route
                path="/login"
                element={
                  <React.Suspense fallback={<div />}>
                    <LoginPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/registro"
                element={
                  <React.Suspense fallback={<div />}>
                    <RegisterPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/completar-registro"
                element={
                  <React.Suspense fallback={<div />}>
                    <CompleteProfilePage />
                  </React.Suspense>
                }
              />

              {/* Superadmin Routes — Protected by SuperAdminRoute guard */}
              <Route path="/superadmin/*" element={
                <React.Suspense fallback={<div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><div className="text-white/40 animate-pulse">Cargando panel de control...</div></div>}>
                  <SuperAdminRoute>
                    <SuperAdminLayout />
                  </SuperAdminRoute>
                </React.Suspense>
              }>
                <Route index element={<SuperAdminMetrics />} />
                <Route path="leads" element={<SuperAdminLeads />} />
                <Route path="brands" element={<SuperAdminBrands />} />
                <Route path="brands/:id" element={<SuperAdminBrandDetail />} />
                <Route path="users" element={<SuperAdminUsers />} />
                <Route path="plans" element={<SuperAdminPlans />} />
                <Route path="settings" element={<SuperAdminSettings />} />
              </Route>

              {/* Brand Experience: This route captures the brand slug and everything after */}
              <Route
                path="/:brand_slug/*"
                element={
                  <BrandProvider>
                    <MenuDataProvider>
                      <CartProvider>
                        <App />
                      </CartProvider>
                    </MenuDataProvider>
                  </BrandProvider>
                }
              />

              {/* Compatibility: If a hash is used at root without slug (old style), redirect or handler can be added here */}
              <Route path="/aluna" element={<Navigate to="/alto-andino?demo=1" replace />} />
            </Routes>
          </LocationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>,
);
