/**
 * KeyboardIntent — 키보드 파이프라인 Phase 1 (Sense) 출력
 */
export interface KeyboardIntent {
    /** Normalized key string (e.g., "ArrowDown", "Meta+K") */
    canonicalKey: string;

    /** Whether the event originated from a Field element */
    isFromField: boolean;

    /** Whether IME composition is in progress */
    isComposing: boolean;

    /** The target element that received the event */
    target: HTMLElement;

    /** Field ID if target is a registered Field */
    fieldId: string | null;

    /** Raw event for edge cases */
    originalEvent: KeyboardEvent;
}
