export type BubbleVariant = 'default' | 'click' | 'success' | 'error';

export interface BotCursor {
    moveTo(x: number, y: number, durationMs: number): Promise<void>;
    trackElement(el: Element | null): void;
    ripple(): void;
    /** Show a bubble (Keycap style) above the cursor */
    showBubble(label: string, variant?: BubbleVariant): void;
    /** Show a side label (Left) for Pass/Fail status */
    showStatus(type: 'pass' | 'fail'): void;
    /** Show an indicator for off-screen element */
    showOffScreenPtr(targetX: number, targetY: number): void;
    hideOffScreenPtr(): void;
    /** Clear all current bubbles (e.g. on click) */
    clearBubbles(): void;
    destroy(): void;
    getPosition(): { x: number; y: number };
}
