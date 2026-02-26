/**
 * headless-smoke — Browser path 시뮬레이션.
 *
 * collectionBindings().onPaste(cursor)를 통한 경로 검증.
 * 브라우저에서 OS_PASTE가 호출하는 것과 동일한 경로.
 */

import { sidebarCollection } from "@apps/builder/app";
import type { BuilderState } from "@apps/builder/model/appState";
import { INITIAL_STATE } from "@apps/builder/model/appState";
import type { AppState } from "@os/kernel";
import { initialAppState, os } from "@os/kernel";
import { beforeEach, describe, expect, it } from "vitest";
import {
  _resetClipboardStore,
  readClipboard,
} from "@/os/collection/createCollectionZone";

function builderState(): BuilderState {
  return (os.getState() as AppState).apps["builder"] as BuilderState;
}

describe("Browser path 시뮬레이션", () => {
  beforeEach(() => {
    _resetClipboardStore();
    os.setState(() => ({
      ...initialAppState,
      apps: { ...initialAppState.apps, builder: INITIAL_STATE },
    }));
  });

  it("collectionBindings 경로: copy → paste → paste", () => {
    const bindings = sidebarCollection.collectionBindings();
    const blocks = () => builderState().data.blocks;

    // Step 1: Copy via bindings (브라우저 경로)
    const copyCmd = bindings.onCopy({ focusId: "ge-hero", selection: [] });
    const cmds = Array.isArray(copyCmd) ? copyCmd : [copyCmd];
    cmds.forEach(c => os.dispatch(c));

    const clip = readClipboard() as any;
    expect(clip).toBeTruthy();

    // Step 2: Paste 1회 via bindings
    const paste1 = bindings.onPaste({ focusId: "ge-hero", selection: [] });
    const cmds1 = Array.isArray(paste1) ? paste1 : [paste1];
    cmds1.forEach(c => os.dispatch(c));

    const afterPaste1 = blocks();
    expect(afterPaste1.length).toBe(6);

    // 새로 추가된 아이템의 ID (ncp-hero 다음 위치)
    const newItemId = afterPaste1[1]!.id;

    // Step 3: Paste 2회 (focusId = 새 아이템, 브라우저처럼)
    const paste2 = bindings.onPaste({ focusId: newItemId, selection: [] });
    const cmds2 = Array.isArray(paste2) ? paste2 : [paste2];
    cmds2.forEach(c => os.dispatch(c));

    const afterPaste2 = blocks();
    expect(afterPaste2.length).toBe(7);
  });

  it("extractId 동작 확인", () => {
    const bindings = sidebarCollection.collectionBindings();

    // sidebar- prefix가 붙은 경우
    const cmd1 = bindings.onPaste({
      focusId: "sidebar-ge-hero",
      selection: [],
    });
    expect(cmd1).toBeTruthy();

    // prefix 없는 경우
    const cmd2 = bindings.onPaste({ focusId: "ge-hero", selection: [] });
    expect(cmd2).toBeTruthy();

    // 동적 ID (paste 후 생성된 것)
    const cmd3 = bindings.onPaste({ focusId: "w67k1k3l", selection: [] });
    expect(cmd3).toBeTruthy();
  });
});
