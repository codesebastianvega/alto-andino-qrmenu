import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMenuData } from '../context/MenuDataContext';
import { getProductImage } from '../utils/images';
import { draftKey } from '../components/admin/boku-flyer/flyerDraft';
import BokuFlyerBuilder from '../components/admin/boku-flyer/BokuFlyerBuilder';

export default function AdminBokuFlyer() {
  const { activeBrand, user } = useAuth();
  const { brand, getAllProducts, loading, restaurantSettings } = useMenuData();
  const products = useMemo(() => getAllProducts().map(p => ({ ...p, image_url: getProductImage(p) })), [getAllProducts]);
  if ((activeBrand?.slug || brand?.slug) !== 'boku-bento') return <p className="p-6 text-stone-600">El Constructor de Flyer Diario está disponible exclusivamente para Boku Bento.</p>;
  if (loading && !products.length) return <p role="status" className="p-6">Cargando catálogo de Boku…</p>;
  return <BokuFlyerBuilder key={`${activeBrand?.id || brand?.id}:${user?.id}`} storageKey={draftKey(activeBrand?.id || brand?.id,user?.id)} products={products} logoUrl={restaurantSettings?.logo_url || brand?.logo_url || '/boku-icon-512.png'} theme={{ primary: restaurantSettings?.primary_color || '#bc0e0e', background: restaurantSettings?.theme_background || '#f6f7f5' }} />;
}
