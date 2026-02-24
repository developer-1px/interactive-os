/**
 * OCP Violations — Red Tests
 *
 * 5건의 OCP 위반을 검증하는 구조 테스트.
 * 소스 코드를 읽어서 OCP 위반 패턴이 제거되었는지 확인한다.
 *
 * T1: 단일 Block Registry (BLOCK_COMPONENTS + TAB_PANEL_RENDERERS 통합)
 * T2: UnifiedInspector 패널 레지스트리
 * T3: CommandInspector 탭 레지스트리
 * T4: QuickPick OS 파이프라인 전환
 */

import { readFileSync, existsSync } from "node:fs";
import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// T1: Block Registry — 단일 소스
// ═══════════════════════════════════════════════════════════════════

describe("T1: Block Registry — single source of truth", () => {
    it("blockRegistry.ts file exists", () => {
        expect(
            existsSync("src/apps/builder/blockRegistry.ts") ||
            existsSync("src/apps/builder/blockRegistry.tsx"),
        ).toBe(true);
    });

    it("BuilderPage uses BLOCK_REGISTRY instead of inline BLOCK_COMPONENTS", () => {
        const src = readFileSync("src/pages/BuilderPage.tsx", "utf-8");

        // Then: 인라인 BLOCK_COMPONENTS 정의가 없어야 함
        expect(src).not.toContain("const BLOCK_COMPONENTS");
        // And: BLOCK_REGISTRY를 import해서 사용
        expect(src).toContain("BLOCK_REGISTRY");
    });

    it("NCPTabNavBlock uses BLOCK_REGISTRY instead of separate TAB_PANEL_RENDERERS", () => {
        const src = readFileSync("src/pages/builder/NCPTabNavBlock.tsx", "utf-8");

        // Then: 별도 TAB_PANEL_RENDERERS가 없어야 함
        expect(src).not.toContain("TAB_PANEL_RENDERERS");
        // And: BLOCK_REGISTRY를 사용
        expect(src).toContain("BLOCK_REGISTRY");
    });
});

// ═══════════════════════════════════════════════════════════════════
// T2: UnifiedInspector — 패널 레지스트리
// ═══════════════════════════════════════════════════════════════════

describe("T2: UnifiedInspector — panel registry", () => {
    it("does not use switch(type) for panel rendering", () => {
        const src = readFileSync(
            "src/inspector/panels/UnifiedInspector.tsx",
            "utf-8",
        );

        const switchCount = (src.match(/switch\s*\(type\)/g) || []).length;
        expect(switchCount).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════
// T3: CommandInspector — 탭 레지스트리
// ═══════════════════════════════════════════════════════════════════

describe("T3: CommandInspector — tab registry", () => {
    it("does not use switch(activeTab) for tab rendering", () => {
        const src = readFileSync(
            "src/inspector/panels/CommandInspector.tsx",
            "utf-8",
        );

        const switchCount = (src.match(/switch\s*\(activeTab\)/g) || []).length;
        expect(switchCount).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════
// T4: QuickPick — OS 파이프라인 사용
// ═══════════════════════════════════════════════════════════════════

describe("T4: QuickPick — no direct e.key branching", () => {
    it("does not handle keyboard events with e.key branching", () => {
        const src = readFileSync(
            "src/os/6-components/quickpick/QuickPick.tsx",
            "utf-8",
        );

        // e.key 직접 분기가 없어야 함 — OS 파이프라인 사용
        expect(src).not.toContain("e.key ===");
    });
});
