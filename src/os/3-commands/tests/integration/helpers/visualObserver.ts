/**
 * Visual Test Observer — global hook for createTestOsKernel actions.
 *
 * When a visual observer is registered (browser only), all pressKey/click/attrs
 * calls from integration tests are reported to it for visual feedback.
 *
 * In Vitest (no observer registered), this is a no-op.
 * "Test code stays pure. Observation is external."
 */

export interface VisualObserver {
    onPressKey(key: string): void;
    onClick(itemId: string, opts?: Record<string, unknown>): void;
    onAssert(label: string, passed: boolean, error?: string): void;
    /** Called after each action to allow async delays for visual effect */
    delay(): Promise<void>;
}

let observer: VisualObserver | null = null;

export function setVisualObserver(o: VisualObserver | null) {
    observer = o;
}

export function getVisualObserver(): VisualObserver | null {
    return observer;
}
