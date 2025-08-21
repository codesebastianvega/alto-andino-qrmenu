// src/components/BrandDecor.jsx
// Muestra 4 imágenes fijas en las esquinas. Si falta una, se oculta sola.
export default function BrandDecor() {
  const hideIfMissing = (e) => {
    e.currentTarget.style.display = "none";
  };

  return (
    <>
      <img
        src="/decor-tl.png"
        alt=""
        className="decor-img decor-tl"
        onError={hideIfMissing}
      />
      <img
        src="/decor-tr.png"
        alt=""
        className="decor-img decor-tr"
        onError={hideIfMissing}
      />
      <img
        src="/decor-bl.png"
        alt=""
        className="decor-img decor-bl"
        onError={hideIfMissing}
      />
      <img
        src="/decor-br.png"
        alt=""
        className="decor-img decor-br"
        onError={hideIfMissing}
      />
    </>
  );
}
