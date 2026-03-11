/**
 * createPage — Playwright-isomorphic headless test page factory.
 *
 * Composes lib functions to create a Page (Playwright subset).
 * No OS methods exposed — all observation goes through page.locator().
 */

import { os } from "@os-core/engine/kernel";
import type { AppHandle } from "@os-sdk/app/defineApp/types";
import type { FC } from "react";
import { createLocator } from "./lib/locator";
import { createProjection, type Projection } from "./lib/projection";
import { setupHeadlessEnv } from "./lib/setupHeadlessEnv";
import { typeIntoField } from "./lib/typeIntoField";
import { registerZones, seedInitialState } from "./lib/zoneSetup";
import { simulateClick, simulateKeyPress } from "./simulate";
import type { Page } from "./types";

// Ensure OS defaults are registered
import "@os-core/2-resolve/osDefaults";

export type { ItemAttrs } from "@os-core/3-inject/headless.types";
export { formatDiagnostics } from "./diagnostics";

/**
 * Create a headless test page — Playwright isomorphic.
 *
 * Returns { page, cleanup }:
 * - page: Page interface (goto, click, keyboard, locator, content)
 * - cleanup: teardown function for afterEach()
 *
 * page is the ONLY test API. All actions and assertions go through page.
 *
 * Usage:
 *   const { page, cleanup } = createPage(app, Component);
 *   afterEach(() => cleanup());
 *   page.goto("/");
 *   page.keyboard.press("ArrowDown");
 *   await expect(page.locator(":focus")).toBeFocused();
 */
export function createPage<S>(
  app: AppHandle<S>,
  Component?: FC,
): { page: Page; cleanup: () => void } {
  const env = setupHeadlessEnv(app.__appKeybindings);
  const projection: Projection | null = Component
    ? createProjection(Component)
    : null;

  function invalidate(): void {
    if (projection) projection.invalidate(env.zonesWithBindingGetItems);
  }

  const page: Page = {
    goto(url: string) {
      if (!url.startsWith("/")) {
        throw new Error(
          `page.goto() accepts URLs only (must start with "/"). Got "${url}".`,
        );
      }
      registerZones(app.__zoneBindings, env);
      for (const zoneName of app.__zoneBindings.keys()) {
        seedInitialState(zoneName);
      }
      if (projection) projection.render();
      invalidate();
    },

    click(selector, opts?) {
      simulateClick(os, selector, opts);
      invalidate();
    },

    keyboard: {
      press(key: string) {
        simulateKeyPress(os, key);
        invalidate();
      },
      type(text: string) {
        typeIntoField(text);
      },
    },

    locator(selector: string) {
      return createLocator(selector, projection);
    },

    content() {
      if (!projection) {
        throw new Error(
          "page.content() requires a Component. Use createPage(app, Component).",
        );
      }
      return projection.render();
    },
  };

  return { page, cleanup: env.cleanup };
}
