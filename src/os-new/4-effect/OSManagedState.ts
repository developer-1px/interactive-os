import type { HistoryState } from "./HistoryState.ts";

/**
 * OSManagedState — OS 미들웨어가 요구하는 최소 상태 shape
 */
export interface OSManagedState {
    effects?: { type: string;[key: string]: any }[];
    history?: HistoryState;
    data?: any;
    ui?: any;
}
