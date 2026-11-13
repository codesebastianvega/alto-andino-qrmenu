import { useState } from 'react';

export default function IngredientPhoto({ item, className = '' }) {
  const [failed, setFailed] = useState([]);
  // The catalog owns the image. A restaurant may use bundled files or its own CDN.
  const configured = item.image_url || item.ingredients?.image_url;
  const src = typeof configured === 'string' && /^(?:https?:\/\/|\/(?!\/))/.test(configured) && !failed.includes(configured) ? configured : null;
  const label = String(item.name || '').replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D\u20E3]/gu, '').trim();
  if (!src) return <span className="px-3 text-xs text-neutral-500 text-center">{label}</span>;
  return <img src={src} alt={label} loading="lazy" className={className}
    onError={() => setFailed(previous => [...previous, src])} />;
}
