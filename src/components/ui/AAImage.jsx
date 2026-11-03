import React from "react";
import { getSafeImageUrl } from "@/utils/images";

// Cache global en memoria de imágenes ya cargadas para evitar parpadeos o titileos en re-renders
export const globalLoadedImageCache = new Set();

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
  const safeSrc = getSafeImageUrl(src);
  const [failed, setFailed] = React.useState(false);
  const imgRef = React.useRef(null);

  React.useEffect(() => {
    if (safeSrc && globalLoadedImageCache.has(safeSrc)) {
      return;
    }
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      if (safeSrc) globalLoadedImageCache.add(safeSrc);
    }
  }, [safeSrc]);

  if ((!safeSrc || failed) && !rest.fallback) return null;
  if (failed && rest.fallback) return rest.fallback;

  const handleLoad = (e) => {
    if (safeSrc) globalLoadedImageCache.add(safeSrc);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setFailed(true);
    onError?.(e);
  };

  const common = {
    ref: imgRef,
    alt,
    className,
    width,
    height,
    decoding: "async",
    referrerPolicy: "no-referrer",
    onLoad: handleLoad,
    onError: handleError,
    style,
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
