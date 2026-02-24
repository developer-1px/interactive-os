/**
 * Builder copy-paste reproduction test.
 *
 * Reproduces: copy → paste → paste (연속) 시나리오
 * Uses withOS: true to include OS focus state for OS_FOCUS command.
 * Clipboard is module-managed (_clipboardStore).
 */

import { BuilderApp, sidebarCollection } from "@apps/builder/app";
import { describe, expect, test } from "vitest";
import {
  _resetClipboardStore,
  readClipboard,
} from "@/os/collection/createCollectionZone";

describe("Builder copy → paste → paste 연속 실행", () => {
  function createApp() {
    _resetClipboardStore();
    return BuilderApp.create({ withOS: true });
  }

  test("copy → paste 1회: 섹션이 추가된다", () => {
    const app = createApp();
    const initialCount = app.state.data.blocks.length;
    const heroId = app.state.data.blocks[0]!.id;

    // Copy Hero
    app.dispatch(sidebarCollection.copy({ ids: [heroId] }));
    const clip = readClipboard() as any;
    expect(clip).toBeDefined();
    expect(clip.id).toBe(heroId);

    // Paste
    app.dispatch(sidebarCollection.paste({ afterId: heroId }));
    expect(app.state.data.blocks.length).toBe(initialCount + 1);

    // Clipboard should still be available for next paste
    expect(readClipboard()).not.toBeNull();
  });

  test("copy → paste → paste 연속: 2번째 paste도 동작해야 한다", () => {
    const app = createApp();
    const initialCount = app.state.data.blocks.length;
    const heroId = app.state.data.blocks[0]!.id;

    // Copy Hero
    app.dispatch(sidebarCollection.copy({ ids: [heroId] }));

    // Paste 1
    app.dispatch(sidebarCollection.paste({ afterId: heroId }));
    const countAfterPaste1 = app.state.data.blocks.length;
    expect(countAfterPaste1).toBe(initialCount + 1);

    // Paste 2 — this should also work
    const lastPastedId = app.state.data.blocks[1]!.id; // pasted after hero
    app.dispatch(sidebarCollection.paste({ afterId: lastPastedId }));
    expect(app.state.data.blocks.length).toBe(initialCount + 2);
  });

  test("clipboard 상태가 paste 후에도 유지되는지 확인", () => {
    const app = createApp();
    const heroId = app.state.data.blocks[0]!.id;

    app.dispatch(sidebarCollection.copy({ ids: [heroId] }));
    const clipBefore = readClipboard();

    app.dispatch(sidebarCollection.paste({ afterId: heroId }));
    const clipAfter = readClipboard();

    // Clipboard should NOT be cleared after paste (only cut clears)
    expect(clipAfter).not.toBeNull();
    expect((clipAfter as any).id).toBe((clipBefore as any).id);
  });

  test("paste 3회 연속: 모두 다른 id를 가진다", () => {
    const app = createApp();
    const heroId = app.state.data.blocks[0]!.id;

    app.dispatch(sidebarCollection.copy({ ids: [heroId] }));

    app.dispatch(sidebarCollection.paste({ afterId: heroId }));
    app.dispatch(sidebarCollection.paste({ afterId: heroId }));
    app.dispatch(sidebarCollection.paste({ afterId: heroId }));

    // 5 original + 3 pasted = 8
    expect(app.state.data.blocks.length).toBe(8);

    // All IDs unique
    const ids = app.state.data.blocks.map((s) => s.id);
    expect(new Set(ids).size).toBe(8);
  });

  test("container 블록 paste: children ID도 재생성된다", () => {
    const app = createApp();
    const pricingId = app.state.data.blocks.find(
      (b) => b.children && b.children.length > 0,
    )!.id;

    app.dispatch(sidebarCollection.copy({ ids: [pricingId] }));
    app.dispatch(sidebarCollection.paste({ afterId: pricingId }));

    const original = app.state.data.blocks.find((b) => b.id === pricingId)!;
    const pasted = app.state.data.blocks.find(
      (b) =>
        b.id !== pricingId &&
        b.type === original.type &&
        b.children &&
        b.children.length > 0,
    )!;

    expect(pasted).toBeDefined();
    expect(pasted.id).not.toBe(original.id);
    expect(pasted.children!.length).toBe(original.children!.length);

    // Each child ID must be unique (not same as original)
    for (let i = 0; i < original.children!.length; i++) {
      expect(pasted.children![i]!.id).not.toBe(original.children![i]!.id);
    }

    // All IDs across the entire tree must be unique
    const allIds: string[] = [];
    for (const block of app.state.data.blocks) {
      allIds.push(block.id);
      block.children?.forEach((c) => allIds.push(c.id));
    }
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
