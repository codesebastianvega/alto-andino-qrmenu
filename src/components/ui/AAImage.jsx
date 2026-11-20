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
  fallbackSrc,
  style,
  ...rest
}) {
  const safeSrc = getSafeImageUrl(src);
  const [failedSrc, setFailedSrc] = React.useState(null);
  const failed = failedSrc === safeSrc && Boolean(safeSrc);
  const imgRef = React.useRef(null);

  React.useEffect(() => {
    if (safeSrc && globalLoadedImageCache.has(safeSrc)) {
      onLoad?.({ target: imgRef.current });
      return;
    }
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      if (safeSrc) globalLoadedImageCache.add(safeSrc);
      onLoad?.({ target: imgRef.current });
    }
  }, [safeSrc, onLoad]);

  if ((!safeSrc || failed) && !rest.fallback && !fallbackSrc) return null;
  if (failed && rest.fallback) return rest.fallback;

  const handleLoad = (e) => {
    if (safeSrc && !failed) globalLoadedImageCache.add(safeSrc);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setFailedSrc(safeSrc);
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

  return (
    <img
      src={failed || !safeSrc ? fallbackSrc : safeSrc}
      {...common}
      fetchpriority={priority ? "high" : "auto"}
      loading="eager"
    />
  );
}
