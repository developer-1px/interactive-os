/**
 * TestBot — Type Definitions & Constants
 */

export interface StepResult {
    action: string;
    detail: string;
    passed: boolean;
    error?: string;
}

export type SuiteStatus = "planned" | "running" | "done";

export interface SuiteResult {
    name: string;
    steps: StepResult[];
    passed: boolean;
    status: SuiteStatus;
}

export type OnProgress = (results: SuiteResult[]) => void;
export type OnStep = (suiteIndex: number, step: StepResult) => void;

export interface KeyModifiers {
    shift?: boolean;
    ctrl?: boolean;
    alt?: boolean;
    meta?: boolean;
}

export interface Expectations {
    focused(): Promise<void>;
    toHaveAttr(attr: string, value: string): Promise<void>;
    toNotHaveAttr(attr: string, value: string): Promise<void>;
    toExist(): Promise<void>;
    toNotExist(): Promise<void>;
}

export interface TestActions {
    click(selector: string): Promise<void>;
    press(key: string, modifiers?: KeyModifiers): Promise<void>;
    wait(ms: number): Promise<void>;
    expect(selector: string): Expectations;
}

export interface TestBot {
    describe(name: string, fn: (t: TestActions) => Promise<void>): void;
    dryRun(): Promise<SuiteResult[]>;
    runAll(onProgress?: OnProgress, onStep?: OnStep): Promise<SuiteResult[]>;
    runSuite(index: number, onStep?: OnStep): Promise<SuiteResult>;
    destroy(): void;
}

// Constants
export const DEFAULT_SPEED = 2.0;

export const KEY_LABELS: Record<string, string> = {
    ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→",
    Tab: "⇥ Tab", Enter: "↵ Enter", Escape: "Esc",
    " ": "Space", Backspace: "⌫", Delete: "Del",
};

// Internal error (expected assertion failures)
export class BotError extends Error {
    constructor(message: string) { super(message); this.name = "BotError"; }
}

// Helpers
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function getElementCenter(el: Element) {
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
