import { FLYER } from './flyerModel';

export async function loadFlyerImage(url, signal) {
  const parsed = new URL(url, window.location.href);
  if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('La fotografía no tiene una dirección válida.');
  const response = await fetch(parsed.href, { mode: 'cors', credentials: 'omit', signal });
  if (!response.ok) throw new Error(`No se pudo cargar una fotografía (${response.status}).`);
  const blob = await response.blob();
  if (!blob.type.startsWith('image/') || blob.size > 10 * 1024 * 1024) throw new Error('La fotografía no es válida o supera 10 MB.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo preparar la fotografía.'));
    reader.readAsDataURL(blob);
  });
}

let fontCss;
async function getFlyerFontCss() {
  if (!fontCss) fontCss = (async () => {
    const response = await fetch('/boku-flyer/inter-latin.woff2');
    if (!response.ok) throw new Error('No se pudo cargar Inter, la tipografía del menú.');
    const blob = await response.blob();
    const data = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
    return "@font-face{font-family:BokuFlyerInter;font-style:normal;font-weight:400 900;src:url(" + data + ") format('woff2')}";
  })().catch(error => { fontCss = null; throw error; });
  return fontCss;
}

export async function exportFlyerJpeg(node) {
  if (!node) throw new Error('No hay un lienzo para exportar.');
  await document.fonts.load('700 30px BokuFlyerInter');
  const fontEmbedCSS = await getFlyerFontCss();
  const images = [...node.querySelectorAll('img')];
  await Promise.all(images.map(img => img.decode()));
  if (images.some(img => !img.complete || img.naturalWidth === 0)) throw new Error('Hay fotografías sin cargar.');
  const overflowing = [...node.querySelectorAll('[data-check-fit]')].find(el => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
  if (overflowing || node.scrollHeight > node.clientHeight + 1 || node.scrollWidth > node.clientWidth + 1) throw new Error('Hay texto o productos que no caben de forma legible. Acorta el texto o reduce la selección para descargar.');
  const { toJpeg } = await import('html-to-image');
  return toJpeg(node, {
    width: FLYER.width, height: FLYER.height, pixelRatio: FLYER.pixelRatio, quality: FLYER.quality,
    backgroundColor: '#f6f7f5', fontEmbedCSS,
    style: { transform: 'none', margin: '0', width: FLYER.width+'px', height: FLYER.height+'px' },
  });
}
