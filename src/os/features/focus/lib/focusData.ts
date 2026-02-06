/**
 * FocusData - WeakMap-based Zone Data Storage
 * 
 * DOM Element를 key로 사용하여 Zone 데이터 저장
 * - Element GC 시 자동 삭제 (cleanup 불필요)
 * - 등록/해제 코드 불필요
 */

import type { FocusGroupStore } from '../store/focusGroupStore';
import type { FocusGroupConfig } from '../types';
import type { BaseCommand } from '@os/entities/BaseCommand';

export interface ZoneData {
    store: FocusGroupStore;
    config: FocusGroupConfig;
    parentId: string | null;
    activateCommand?: BaseCommand;
    selectCommand?: BaseCommand;
}

const zoneDataMap = new WeakMap<HTMLElement, ZoneData>();

// Active zone tracking (글로벌 상태)
let activeZoneId: string | null = null;
const activeZoneListeners = new Set<() => void>();

export const FocusData = {
    /**
     * Zone 데이터 저장 (FocusGroup 마운트 시)
     */
    set(el: HTMLElement, data: ZoneData): void {
        zoneDataMap.set(el, data);
    },

    /**
     * Zone 데이터 조회 (element로)
     */
    get(el: HTMLElement | null): ZoneData | undefined {
        if (!el) return undefined;
        return zoneDataMap.get(el);
    },

    /**
     * Zone 데이터 조회 (zoneId로)
     */
    getById(zoneId: string): ZoneData | undefined {
        const el = document.getElementById(zoneId);
        if (!el) return undefined;
        return zoneDataMap.get(el);
    },

    /**
     * Active Zone 설정
     */
    setActiveZone(zoneId: string | null): void {
        if (activeZoneId !== zoneId) {
            activeZoneId = zoneId;
            activeZoneListeners.forEach(fn => fn());
        }
    },

    /**
     * Active Zone ID 조회
     */
    getActiveZoneId(): string | null {
        return activeZoneId;
    },

    /**
     * Active Zone 데이터 조회
     */
    getActiveZone(): ZoneData | undefined {
        if (!activeZoneId) return undefined;
        return this.getById(activeZoneId);
    },

    /**
     * Active Zone 변경 구독
     */
    subscribeActiveZone(listener: () => void): () => void {
        activeZoneListeners.add(listener);
        return () => activeZoneListeners.delete(listener);
    },

    /**
     * 형제 Zone 찾기 (Tab 이동용)
     */
    getSiblingZone(direction: 'forward' | 'backward'): string | null {
        if (!activeZoneId) return null;

        const currentEl = document.getElementById(activeZoneId);
        const currentData = currentEl ? zoneDataMap.get(currentEl) : undefined;
        if (!currentData) return null;

        // 같은 부모를 가진 형제들 찾기
        const allZones = document.querySelectorAll('[data-focus-group]');
        const siblings: HTMLElement[] = [];

        for (const el of allZones) {
            const data = zoneDataMap.get(el as HTMLElement);
            if (data?.parentId === currentData.parentId) {
                siblings.push(el as HTMLElement);
            }
        }

        if (siblings.length === 0) return null;

        // DOM 순서로 정렬
        siblings.sort((a, b) => {
            const pos = a.compareDocumentPosition(b);
            if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
            if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
            return 0;
        });

        const currentIndex = siblings.findIndex(el => el.id === activeZoneId);
        if (currentIndex === -1) return null;

        const delta = direction === 'forward' ? 1 : -1;
        let nextIndex = currentIndex + delta;

        // Wrap around
        if (nextIndex < 0) nextIndex = siblings.length - 1;
        if (nextIndex >= siblings.length) nextIndex = 0;

        return siblings[nextIndex]?.id ?? null;
    },

    /**
     * 포커스 경로 (중첩 Zone용)
     */
    getFocusPath(): string[] {
        if (!activeZoneId) return [];

        const path: string[] = [];
        let currentId: string | null = activeZoneId;

        while (currentId) {
            path.unshift(currentId);
            const data = this.getById(currentId);
            currentId = data?.parentId ?? null;
            if (path.length > 100) break; // 무한루프 방지
        }
        return path;
    },

    /**
     * 모든 Zone ID 조회 (DOM 순서)
     */
    getOrderedZones(): string[] {
        const zones = document.querySelectorAll('[data-focus-group]');
        return Array.from(zones)
            .map(el => el.id)
            .filter(Boolean);
    },
};
