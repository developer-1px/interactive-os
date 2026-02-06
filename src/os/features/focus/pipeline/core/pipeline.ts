/**
 * pipeline.ts - Minimal Focus Pipeline Module
 * 
 * 핵심 원칙: resolve 함수는 순수하게, 모든 Side Effect는 runPipeline에서 일괄 처리
 * 
 * Handler에서 사용:
 *   const result = resolveXxx(ctx, payload);  // 순수함수
 *   runPipeline(result, ctx.store);           // 효과 일괄처리
 */

import { FocusData } from '../../lib/focusData';
import { useCommandEngineStore } from '../../../command/store/CommandEngineStore';
import { CommandTelemetryStore } from '../../../command/store/CommandTelemetryStore';
import { commitAll, type CommitPayload } from '../4-commit/commitFocus';
import type { FocusGroupStore } from '../../store/focusGroupStore';
import type { BaseCommand } from '@os/entities/BaseCommand';

// ═══════════════════════════════════════════════════════════════════
// PipelineResult - 순수함수의 반환 타입
// ═══════════════════════════════════════════════════════════════════

export interface PipelineResult extends CommitPayload {
    /** 다른 Zone의 store로 commit (zone 이동 시) */
    store?: FocusGroupStore;

    /** 활성 Zone 변경 */
    activeGroupId?: string;

    /** 바인딩된 App Command 발행 */
    appCommand?: BaseCommand;

    /** Telemetry 로깅 */
    telemetry?: { command: string; payload: any };
}

// ═══════════════════════════════════════════════════════════════════
// runPipeline - 모든 Side Effect가 여기서 발생
// ═══════════════════════════════════════════════════════════════════

/**
 * PipelineResult를 받아 Side Effect를 일괄 처리
 * 
 * 순서:
 * 1. Registry(activeGroup) 업데이트
 * 2. Store Commit (상태 변경)
 * 3. Telemetry 로깅
 * 4. App Command Dispatch
 * 
 * ※ DOM Sync는 FocusSync가 React 렌더 사이클에서 자동 처리
 */
export function runPipeline(result: PipelineResult, defaultStore: FocusGroupStore): void {
    const store = result.store ?? defaultStore;

    // 1. Set active group if specified
    if (result.activeGroupId) {
        FocusData.setActiveZone(result.activeGroupId);
    }

    // 2. Commit state changes
    commitAll(store, result);

    // 3. Log telemetry
    if (result.telemetry) {
        CommandTelemetryStore.log(result.telemetry.command, result.telemetry.payload, 'os');
    }

    // 4. Dispatch bound app command
    if (result.appCommand) {
        const dispatch = useCommandEngineStore.getState().getActiveDispatch();
        dispatch?.({
            type: result.appCommand.type,
            payload: result.appCommand.payload,
        });
    }
}
