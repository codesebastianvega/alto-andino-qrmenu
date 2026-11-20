export function getProductPlaceholder(product = {}) {
  const text = `${product.categoryName || ''} ${product.categorySlug || ''} ${product.name || ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const drink = /cafe|bebida|jugo|te\b|coffee/.test(text);
  const bakery = /croissant|panader|postre|desayuno|pasteler/.test(text);
  const shape = drink
    ? '<path d="M74 74h64v46a25 25 0 0 1-25 25H99a25 25 0 0 1-25-25Z"/><path d="M138 82h9a17 17 0 0 1 0 34h-9M86 59v-9m22 9v-9m22 9v-9M67 155h89"/>'
    : bakery
      ? '<path d="M48 133q-2-43 47-54l18 42 18-42q48 11 47 54l-34-7-31 20-32-20Z"/><path d="m81 126 14-47m36 0 13 47"/>'
      : '<circle cx="112" cy="106" r="47"/><circle cx="112" cy="106" r="30"/><path d="M40 66v31m-9-31v20q9 13 18 0V66m-9 31v57m145-88v88m0-88q-19 26 0 31"/>';
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="224" height="200" viewBox="0 0 224 200"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#f6f1e9"/><stop offset="1" stop-color="#e4ecdf"/></linearGradient></defs><rect width="224" height="200" rx="16" fill="url(#bg)"/><g fill="none" stroke="#77876a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${shape}</g><text x="112" y="184" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#65745a">Fotografía pendiente</text></svg>`)}`;
}
