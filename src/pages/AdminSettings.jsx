import { useAdminSettingsData } from '../hooks/settings/useAdminSettingsData';
import { PageHeader } from '../components/admin/ui';
import { Icon } from '@iconify/react';
import { GeneralSettingsTab } from '../components/admin/settings/GeneralSettingsTab';
import { SedesSettingsTab } from '../components/admin/settings/SedesSettingsTab';
import { StaffSettingsTab } from '../components/admin/settings/StaffSettingsTab';
import { PaymentsSettingsTab } from '../components/admin/settings/PaymentsSettingsTab';

const TABS = [
  { id: 'general', label: 'Operación', icon: 'solar:settings-minimalistic-linear' },
  { id: 'sedes', label: 'Sedes y Locales', icon: 'solar:shop-2-linear' },
  { id: 'staff', label: 'Personal / Staff', icon: 'solar:users-group-rounded-linear', feature: 'staff' },
  { id: 'payments', label: 'Medios de Pago', icon: 'solar:card-2-linear' },
];

export default function AdminSettings() {
  const {
    isFeatureLocked,
    activePlan,
    activeBrand,
    activeTab,
    setActiveTab,
    settingsForm,
    setSettingsForm,
    isSubmittingSettings,
    isTestingTelegram,
    isDetectingChatId,
    showTelegramGuide,
    setShowTelegramGuide,
    hours,
    loadingSettings,
    loadingHours,
    isSubmittingHours,
    bentoProducts,
    isDailySpecialOpen,
    setIsDailySpecialOpen,
    bentoConfig,
    setBentoConfig,
    handleSaveSettings,
    handleTestTelegram,
    handleDetectChatId,
    handleUpdateHour,
    handleSaveHours
  } = useAdminSettingsData();

  if (loadingSettings || loadingHours) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
        Cargando…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-gray-900 selection:bg-indigo-100 italic-none">
      <div className="p-4 sm:p-10 max-w-[1600px] mx-auto space-y-12">
        {/* Global Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fadeUp">
          <PageHeader
            badge="Panel de Control"
            title="Ajustes de Sistema"
            subtitle="Configura la inteligencia operativa, sedes y el equipo de tu marca."
          />

          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200/80 px-4 py-2.5 shadow-2xs self-start md:self-auto">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Icon icon="solar:rocket-2-linear" className="text-base" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Plan Actual</p>
              <p className="text-xs font-bold text-gray-900 uppercase">{activePlan?.name || 'Cargando...'}</p>
            </div>
          </div>
        </div>

        {/* Sleek Segmented Tab Navigation */}
        <div className="relative z-10 animate-fadeUp w-full" style={{ animationDelay: '100ms' }}>
          <div className="overflow-x-auto no-scrollbar pb-1 w-full flex justify-center">
            <div className="inline-flex items-center bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200/70 shadow-xs gap-1">
              {TABS.map((tab) => {
                const isLocked = tab.feature && isFeatureLocked(tab.feature);
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
                    {isLocked && (
                      <span className="ml-1 w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200/50">
                        <Icon icon="heroicons:lock-closed-16-solid" className="text-[10px] text-amber-600" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="space-y-6">
          {activeTab === 'general' && (
            <GeneralSettingsTab
              settingsForm={settingsForm}
              setSettingsForm={setSettingsForm}
              handleSaveSettings={handleSaveSettings}
              isSubmittingSettings={isSubmittingSettings}
              showTelegramGuide={showTelegramGuide}
              setShowTelegramGuide={setShowTelegramGuide}
              activeBrand={activeBrand}
              handleDetectChatId={handleDetectChatId}
              isDetectingChatId={isDetectingChatId}
              handleTestTelegram={handleTestTelegram}
              isTestingTelegram={isTestingTelegram}
              bentoProducts={bentoProducts}
              bentoConfig={bentoConfig}
              setBentoConfig={setBentoConfig}
              isDailySpecialOpen={isDailySpecialOpen}
              setIsDailySpecialOpen={setIsDailySpecialOpen}
              hours={hours}
              handleUpdateHour={handleUpdateHour}
              handleSaveHours={handleSaveHours}
              isSubmittingHours={isSubmittingHours}
            />
          )}

          {activeTab === 'sedes' && <SedesSettingsTab />}

          {activeTab === 'staff' && <StaffSettingsTab isFeatureLocked={isFeatureLocked} />}

          {activeTab === 'payments' && <PaymentsSettingsTab />}
        </div>
      </div>
    </div>
  );
}
