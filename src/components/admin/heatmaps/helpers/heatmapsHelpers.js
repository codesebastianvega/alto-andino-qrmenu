import { toast } from '../../../Toast';

export const CHANNEL_STYLES = {
  whatsapp: {
    bg: 'bg-gradient-to-br from-emerald-50 via-emerald-50/40 to-white',
    border: 'border-emerald-200/90 hover:border-emerald-500 hover:shadow-emerald-100/50',
    topBar: 'from-[#25D366] to-[#128C7E]',
    titleColor: 'text-emerald-950',
    badgeActive: 'bg-[#25D366] text-white shadow-xs',
  },
  instagram_bio: {
    bg: 'bg-gradient-to-br from-pink-50 via-purple-50/40 to-amber-50/30',
    border: 'border-pink-200/90 hover:border-pink-500 hover:shadow-pink-100/50',
    topBar: 'from-[#833AB4] via-[#FD1D1D] to-[#FCB045]',
    titleColor: 'text-pink-950',
    badgeActive: 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white shadow-xs',
  },
  facebook: {
    bg: 'bg-gradient-to-br from-blue-50 via-sky-50/40 to-white',
    border: 'border-blue-200/90 hover:border-blue-500 hover:shadow-blue-100/50',
    topBar: 'from-[#1877F2] to-[#0A54BD]',
    titleColor: 'text-blue-950',
    badgeActive: 'bg-[#1877F2] text-white shadow-xs',
  },
  tiktok: {
    bg: 'bg-gradient-to-br from-neutral-100 via-cyan-50/30 to-pink-50/30',
    border: 'border-neutral-300 hover:border-neutral-800 hover:shadow-neutral-200/50',
    topBar: 'from-neutral-900 via-cyan-500 to-pink-500',
    titleColor: 'text-neutral-950',
    badgeActive: 'bg-neutral-900 text-cyan-300 shadow-xs',
  },
  volante_calle: {
    bg: 'bg-gradient-to-br from-amber-50 via-orange-50/40 to-white',
    border: 'border-amber-200/90 hover:border-amber-500 hover:shadow-amber-100/50',
    topBar: 'from-amber-500 to-orange-600',
    titleColor: 'text-amber-950',
    badgeActive: 'bg-amber-600 text-white shadow-xs',
  },
  empaque_delivery: {
    bg: 'bg-gradient-to-br from-rose-50 via-pink-50/40 to-white',
    border: 'border-rose-200/90 hover:border-rose-500 hover:shadow-rose-100/50',
    topBar: 'from-rose-500 to-pink-600',
    titleColor: 'text-rose-950',
    badgeActive: 'bg-rose-600 text-white shadow-xs',
  },
  qr_mesa: {
    bg: 'bg-gradient-to-br from-[#2f4131]/10 via-[#2f4131]/5 to-white',
    border: 'border-[#2f4131]/30 hover:border-[#2f4131] hover:shadow-stone-200/50',
    topBar: 'from-[#2f4131] to-[#1f2d21]',
    titleColor: 'text-[#2f4131]',
    badgeActive: 'bg-[#2f4131] text-white shadow-xs',
  },
  direct: {
    bg: 'bg-gradient-to-br from-indigo-50 via-blue-50/40 to-white',
    border: 'border-indigo-200/90 hover:border-indigo-500 hover:shadow-indigo-100/50',
    topBar: 'from-indigo-500 to-blue-600',
    titleColor: 'text-indigo-950',
    badgeActive: 'bg-indigo-600 text-white shadow-xs',
  },
  default: {
    bg: 'bg-gradient-to-br from-purple-50 via-violet-50/40 to-white',
    border: 'border-purple-200/90 hover:border-purple-500 hover:shadow-purple-100/50',
    topBar: 'from-purple-500 to-violet-600',
    titleColor: 'text-purple-950',
    badgeActive: 'bg-purple-600 text-white shadow-xs',
  },
};

export const KNOWN_PRESETS = {
  whatsapp: { name: 'WhatsApp', icon: '💬' },
  instagram_bio: { name: 'Instagram', icon: '📸' },
  facebook: { name: 'Facebook Ads', icon: '👥' },
  tiktok: { name: 'TikTok', icon: '🎵' },
  volante_calle: { name: 'Volantes Calle', icon: '📄' },
  qr_mesa: { name: 'Mesas QR', icon: '🍽️' },
  direct: { name: 'Directo / Web', icon: '🌐' },
};

export const CHANNEL_ALIASES = {
  ig: 'instagram_bio',
  instagram: 'instagram_bio',
  insta: 'instagram_bio',
  wsp: 'whatsapp',
  wa: 'whatsapp',
  ws: 'whatsapp',
  fb: 'facebook',
  face: 'facebook',
  tt: 'tiktok',
  web: 'direct',
};

export function getCountryFlag(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('colombia')) return '🇨🇴';
  if (lower.includes('sweden') || lower.includes('suecia')) return '🇸🇪';
  if (lower.includes('united states') || lower.includes('estados unidos') || lower.includes('usa')) return '🇺🇸';
  if (lower.includes('spain') || lower.includes('españa')) return '🇪🇸';
  if (lower.includes('mexico') || lower.includes('méxico')) return '🇲🇽';
  if (lower.includes('canada')) return '🇨🇦';
  if (lower.includes('argentina')) return '🇦🇷';
  if (lower.includes('chile')) return '🇨🇱';
  return '🌐';
}

export function exportQrToPng(svgId, fileName, brandName, subtitle) {
  const svg = document.getElementById(svgId);
  if (!svg) {
    toast.error('No se pudo encontrar el código QR');
    return;
  }

  try {
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const qrSize = 500;
    canvas.width = qrSize + 80;
    canvas.height = qrSize + 140;

    img.onload = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 40, 40, qrSize, qrSize);
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 22px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(brandName || 'Boku Bento', canvas.width / 2, qrSize + 80);
      ctx.fillStyle = '#6B7280';
      ctx.font = 'normal 16px system-ui';
      ctx.fillText(subtitle, canvas.width / 2, qrSize + 110);

      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('QR descargado en PNG');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  } catch {
    toast.error('Error exportando QR');
  }
}
