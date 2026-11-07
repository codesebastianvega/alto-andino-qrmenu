import React, { createContext, useContext, useMemo } from 'react';
import { useMenuDataProvider } from './menu/useMenuDataProvider';

const MenuDataContext = createContext({});

export const MenuDataProvider = ({ children }) => {
  const menuData = useMenuDataProvider();

  const value = useMemo(
    () => menuData,
    [
      menuData.categories,
      menuData.allCategories,
      menuData.productsByCategory,
      menuData.getProductsByCategory,
      menuData.getAllProducts,
      menuData.getModifiers,
      menuData.modifiers,
      menuData.rawModifierGroups,
      menuData.experiences,
      menuData.banners,
      menuData.allergens,
      menuData.homeSettings,
      menuData.restaurantSettings,
      menuData.brand,
      menuData.businessHours,
      menuData.currentBusinessHours,
      menuData.storeStatusInfo,
      menuData.planFeatures,
      menuData.locations,
      menuData.loading,
      menuData.activeBrandId,
      menuData.currentLocation,
      menuData.currentLocationId,
      menuData.promotions,
      menuData.activePromotions,
      menuData.freeDeliveryPromo,
      menuData.activePromoBanner,
    ]
  );

  return <MenuDataContext.Provider value={value}>{children}</MenuDataContext.Provider>;
};

export const useMenuData = () => useContext(MenuDataContext);
export default MenuDataContext;
