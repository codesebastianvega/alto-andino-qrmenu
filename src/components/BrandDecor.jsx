// TODO(F6): eliminar si no se usa
// src/components/BrandDecor.jsx
// Muestra 4 imágenes fijas en las esquinas. Si falta una, se oculta sola.
import AAImage from "@/components/ui/AAImage";

export default function BrandDecor() {
  const hideIfMissing = (e) => {
    e.currentTarget.style.display = "none";
  };

  return (
    <>
      <AAImage
        src="/decor-tl.png"
        alt=""
        aria-hidden="true"
        className="decor-img decor-tl"
        onError={hideIfMissing}
        priority
      />
      <AAImage
        src="/decor-tr.png"
        alt=""
        aria-hidden="true"
        className="decor-img decor-tr"
        onError={hideIfMissing}
        priority
      />
      <AAImage
        src="/decor-bl.png"
        alt=""
        aria-hidden="true"
        className="decor-img decor-bl"
        onError={hideIfMissing}
        priority
      />
      <AAImage
        src="/decor-br.png"
        alt=""
        aria-hidden="true"
        className="decor-img decor-br"
        onError={hideIfMissing}
        priority
      />
    </>
  );
}
