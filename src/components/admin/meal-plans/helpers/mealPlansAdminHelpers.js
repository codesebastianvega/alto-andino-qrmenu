export const buildVipUrl = (brandSlug, code) => {
  const origin = window.location.origin || 'https://aluna-qrmenu.vercel.app';
  return `${origin}/${brandSlug}/?vip=${encodeURIComponent(code || '')}`;
};

export const buildWhatsAppShareMessage = ({ plan, usage, programConfig, vipUrl }) => {
  const cleanPhone = String(plan.customer_phone || '').replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
  const remaining = usage?.remainingCredits ?? plan.total_credits ?? 5;
  const unitPlural = programConfig.credit_unit_plural?.toLowerCase() || 'almuerzos';

  const message = `¡Hola ${plan.customer_name}! 🥗✨ Ya quedó activa tu *Tiquetera Digital* con *${remaining} ${unitPlural} disponibles*.\n\n📲 *Tu Link VIP directo (tócalo para armar tu pedido cada día, marcar tu casa en el mapa e instalar la App):*\n${vipUrl}\n\n🔑 *Tu Código VIP:* ${plan.code}\n📍 *Entrega:* ${plan.default_address || 'Domicilio'} (${plan.default_time || '2:30 PM'})`;

  return { waPhone, message };
};

export const calculateCustomerInitials = (customerName = 'VIP') => {
  return String(customerName || 'VIP')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

export const calculateRemainingPercentage = (remainingCredits, totalCredits) => {
  const total = Math.max(1, Number(totalCredits) || 1);
  const remaining = Number(remainingCredits) || 0;
  return Math.min(100, Math.max(0, Math.round((remaining / total) * 100)));
};

export const calculateTotalRemainingCredits = (plans = [], usageMap = {}) => {
  return plans.reduce((acc, p) => {
    const u = usageMap[p.id || p.code];
    return acc + (u ? u.remainingCredits : Number(p.total_credits) || 0);
  }, 0);
};

export const calculateGpsVerifiedCount = (plans = []) => {
  return plans.filter((p) => p.default_coords?.lat && p.default_coords?.lng).length;
};
