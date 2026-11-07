import React from 'react';
import { Icon } from '@iconify-icon/react';
import { Loader2 } from 'lucide-react';
import { PageHeader, PrimaryButton } from '../components/admin/ui';
import { useAdminWebContentData } from '../hooks/webcontent/useAdminWebContentData';
import InicioTab from '../components/admin/webcontent/InicioTab';
import MenuBannerTab from '../components/admin/webcontent/MenuBannerTab';
import AIMeseroTab from '../components/admin/webcontent/AIMeseroTab';
import BrandingTab from '../components/admin/webcontent/BrandingTab';

export default function AdminWebContent() {
  const {
    activeBrand,
    activeTab,
    setActiveTab,
    brandingRef,
    loading,
    submitting,
    saved,
    data,
    setData,
    allCategories,
    loadingCategories,
    editingHeroCategory,
    setEditingHeroCategory,
    allProducts,
    mustTrySearch,
    setMustTrySearch,
    mustTryCategory,
    setMustTryCategory,
    filteredProducts,
    uploadingImage,
    toggleCategoryHero,
    setHeroFeaturedProduct,
    toggleMustTryProduct,
    handleAddItem,
    handleRemoveItem,
    handleChangeItem,
    handleImageUpload,
    handleSave,
    setAllCategories,
    refetchMenuData
  } = useAdminWebContentData();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400 font-medium">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-primary" />
        <span className="text-xs uppercase tracking-[0.2em] font-bold text-gray-500">Cargando experiencia digital...</span>
      </div>
    );
  }

  const tabs = [
    { id: 'inicio', label: 'Portada', icon: 'solar:home-smile-bold-duotone', color: 'indigo' },
    { id: 'menu', label: 'Carta Digital', icon: 'solar:book-bookmark-bold-duotone', color: 'emerald' },
    { id: 'ai', label: 'Mesero AI', icon: 'solar:cpu-bold-duotone', color: 'amber' },
    { id: 'branding', label: 'Identidad', icon: 'solar:palette-bold-duotone', color: 'pink' }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-gray-900 selection:bg-indigo-100 italic-none pb-32">
      <div className="p-4 sm:p-10 max-w-[1600px] mx-auto space-y-10 animate-fadeUp">
        
        {/* ── Global Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fadeUp">
          <PageHeader 
            badge="Gestión de Contenido"
            title="Página Web & Landing"
            subtitle="Modifica el escaparate digital de tu negocio y la inteligencia de tus asistentes."
          />
          
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={() => window.open(`/${activeBrand?.slug}`, '_blank')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200/80 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer group"
            >
              <Icon icon="solar:round-alt-arrow-right-bold" className="text-base text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              <span>Ver Web</span>
            </button>

            <button 
              type="button" 
              onClick={handleSave} 
              disabled={submitting} 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Icon icon="solar:diskette-bold-duotone" className="text-base" />
                  <span>Publicar Cambios</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Sleek Segmented Tab Navigation */}
        <div className="relative z-10 animate-fadeUp w-full" style={{ animationDelay: '100ms' }}>
          <div className="overflow-x-auto no-scrollbar pb-1 w-full flex justify-center">
            <div className="inline-flex items-center bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200/70 shadow-xs gap-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold transition-all relative cursor-pointer ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <Icon icon={tab.icon} className={`text-base ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab 1: Inicio */}
        {activeTab === 'inicio' && (
          <InicioTab
            data={data}
            setData={setData}
            uploadingImage={uploadingImage}
            handleImageUpload={handleImageUpload}
            allCategories={allCategories}
            loadingCategories={loadingCategories}
            editingHeroCategory={editingHeroCategory}
            setEditingHeroCategory={setEditingHeroCategory}
            allProducts={allProducts}
            toggleCategoryHero={toggleCategoryHero}
            setHeroFeaturedProduct={setHeroFeaturedProduct}
            mustTrySearch={mustTrySearch}
            setMustTrySearch={setMustTrySearch}
            mustTryCategory={mustTryCategory}
            setMustTryCategory={setMustTryCategory}
            filteredProducts={filteredProducts}
            toggleMustTryProduct={toggleMustTryProduct}
            handleAddItem={handleAddItem}
            handleChangeItem={handleChangeItem}
            handleRemoveItem={handleRemoveItem}
            setAllCategories={setAllCategories}
            refetchMenuData={refetchMenuData}
          />
        )}

        {/* Tab 2: Menú (Carta Digital) */}
        {activeTab === 'menu' && (
          <MenuBannerTab
            data={data}
            setData={setData}
            allProducts={allProducts}
            uploadingImage={uploadingImage}
            handleImageUpload={handleImageUpload}
          />
        )}

        {/* Tab 3: Mesero AI */}
        {activeTab === 'ai' && (
          <AIMeseroTab
            data={data}
            setData={setData}
            activeBrand={activeBrand}
          />
        )}

        {/* Tab 4: Branding */}
        {activeTab === 'branding' && (
          <BrandingTab brandingRef={brandingRef} />
        )}
      </div>

      {/* ── Botón de Guardado Adaptativo */}
      <div className="fixed bottom-0 left-0 right-0 md:bottom-8 md:right-8 md:left-auto z-40 md:z-50 bg-white/80 backdrop-blur-lg md:bg-transparent border-t border-gray-100 md:border-none p-4 md:p-0 flex md:block">
        <PrimaryButton 
          onClick={handleSave} 
          disabled={submitting}
          className={`shadow-2xl w-full md:w-auto px-10 py-4 scale-100 md:scale-110 flex items-center justify-center gap-2 ${saved ? '!bg-green-600' : ''}`}
        >
          {saved ? (
            <><Icon icon="heroicons:check-circle-solid" className="text-lg" /> ¡Guardado!</>
          ) : submitting ? 'Guardando...' : 'Guardar Todos los Cambios'}
        </PrimaryButton>
      </div>
    </div>
  );
}
