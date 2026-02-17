/**
 * Transaction — OS 트랜잭션 로그 스키마
 *
 * 하나의 입력 = 하나의 트랜잭션 = 하나의 스냅샷.
 * 모든 정보가 자기 완결적(self-contained)이다.
 */

import type { InputSource } from "../effect/EffectRecord.ts";
import type { OSState } from "./OSState.ts";

export interface Transaction {
  id: number;
  timestamp: number;

  // ── Cause: 원인 ──

  /** 입력 정보 */
  input: TransactionInput;

  /** 실행된 커맨드 (없으면 null) */
  command: TransactionCommand | null;

  // ── Result: 결과 ──

  /** 실행 후 전체 상태 스냅샷 */
  snapshot: OSState;

  /** 이전 스냅샷과의 차이 */
  diff: StateDiff[];
}

export interface TransactionInput {
  source: InputSource;
  /** 사람이 읽을 수 있는 입력 설명 (e.g. "ArrowDown", "mousedown") */
  raw: string;
}

export interface TransactionCommand {
  type: string;
  payload?: unknown;
}

export interface StateDiff {
  /** dot-path (e.g. "focus.zone.focusedItemId") */
  path: string;
  from: unknown;
  to: unknown;
}
