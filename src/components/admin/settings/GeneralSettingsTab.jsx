import { BusinessModelCard } from './BusinessModelCard';
import { TelegramComandasCard } from './TelegramComandasCard';
import { DailySpecialCard } from './DailySpecialCard';
import { BillingStrategyCard } from './BillingStrategyCard';
import { ThermalPrintingCard } from './ThermalPrintingCard';
import { BusinessHoursCard } from './BusinessHoursCard';
import { CustomerSupportCard } from './CustomerSupportCard';
import { OperationalIntelligenceCard } from './OperationalIntelligenceCard';
import { FinancialSecurityCard } from './FinancialSecurityCard';
import DailySpecialModal from '../DailySpecialModal';

export function GeneralSettingsTab({
  settingsForm,
  setSettingsForm,
  handleSaveSettings,
  isSubmittingSettings,
  showTelegramGuide,
  setShowTelegramGuide,
  activeBrand,
  handleDetectChatId,
  isDetectingChatId,
  handleTestTelegram,
  isTestingTelegram,
  bentoProducts,
  bentoConfig,
  setBentoConfig,
  isDailySpecialOpen,
  setIsDailySpecialOpen,
  hours,
  handleUpdateHour,
  handleSaveHours,
  isSubmittingHours
}) {
  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-fadeUp" style={{ animationDelay: '200ms' }}>
        {/* LEFT: Business Model, Delivery Modes, Telegram & Daily Special (8 cols) */}
        <div className="xl:col-span-7 space-y-6">
          <BusinessModelCard
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            handleSaveSettings={handleSaveSettings}
            isSubmittingSettings={isSubmittingSettings}
          />

          <TelegramComandasCard
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            showTelegramGuide={showTelegramGuide}
            setShowTelegramGuide={setShowTelegramGuide}
            activeBrand={activeBrand}
            handleDetectChatId={handleDetectChatId}
            isDetectingChatId={isDetectingChatId}
            handleTestTelegram={handleTestTelegram}
            isTestingTelegram={isTestingTelegram}
            handleSaveSettings={handleSaveSettings}
            isSubmittingSettings={isSubmittingSettings}
          />

          <DailySpecialCard
            bentoProducts={bentoProducts}
            activeBrand={activeBrand}
            bentoConfig={bentoConfig}
            setBentoConfig={setBentoConfig}
            setIsDailySpecialOpen={setIsDailySpecialOpen}
            handleSaveSettings={handleSaveSettings}
            isSubmittingSettings={isSubmittingSettings}
          />

          <BillingStrategyCard
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            handleSaveSettings={handleSaveSettings}
            isSubmittingSettings={isSubmittingSettings}
          />

          <ThermalPrintingCard
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            handleSaveSettings={handleSaveSettings}
            isSubmittingSettings={isSubmittingSettings}
          />
        </div>

        {/* RIGHT: Service Schedule, Customer Support, Intelligence & Economy (5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          <BusinessHoursCard
            hours={hours}
            handleUpdateHour={handleUpdateHour}
            handleSaveHours={handleSaveHours}
            isSubmittingHours={isSubmittingHours}
          />

          <CustomerSupportCard
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            handleSaveSettings={handleSaveSettings}
            isSubmittingSettings={isSubmittingSettings}
          />

          <OperationalIntelligenceCard
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            handleSaveSettings={handleSaveSettings}
            isSubmittingSettings={isSubmittingSettings}
          />

          <FinancialSecurityCard
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            handleSaveSettings={handleSaveSettings}
            isSubmittingSettings={isSubmittingSettings}
          />
        </div>
      </div>

      {/* Daily Special Configuration Modal */}
      {isDailySpecialOpen && (
        <DailySpecialModal
          isOpen={isDailySpecialOpen}
          onClose={() => setIsDailySpecialOpen(false)}
          products={bentoProducts}
          activeBrand={activeBrand}
          currentConfig={bentoConfig}
          onSave={async (newConfig) => {
            setBentoConfig(newConfig);
            setIsDailySpecialOpen(false);
            await handleSaveSettings();
          }}
        />
      )}
    </>
  );
}
