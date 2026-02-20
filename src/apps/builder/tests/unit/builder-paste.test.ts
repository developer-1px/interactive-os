/**
 * Builder copy-paste reproduction test.
 * 
 * Reproduces: copy → paste → paste (연속) 시나리오
 * Uses withOS: true to include OS focus state for FOCUS command.
 */

import { BuilderApp, sidebarCollection } from "@apps/builder/app";
import { describe, expect, test } from "vitest";

describe("Builder copy → paste → paste 연속 실행", () => {
    function createApp() {
        return BuilderApp.create({ withOS: true });
    }

    test("copy → paste 1회: 섹션이 추가된다", () => {
        const app = createApp();
        const initialCount = app.state.data.sections.length;
        const heroId = app.state.data.sections[0]!.id;

        // Copy Hero
        app.dispatch(sidebarCollection.copy({ ids: [heroId] }));
        expect(app.state.ui.clipboard).not.toBeNull();
        expect(app.state.ui.clipboard!.items.length).toBe(1);

        // Paste
        app.dispatch(sidebarCollection.paste({ afterId: heroId }));
        expect(app.state.data.sections.length).toBe(initialCount + 1);

        // Clipboard should still be available for next paste
        expect(app.state.ui.clipboard).not.toBeNull();
    });

    test("copy → paste → paste 연속: 2번째 paste도 동작해야 한다", () => {
        const app = createApp();
        const initialCount = app.state.data.sections.length;
        const heroId = app.state.data.sections[0]!.id;

        // Copy Hero
        app.dispatch(sidebarCollection.copy({ ids: [heroId] }));

        // Paste 1
        app.dispatch(sidebarCollection.paste({ afterId: heroId }));
        const countAfterPaste1 = app.state.data.sections.length;
        expect(countAfterPaste1).toBe(initialCount + 1);

        // Paste 2 — this should also work
        const lastPastedId = app.state.data.sections[1]!.id; // pasted after hero
        app.dispatch(sidebarCollection.paste({ afterId: lastPastedId }));
        expect(app.state.data.sections.length).toBe(initialCount + 2);
    });

    test("clipboard 상태가 paste 후에도 유지되는지 확인", () => {
        const app = createApp();
        const heroId = app.state.data.sections[0]!.id;

        app.dispatch(sidebarCollection.copy({ ids: [heroId] }));
        const clipBefore = app.state.ui.clipboard;

        app.dispatch(sidebarCollection.paste({ afterId: heroId }));
        const clipAfter = app.state.ui.clipboard;

        // Clipboard should NOT be cleared after paste (only cut clears)
        expect(clipAfter).not.toBeNull();
        expect(clipAfter!.items.length).toBe(clipBefore!.items.length);
    });

    test("paste 3회 연속: 모두 다른 id를 가진다", () => {
        const app = createApp();
        const heroId = app.state.data.sections[0]!.id;

        app.dispatch(sidebarCollection.copy({ ids: [heroId] }));

        app.dispatch(sidebarCollection.paste({ afterId: heroId }));
        app.dispatch(sidebarCollection.paste({ afterId: heroId }));
        app.dispatch(sidebarCollection.paste({ afterId: heroId }));

        // 4 original + 3 pasted = 7
        expect(app.state.data.sections.length).toBe(7);

        // All IDs unique
        const ids = app.state.data.sections.map((s) => s.id);
        expect(new Set(ids).size).toBe(7);
    });
});
