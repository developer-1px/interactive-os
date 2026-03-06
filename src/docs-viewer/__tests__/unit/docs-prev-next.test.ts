/**
 * DocsViewer — Prev/Next Trigger Navigation
 *
 * Tests that PrevDocTrigger/NextDocTrigger (created via createTrigger with id)
 * are clickable standalone triggers that dispatch selectDoc.
 *
 * Headless limitation: standalone triggers (not in a Zone) require manual
 * ZoneRegistry.setItemCallback registration. This mirrors what TriggerBase
 * does in the browser via data-trigger-id + PointerListener.
 *
 * @spec docs/1-project/os-core/trigger-id/notes/2026-0306-plan-trigger-id.md
 */

import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { type AppPageInternal, createPage } from "@os-devtool/testing/page";
import { beforeEach, describe, expect, it } from "vitest";
import { DocsApp, resetDoc, selectDoc } from "../../app";

interface DocsState {
  activePath: string | null;
}

describe("Feature: Prev/Next Document Navigation via Trigger", () => {
  let page: AppPageInternal<DocsState>;

  beforeEach(() => {
    page = createPage(DocsApp);
    page.dispatch(selectDoc({ id: "docs/guide.md" }));

    // Register standalone trigger callbacks (mirrors TriggerBase browser behavior)
    ZoneRegistry.setItemCallback("__standalone__", "docs-prev", {
      onActivate: selectDoc({ id: "docs/intro.md" }),
    });
    ZoneRegistry.setItemCallback("__standalone__", "docs-next", {
      onActivate: selectDoc({ id: "docs/api.md" }),
    });
  });

  it("#1 clicking docs-prev trigger navigates to previous document", () => {
    page.click("docs-prev");
    expect(page.state.activePath).toBe("docs/intro.md");
  });

  it("#2 clicking docs-next trigger navigates to next document", () => {
    page.click("docs-next");
    expect(page.state.activePath).toBe("docs/api.md");
  });
});
