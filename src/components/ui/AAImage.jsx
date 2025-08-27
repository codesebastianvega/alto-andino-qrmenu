import React from "react";

export default function AAImage({
  src,
  alt = "",
  className = "",
  priority = false,
  width,
  height,
  ...rest
}) {
  const common = {
    alt,
    className,
    width,
    height,
    decoding: "async",
    ...rest,
  };

  if (priority) {
    return (
      <img
        src={src}
        {...common}
        fetchpriority="high"
        loading="eager"
      />
    );
  }

  return (
    <img
      src={src}
      {...common}
      loading="lazy"
    />
  );
}
