export const collectItemRects = (items: string[]): Record<string, DOMRect> => {
  const rects: Record<string, DOMRect> = {};
  items.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        rects[id] = el.getBoundingClientRect();
    }
  });
  return rects;
};