import type { KeyboardCategory } from "./KeyboardCategory.ts";

/**
 * KeyboardExecutionResult — 키보드 파이프라인 Phase 4 (Dispatch) 결과
 */
export interface KeyboardExecutionResult {
    success: boolean;
    category: KeyboardCategory;
    commandId?: string;
    error?: Error;
    timestamp: number;
}
