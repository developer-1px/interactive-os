/**
 * [DEPRECATED] Re-export bridge — 기존 import 호환용.
 *
 * 새 코드에서는 개별 파일을 직접 import하세요:
 *   - HistoryState.ts
 *   - OSManagedState.ts
 *   - OSMiddleware.ts
 */
export type { HistoryEntry, HistoryState } from "./HistoryState.ts";
export type { OSManagedState } from "./OSManagedState.ts";
export type { Next, OSMiddleware } from "./OSMiddleware.ts";
