import React from 'react';
import HeroSectionCard from './HeroSectionCard';
import HeroCategoriesCard from './HeroCategoriesCard';
import FooterGreetingsCard from './FooterGreetingsCard';
import MustTrySectionCard from './MustTrySectionCard';

export default function InicioTab({
  data,
  setData,
  uploadingImage,
  handleImageUpload,
  allCategories,
  loadingCategories,
  editingHeroCategory,
  setEditingHeroCategory,
  allProducts,
  toggleCategoryHero,
  setHeroFeaturedProduct,
  mustTrySearch,
  setMustTrySearch,
  mustTryCategory,
  setMustTryCategory,
  filteredProducts,
  toggleMustTryProduct,
  handleAddItem,
  handleChangeItem,
  handleRemoveItem,
  setAllCategories,
  refetchMenuData
}) {
  return (
    <div className="space-y-8 animate-fadeUp">
      {/* 1. Hero / Portada Principal */}
      <HeroSectionCard 
        data={data}
        setData={setData}
        uploadingImage={uploadingImage}
        handleImageUpload={handleImageUpload}
      />

      {/* 2. Categorías Destacadas (Hero Chips) */}
      <HeroCategoriesCard 
        allCategories={allCategories}
        loadingCategories={loadingCategories}
        editingHeroCategory={editingHeroCategory}
        setEditingHeroCategory={setEditingHeroCategory}
        allProducts={allProducts}
        toggleCategoryHero={toggleCategoryHero}
        setHeroFeaturedProduct={setHeroFeaturedProduct}
        setAllCategories={setAllCategories}
        refetchMenuData={refetchMenuData}
      />

      {/* 3. Saludos Dinámicos y Tagline del Footer */}
      <FooterGreetingsCard 
        data={data}
        setData={setData}
      />

      {/* 4. Favoritos de la Comunidad (Must Try) y Testimonios */}
      <MustTrySectionCard 
        data={data}
        setData={setData}
        mustTrySearch={mustTrySearch}
        setMustTrySearch={setMustTrySearch}
        mustTryCategory={mustTryCategory}
        setMustTryCategory={setMustTryCategory}
        allCategories={allCategories}
        filteredProducts={filteredProducts}
        toggleMustTryProduct={toggleMustTryProduct}
        handleAddItem={handleAddItem}
        handleChangeItem={handleChangeItem}
        handleRemoveItem={handleRemoveItem}
      />
    </div>
  );
}
