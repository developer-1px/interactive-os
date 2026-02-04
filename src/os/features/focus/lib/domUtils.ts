import { DOMInterface } from "@os/features/focus/lib/DOMInterface";

export const collectItemRects = (items: string[]): Record<string, DOMRect> => {
  const rects: Record<string, DOMRect> = {};
  items.forEach(id => {
    const rect = DOMInterface.getItemRect(id);
    if (rect) {
      rects[id] = rect;
    }
  });
  return rects;
};