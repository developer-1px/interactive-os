/**
 * Builder Canvas Clipboard Tests
 * 
 * Verifies the PRD scenarios for copy, cut, and paste bubbling
 * within the canvas zone. Tests distinguish between dynamic items (sections/cards)
 * and static items (fields/text).
 */

import { describe, expect, test, vi, beforeEach } from "vitest";
import { BuilderApp, canvasOnCopy, canvasOnCut, canvasOnPaste } from "@apps/builder/app";
import { _resetClipboardStore, getClipboardPreview } from "@/os/collection/createCollectionZone";
import type { BaseCommand } from "@kernel/core/tokens";

// Mock navigator.clipboard
const mockWriteText = vi.fn(() => Promise.resolve());
Object.assign(globalThis.navigator, {
    clipboard: {
        writeText: mockWriteText,
    },
});

describe("Builder Canvas Clipboard (PRD scenarios)", () => {
    beforeEach(() => {
        _resetClipboardStore();
        mockWriteText.mockClear();
    });

    function createApp() {
        const app = BuilderApp.create({ withOS: true });
        (app.runtime as any).defineEffect("focus", () => Promise.resolve());
        (app.runtime as any).defineEffect("clipboardWrite", () => Promise.resolve());
        return app;
    }

    /** Helper to dispatch the command result from canvas callbacks */
    function dispatchCanvasResult(app: ReturnType<typeof createApp>, result: BaseCommand | BaseCommand[] | any) {
        if (Array.isArray(result)) {
            result.forEach(r => app.dispatch(r));
        } else if (result) {
            app.dispatch(result);
        }
    }

    test("Scenario: 동적 아이템(섹션) 복사 → 구조 복사 (PRD 1.1)", () => {
        const app = createApp();
        const heroId = app.state.data.blocks[0]!.id;

        // Focus on section itself (dynamic item)
        const result = canvasOnCopy({ focusId: heroId, selection: [] } as any) as BaseCommand[];
        dispatchCanvasResult(app, result);

        const clip = getClipboardPreview() as { id?: string };
        expect(clip).toBeDefined();
        // It should have copied the hero section structure
        expect(clip.id).toBe(heroId);

        // writeText is not called for structural copy
        expect(mockWriteText).not.toHaveBeenCalled();
    });

    test("Scenario: 정적 아이템(필드) 복사 → 텍스트 값 복사 (PRD 1.1)", () => {
        const app = createApp();

        // ncp-hero-title is a static field item inside ncp-hero
        const result = canvasOnCopy({ focusId: "ncp-hero-title", selection: [] } as any);

        const clip = getClipboardPreview() as { type?: string, value?: string };
        expect(clip).not.toBeNull();
        expect(clip.type).toBe("text");

        // Field value should be copied (value from INITIAL_STATE)
        const expectedText = "AI 시대를 위한\n가장 완벽한 플랫폼";
        expect(clip.value).toBe(expectedText);

        // Result should include clipboardWrite for OS to handle system clipboard
        expect((result as any).clipboardWrite?.text).toBe(expectedText);
    });

    test("Scenario: 정적 아이템(필드) 잘라내기 → no-op (PRD 1.3)", () => {
        const app = createApp();
        const initialBlocks = [...app.state.data.blocks];

        const result = canvasOnCut({ focusId: "ncp-hero-title", selection: [] } as any) as BaseCommand[];
        dispatchCanvasResult(app, result);

        // Nothing was copied to clipboard
        expect(getClipboardPreview()).toBeNull();
        // Blocks remain unchanged
        expect(app.state.data.blocks.length).toBe(initialBlocks.length);
    });

    test("Scenario: 동적 아이템(섹션) 잘라내기 → 구조 잘라내기 (PRD 1.3)", () => {
        const app = createApp();
        const heroId = app.state.data.blocks[0]!.id;
        const initialCount = app.state.data.blocks.length;

        const result = canvasOnCut({ focusId: heroId, selection: [] } as any) as BaseCommand[];
        dispatchCanvasResult(app, result);

        const clip = getClipboardPreview() as { id?: string };
        expect(clip).toBeDefined();
        expect(clip.id).toBe(heroId);

        // Section is removed
        expect(app.state.data.blocks.length).toBe(initialCount - 1);
        expect(app.state.data.blocks.find(b => b.id === heroId)).toBeUndefined();
    });

    test("Scenario: 정적 아이템(텍스트) 붙여넣기 → 필드 값 교체 (PRD 1.2 / 1.5)", () => {
        const app = createApp();
        const initialCount = app.state.data.blocks.length;

        // 1. Copy text from hero title
        const copyResult = canvasOnCopy({ focusId: "ncp-hero-title", selection: [] } as any) as BaseCommand[];
        dispatchCanvasResult(app, copyResult);

        // 2. Paste text onto news title
        const pasteResult = canvasOnPaste({ focusId: "ncp-news-title", selection: [] } as any) as BaseCommand[];
        dispatchCanvasResult(app, pasteResult);

        // News title field should now be replaced with hero title text
        const newsSection = app.state.data.blocks.find(b => b.id === "ncp-news")!;
        const expectedText = "AI 시대를 위한\n가장 완벽한 플랫폼";

        expect(newsSection.fields["title"]).toBe(expectedText);

        // Number of blocks should not increase (no structural paste)
        expect(app.state.data.blocks.length).toBe(initialCount);
    });

    test("Scenario: 동적 항목 복사 후 부모 섹션 뒤에 붙여넣기 (Paste Bubbling PRD 1.5)", () => {
        const app = createApp();
        const initialCount = app.state.data.blocks.length;

        // Copy entire Hero section
        const heroId = app.state.data.blocks.find(b => b.id === "ncp-hero")!.id;
        const copyResult = canvasOnCopy({ focusId: heroId, selection: [] } as any) as BaseCommand[];
        dispatchCanvasResult(app, copyResult);

        // Paste -> Bubble up to Root -> Append after News section
        const pasteResult = canvasOnPaste({ focusId: "ncp-news-title", selection: [] } as any) as BaseCommand[];
        dispatchCanvasResult(app, pasteResult);

        // Should structurally paste a section
        expect(app.state.data.blocks.length).toBe(initialCount + 1);
        // The newly pasted section should be at index 2 (after News = index 1)
        expect(app.state.data.blocks[2]!.type).toBe("hero");
        expect(app.state.data.blocks[2]!.id).not.toBe(heroId); // Ensure new ID
    });
});
