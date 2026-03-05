/**
 * router() AppModule — Red Tests
 *
 * Tests the router module interface and middleware behavior:
 * - T1: Module interface (id, install)
 * - T2: Forward sync — activePath change → router.navigate()
 * - T3: GO_BACK/GO_FORWARD → router.history.back()/forward()
 *
 * Uses createPage(App) + click/keyboard.press — no direct dispatch.
 */

import { Keybindings } from "@os-core/2-resolve/keybindings";
import { type AppPage, createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp";
import { produce } from "immer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type RouterInstance, router } from "../../router";

// Listbox role: click focuses, Enter activates (triggers onAction).
// Use click + Enter sequence to test forward sync.

// ═══════════════════════════════════════════════════════════════════
// Mock Router
// ═══════════════════════════════════════════════════════════════════

function createMockRouter(): RouterInstance {
  return {
    navigate: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    history: {
      back: vi.fn(),
      forward: vi.fn(),
    },
    state: { location: { pathname: "/docs" } },
  };
}

// ═══════════════════════════════════════════════════════════════════
// Test App
// ═══════════════════════════════════════════════════════════════════

interface TestState {
  activePath: string | null;
}

const INITIAL: TestState = { activePath: null };

// ═══════════════════════════════════════════════════════════════════
// T1: Module interface
// ═══════════════════════════════════════════════════════════════════

describe("T1: router() module interface", () => {
  it("returns an AppModule with id and install", () => {
    const mock = createMockRouter();
    const mod = router({ instance: mock });
    expect(mod).toHaveProperty("id", "router");
    expect(mod).toHaveProperty("install");
    expect(typeof mod.install).toBe("function");
  });
});

// ═══════════════════════════════════════════════════════════════════
// T2: Forward sync — activePath change → navigate
// ═══════════════════════════════════════════════════════════════════

describe("T2: Forward sync", () => {
  let mock: RouterInstance;
  let page: AppPage<TestState>;

  beforeEach(() => {
    mock = createMockRouter();
    const App = defineApp<TestState>("test-router-fwd", INITIAL, {
      modules: [router({ instance: mock, basePath: "/docs" })],
    });

    const selectDoc = App.command(
      "SELECT_DOC",
      (ctx, payload: { id: string }) => ({
        state: produce(ctx.state, (draft) => {
          draft.activePath = payload.id;
        }),
      }),
    );

    const zone = App.createZone("test-zone");
    zone.bind({
      role: "listbox",
      onAction: (cursor) => selectDoc({ id: cursor.focusId }),
    });

    page = createPage(App);
    page.goto("test-zone");
  });

  it("calls router.navigate when activePath changes", () => {
    page.click("readme.md");
    page.keyboard.press("Enter");
    expect(mock.navigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: "/docs/readme.md" }),
    );
  });

  it("does not navigate when activePath is unchanged", () => {
    page.click("readme.md");
    page.keyboard.press("Enter");
    (mock.navigate as ReturnType<typeof vi.fn>).mockClear();
    page.keyboard.press("Enter");
    expect(mock.navigate).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════
// T3: GO_BACK / GO_FORWARD → router history
// ═══════════════════════════════════════════════════════════════════

describe("T3: Back/Forward delegation", () => {
  let mock: RouterInstance;
  let page: AppPage<TestState>;
  let unregister: () => void;

  beforeEach(() => {
    mock = createMockRouter();
    const App = defineApp<TestState>("test-router-nav", INITIAL, {
      modules: [router({ instance: mock, basePath: "/docs" })],
    });

    const goBack = App.command("GO_BACK", (ctx) => ({
      state: ctx.state,
    }));

    const goForward = App.command("GO_FORWARD", (ctx) => ({
      state: ctx.state,
    }));

    const zone = App.createZone("test-zone");
    zone.bind({ role: "listbox" });

    unregister = Keybindings.registerAll([
      { key: "Alt+ArrowLeft", command: goBack() },
      { key: "Alt+ArrowRight", command: goForward() },
    ]);

    page = createPage(App);
    page.goto("test-zone");
  });

  afterEach(() => {
    unregister?.();
  });

  it("GO_BACK calls router.history.back()", () => {
    page.keyboard.press("Alt+ArrowLeft");
    expect(mock.history.back).toHaveBeenCalled();
  });

  it("GO_FORWARD calls router.history.forward()", () => {
    page.keyboard.press("Alt+ArrowRight");
    expect(mock.history.forward).toHaveBeenCalled();
  });
});
