export const getLocalMenuFallback = (src: string) => {
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
