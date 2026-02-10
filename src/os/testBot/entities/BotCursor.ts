export type BubbleVariant = "default" | "click" | "success" | "error";

export interface BotCursor {
  moveTo(x: number, y: number, durationMs: number): Promise<void>;
  trackElement(el: Element | null): void;
  ripple(): void;
  /** Show a bubble (Keycap style) above the cursor */
  showBubble(label: string, variant?: BubbleVariant): void;
  /** Show a stamp on the target element (Pass/Fail) */
  showStatus(type: "pass" | "fail", selector?: string, el?: Element): void;
  /** Show an indicator for off-screen element */
  showOffScreenPtr(targetX: number, targetY: number): void;
  hideOffScreenPtr(): void;
  /** Clear all current bubbles (e.g. on click) */
  clearBubbles(): void;
  /** Clear all status stamps */
  clearStamps(): void;
  destroy(): void;
  getPosition(): { x: number; y: number };
}
