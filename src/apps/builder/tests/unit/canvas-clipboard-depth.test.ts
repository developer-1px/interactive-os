/**
 * Bug: Canvas copy-paste — deeply-nested block (depth ≥ 3) 무반응
 *
 * 재현: ge-card-2 (depth=4) Meta+C → Meta+V → block 증가 없음
 * 근본 원인: isDynamicItem / resolveCanvasCopyTarget이 depth=2까지만 탐색
 *
 * 결정 테이블: docs/6-products/builder/spec/collection-crud.md
 *   C3 🆕 — copy deeply-nested item → clipboard 저장됨
 *   V3 🆕 — copy+paste deeply-nested item → block 추가됨
 *
 * Issue: docs/1-project/0-issue/2026-02-25_canvas-clipboard-deep-nested.md
 */

import type { Block } from "@apps/builder/app";
import { BuilderApp, canvasOnCopy, canvasOnPaste } from "@apps/builder/app";
import { describe, expect, test } from "vitest";
import {
  _resetClipboardStore,
  readClipboard,
} from "@/os/collection/createCollectionZone";

/** Recursively count all blocks in tree */
function countBlocks(blocks: Block[]): number {
  return blocks.reduce((sum, b) => sum + 1 + countBlocks(b.children ?? []), 0);
}

const makeCursor = (focusId: string) => ({
  focusId,
  selection: [] as string[],
  anchor: null as string | null,
  isExpandable: false,
  isDisabled: false,
});

describe("Canvas clipboard: deeply-nested block (C3🆕 / V3🆕)", () => {
  /**
   * ge-card-2 위치 (depth=4):
   *   blocks → ge-tab-nav.children → ge-tab-overview.children
   *         → ge-features.children → ge-card-2
   */
  const DEEP_ID = "ge-card-2";

  function createApp() {
    _resetClipboardStore();
    return BuilderApp.create({ withOS: true });
  }

  // ─── C3 🆕 ──────────────────────────────────────────────────────
  // Given: focus=deeply-nested block (depth=4), isDynamic=true
  // When: Meta+C
  // Intent: copy
  // Condition: isDynamic=true (block exists in tree)
  // Command: canvas:copy({ids:[id]})
  // Effect: clipboard ← block structure
  // Then: clipboard.items[0].id = focusId

  test("C3🆕: canvasOnCopy(ge-card-2, depth=4) — clipboard에 저장된다", () => {
    const app = createApp();
    const blocksBefore = app.state.data.blocks;

    // canvasOnCopy는 isDynamicItem(ge-card-2)를 호출한다
    // 🔴 Bug: isDynamicItem이 depth=2까지만 탐색 → false 반환 → [] 반환
    const copyResult = canvasOnCopy(makeCursor(DEEP_ID));

    // 비어있으면 clipboard가 쓰이지 않음
    expect(copyResult).not.toEqual([]);

    // Command를 dispatch해야 clipboard store가 갱신됨
    const cmds = Array.isArray(copyResult) ? copyResult : [copyResult];
    cmds.forEach(
      (c) =>
        c &&
        app.dispatch(
          c as ReturnType<typeof canvasOnCopy> extends infer R ? any : any,
        ),
    );

    const clip = readClipboard() as { id?: string } | null;
    expect(clip).not.toBeNull();
    expect(clip?.id).toBe(DEEP_ID);
    // Sanity: original blocks unchanged
    expect(blocksBefore.length).toBe(app.state.data.blocks.length);
  });

  // ─── V3 🆕 ──────────────────────────────────────────────────────
  // Given: focus=deeply-nested block (depth=4), clipboard=block
  // When: Meta+V
  // Intent: paste
  // Condition: isPalatable=true, focusId inside tab>section>card tree
  // Command: canvas:paste({afterId:focusId})
  // Effect: block inserted after target
  // Then: countBlocks(blocks) + 1, new block has unique id

  test("V3🆕: copy→paste(ge-card-2, depth=4) — 총 block 수가 1 증가한다", () => {
    const app = createApp();
    const beforeTotal = countBlocks(app.state.data.blocks);

    // Step 1: Copy
    const copyCmd = canvasOnCopy(makeCursor(DEEP_ID));
    const copyCmds = Array.isArray(copyCmd) ? copyCmd : [copyCmd];
    copyCmds.forEach((c) => c && app.dispatch(c as any));

    // Step 2: Paste
    const pasteCmd = canvasOnPaste(makeCursor(DEEP_ID));
    const pasteCmds = Array.isArray(pasteCmd) ? pasteCmd : [pasteCmd];
    pasteCmds.forEach((c) => c && app.dispatch(c as any));

    const afterTotal = countBlocks(app.state.data.blocks);

    // 🔴 Bug: paste is no-op → afterTotal === beforeTotal
    // 🟢 Expected: a new sibling card is inserted → afterTotal = beforeTotal + 1
    expect(afterTotal).toBe(beforeTotal + 1);
  });

  test("V3🆕: paste된 block은 고유한 id를 가진다", () => {
    const app = createApp();

    const copyCmd = canvasOnCopy(makeCursor(DEEP_ID));
    const copyCmds = Array.isArray(copyCmd) ? copyCmd : [copyCmd];
    copyCmds.forEach((c) => c && app.dispatch(c as any));

    const pasteCmd = canvasOnPaste(makeCursor(DEEP_ID));
    const pasteCmds = Array.isArray(pasteCmd) ? pasteCmd : [pasteCmd];
    pasteCmds.forEach((c) => c && app.dispatch(c as any));

    // Collect all IDs recursively
    function collectIds(blocks: Block[]): string[] {
      return blocks.flatMap((b) => [b.id, ...collectIds(b.children ?? [])]);
    }
    const allIds = collectIds(app.state.data.blocks);
    const uniqueIds = new Set(allIds);

    expect(uniqueIds.size).toBe(allIds.length);
  });
});
