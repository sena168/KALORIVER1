const PLACEHOLDER_IMAGE = "/noimage1.jpg";

const getLocalMenuFallback = (src: string) => {
  if (!src) return undefined;
  if (src.startsWith("/menu/")) return undefined;
  try {
    const url = new URL(src, window.location.origin);
    const marker = "/menu/";
    const index = url.pathname.indexOf(marker);
    if (index === -1) return undefined;
    const relative = url.pathname.slice(index + marker.length);
    if (!relative) return undefined;
    return `${marker}${relative}`;
  } catch {
    return undefined;
  }
};

export const getNextImageFallback = (src: string, stage: number) => {
  if (stage === 0) {
    return getLocalMenuFallback(src) ?? PLACEHOLDER_IMAGE;
  }
  if (stage === 1) {
    return PLACEHOLDER_IMAGE;
  }
  return undefined;
};

export { PLACEHOLDER_IMAGE, getLocalMenuFallback };
