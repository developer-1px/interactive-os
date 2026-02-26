/**
 * Builder Canvas Clipboard Tests
 *
 * Verifies the PRD scenarios for copy, cut, and paste bubbling
 * within the canvas zone. Tests distinguish between dynamic items (sections/cards)
 * and static items (fields/text).
 *
 * Top-level blocks (GreenEye preset):
 *   ge-hero, ge-tab-nav, ge-related-services, ge-section-footer, ge-footer
 *
 * Field item ID format: "{sectionId}-{fieldName}"
 *   e.g., "ge-hero-service-name" → section "ge-hero", field "service-name"
 */

import {
  BuilderApp,
  canvasOnCopy,
  canvasOnCut,
  canvasOnPaste,
} from "@apps/builder/app";
import { findBlock } from "@apps/builder/model/appState";
import type { BaseCommand } from "@kernel/core/tokens";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  _resetClipboardStore,
  readClipboard,
} from "@/os/collection/createCollectionZone";

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
    (app.runtime as any).defineEffect("clipboardWrite", () =>
      Promise.resolve(),
    );
    return app;
  }

  /** Helper to dispatch the command result from canvas callbacks */
  function dispatchCanvasResult(
    app: ReturnType<typeof createApp>,
    result: BaseCommand | BaseCommand[] | any,
  ) {
    if (Array.isArray(result)) {
      result.forEach((r) => app.dispatch(r));
    } else if (result) {
      app.dispatch(result);
    }
  }

  test("Scenario: 동적 아이템(섹션) 복사 → 구조 복사 (PRD 1.1)", () => {
    const app = createApp();
    const heroId = app.state.data.blocks[0]!.id; // ge-hero

    // Focus on section itself (dynamic item)
    const result = canvasOnCopy({
      focusId: heroId,
      selection: [],
    } as any) as BaseCommand[];
    dispatchCanvasResult(app, result);

    const clip = readClipboard() as { id?: string };
    expect(clip).toBeDefined();
    // It should have copied the hero section structure
    expect(clip.id).toBe(heroId);

    // writeText is not called for structural copy
    expect(mockWriteText).not.toHaveBeenCalled();
  });

  test("Scenario: 정적 아이템(필드) 복사 → 텍스트 값 복사 (PRD 1.1)", () => {
    const app = createApp();

    // ge-hero-service-name is a static field item inside ge-hero
    const result = canvasOnCopy({
      focusId: "ge-hero-service-name",
      selection: [],
    } as any);

    const clip = readClipboard() as { type?: string; value?: string };
    expect(clip).not.toBeNull();
    expect(clip.type).toBe("text");

    // Field value should be copied (value from INITIAL_STATE)
    const expectedText = "CLOVA GreenEye";
    expect(clip.value).toBe(expectedText);

    // Result should include clipboardWrite for OS to handle system clipboard
    expect((result as any).clipboardWrite?.text).toBe(expectedText);
  });

  test("Scenario: 정적 아이템(필드) 잘라내기 → no-op (PRD 1.3)", () => {
    const app = createApp();
    const initialBlocks = [...app.state.data.blocks];

    const result = canvasOnCut({
      focusId: "ge-hero-service-name",
      selection: [],
    } as any) as BaseCommand[];
    dispatchCanvasResult(app, result);

    // Nothing was copied to clipboard
    expect(readClipboard()).toBeNull();
    // Blocks remain unchanged
    expect(app.state.data.blocks.length).toBe(initialBlocks.length);
  });

  test("Scenario: 동적 아이템(섹션) 잘라내기 → 구조 잘라내기 (PRD 1.3)", () => {
    const app = createApp();
    const heroId = app.state.data.blocks[0]!.id; // ge-hero
    const initialCount = app.state.data.blocks.length;

    const result = canvasOnCut({
      focusId: heroId,
      selection: [],
    } as any) as BaseCommand[];
    dispatchCanvasResult(app, result);

    const clip = readClipboard() as { id?: string };
    expect(clip).toBeDefined();
    expect(clip.id).toBe(heroId);

    // Section is removed
    expect(app.state.data.blocks.length).toBe(initialCount - 1);
    expect(app.state.data.blocks.find((b) => b.id === heroId)).toBeUndefined();
  });

  test("Scenario: 정적 아이템(텍스트) 붙여넣기 → 필드 값 교체 (PRD 1.2 / 1.5)", () => {
    const app = createApp();
    const initialCount = app.state.data.blocks.length;

    // 1. Copy text from hero service-name
    const copyResult = canvasOnCopy({
      focusId: "ge-hero-service-name",
      selection: [],
    } as any) as BaseCommand[];
    dispatchCanvasResult(app, copyResult);

    // 2. Paste text onto section-footer title
    const pasteResult = canvasOnPaste({
      focusId: "ge-section-footer-title",
      selection: [],
    } as any) as BaseCommand[];
    dispatchCanvasResult(app, pasteResult);

    // Section-footer title field should now be replaced with hero service-name text
    const sectionFooter = findBlock(
      app.state.data.blocks,
      "ge-section-footer",
    )!;
    const expectedText = "CLOVA GreenEye";

    expect(sectionFooter.fields["title"]).toBe(expectedText);

    // Number of blocks should not increase (no structural paste)
    expect(app.state.data.blocks.length).toBe(initialCount);
  });

  test("Scenario: 동적 항목 복사 후 부모 섹션 뒤에 붙여넣기 (Paste Bubbling PRD 1.5)", () => {
    const app = createApp();
    const initialCount = app.state.data.blocks.length;

    // Copy entire Hero section
    const heroId = app.state.data.blocks.find((b) => b.id === "ge-hero")!.id;
    const copyResult = canvasOnCopy({
      focusId: heroId,
      selection: [],
    } as any) as BaseCommand[];
    dispatchCanvasResult(app, copyResult);

    // Paste -> Bubble up to Root -> Append after section-footer field's parent
    const pasteResult = canvasOnPaste({
      focusId: "ge-section-footer-title",
      selection: [],
    } as any) as BaseCommand[];
    dispatchCanvasResult(app, pasteResult);

    // Should structurally paste a section
    expect(app.state.data.blocks.length).toBe(initialCount + 1);
    // The newly pasted section should have same type as hero
    const pasted = app.state.data.blocks.find(
      (b) => b.type === "ncp-product-hero" && b.id !== heroId,
    );
    expect(pasted).toBeDefined();
    expect(pasted!.id).not.toBe(heroId); // Ensure new ID
  });
});
