/**
 * headless-smoke — Browser path 시뮬레이션.
 *
 * collectionBindings().onPaste(cursor)를 통한 경로 검증.
 * 브라우저에서 OS_PASTE가 호출하는 것과 동일한 경로.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { os } from "@os/kernel";
import type { AppState } from "@os/kernel";
import { initialAppState } from "@os/kernel";
import { sidebarCollection } from "@apps/builder/app";
import { INITIAL_STATE } from "@apps/builder/model/appState";
import type { BuilderState } from "@apps/builder/model/appState";
import { _resetClipboardStore } from "@/os/collection/createCollectionZone";

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

        console.log("초기:", blocks().map(b => b.id));

        // Step 1: Copy via bindings (브라우저 경로)
        const copyCmd = bindings.onCopy({ focusId: "ncp-hero", selection: [] });
        console.log("copyCmd:", copyCmd);
        os.dispatch(copyCmd);

        const clip = (os.getState() as any).os.clipboard;
        console.log("clipboard:", clip?.items?.map((i: any) => i.id));

        // Step 2: Paste 1회 via bindings
        const paste1 = bindings.onPaste({ focusId: "ncp-hero", selection: [] });
        console.log("paste1 cmd:", paste1);
        os.dispatch(paste1);

        const afterPaste1 = blocks();
        console.log("paste1 후:", afterPaste1.map(b => `${b.id}(${b.label})`));
        expect(afterPaste1.length).toBe(7);

        // 새로 추가된 아이템의 ID (ncp-hero 다음 위치)
        const newItemId = afterPaste1[1]!.id;
        console.log("새 아이템 ID:", newItemId);

        // Step 3: Paste 2회 (focusId = 새 아이템, 브라우저처럼)
        const paste2 = bindings.onPaste({ focusId: newItemId, selection: [] });
        console.log("paste2 cmd:", paste2);
        os.dispatch(paste2);

        const afterPaste2 = blocks();
        console.log("paste2 후:", afterPaste2.map(b => `${b.id}(${b.label})`));
        expect(afterPaste2.length).toBe(8);
    });

    it("extractId 동작 확인", () => {
        const bindings = sidebarCollection.collectionBindings();

        // sidebar- prefix가 붙은 경우
        const cmd1 = bindings.onPaste({ focusId: "sidebar-ncp-hero", selection: [] });
        console.log("sidebar-ncp-hero →", cmd1);

        // prefix 없는 경우
        const cmd2 = bindings.onPaste({ focusId: "ncp-hero", selection: [] });
        console.log("ncp-hero →", cmd2);

        // 동적 ID (paste 후 생성된 것)
        const cmd3 = bindings.onPaste({ focusId: "w67k1k3l", selection: [] });
        console.log("w67k1k3l →", cmd3);
    });
});
