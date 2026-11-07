import AdminPaymentMethods from '../../../pages/AdminPaymentMethods';

export function PaymentsSettingsTab() {
  return (
    <div className="animate-fadeUp" style={{ animationDelay: '200ms' }}>
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
        <AdminPaymentMethods />
      </div>
    </div>
  );
}
