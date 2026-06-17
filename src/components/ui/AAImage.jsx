import React from "react";
import { getSafeImageUrl } from "@/utils/images";

// Muestra la imagen solo cuando cargue correctamente.
// Si falla, no renderiza nada (evita redundancia/espacios en blanco).
export default function AAImage({
  src,
  alt = "",
  className = "",
  priority = false,
  width,
  height,
  onLoad,
  onError,
  style,
  ...rest
}) {
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const safeSrc = getSafeImageUrl(src);

  if ((!safeSrc || failed) && !rest.fallback) return null;
  if (failed && rest.fallback) return rest.fallback;

  const handleLoad = (e) => {
    setLoaded(true);
    onLoad?.(e);
  };
  const handleError = (e) => {
    setFailed(true);
    onError?.(e);
  };

  const common = {
    alt,
    className,
    width,
    height,
    decoding: "async",
    onLoad: handleLoad,
    onError: handleError,
    style: { opacity: loaded ? 1 : 0, transition: "opacity .2s ease", ...style },
    ...rest,
  };

  if (priority) {
    return (
      <img
        src={safeSrc}
        {...common}
        fetchpriority="high"
        loading="eager"
      />
    );
  }

  return (
    <img
      src={safeSrc}
      {...common}
      loading="lazy"
    />
  );
}
