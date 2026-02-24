/**
 * T20: When Router Extension — Canvas Zone Decision Table
 *
 * Decision Table: docs/1-project/builder-v2/notes/2026-0224-decision-table-when-router.md
 *
 * 구조:
 *   1차 분기 (OS): Zone × 물리적 입력 × OS 조건 → 의도
 *   2차 분기 (App): 의도 × App 조건(level) → 커맨드
 *   Full Path: page.keyboard.press → page.focusedItemId / page.osState
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { createOsPage, type OsPage } from "@os/createOsPage";
import { Keybindings } from "@os/keymaps/keybindings";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createCanvasItemFilter,
  createDrillDown,
  createDrillUp,
} from "../../features/hierarchicalNavigation";

const ZONE_ID = "builder-canvas";

/**
 * DOM tree for canvas zone:
 *
 *   [zone: builder-canvas, role: grid]
 *     s1 (section)
 *       └── g1 (group)
 *             ├── i1 (item)
 *             └── i2 (item)
 *     s2 (section, no children)
 */
function buildTestDOM(): HTMLDivElement {
  const container = document.createElement("div");
  container.id = ZONE_ID;
  container.setAttribute("data-zone", ZONE_ID);

  const s1 = document.createElement("div");
  s1.setAttribute("data-item-id", "s1");
  s1.setAttribute("data-level", "section");

  const g1 = document.createElement("div");
  g1.setAttribute("data-item-id", "g1");
  g1.setAttribute("data-level", "group");

  const i1 = document.createElement("div");
  i1.setAttribute("data-item-id", "i1");
  i1.setAttribute("data-level", "item");

  const i2 = document.createElement("div");
  i2.setAttribute("data-item-id", "i2");
  i2.setAttribute("data-level", "item");

  g1.appendChild(i1);
  g1.appendChild(i2);
  s1.appendChild(g1);

  const s2 = document.createElement("div");
  s2.setAttribute("data-item-id", "s2");
  s2.setAttribute("data-level", "section");

  container.appendChild(s1);
  container.appendChild(s2);
  document.body.appendChild(container);
  return container;
}

function setupCanvasPage() {
  const container = buildTestDOM();
  const page = createOsPage();

  page.goto(ZONE_ID, {
    items: ["s1", "g1", "i1", "i2", "s2"],
    config: {
      activate: { onClick: true, reClickOnly: true },
      dismiss: { escape: "none" },
    },
    onAction: createDrillDown(ZONE_ID),
  });

  ZoneRegistry.register(ZONE_ID, {
    config: {
      activate: { onClick: true, reClickOnly: true },
      dismiss: { escape: "none" },
    } as any,
    element: container,
    parentId: null,
    itemFilter: createCanvasItemFilter(ZONE_ID),
    onAction: createDrillDown(ZONE_ID),
  });

  const unregisterKeybindings = Keybindings.registerAll([
    { key: "\\", command: createDrillUp(ZONE_ID), when: "navigating" },
    { key: "Escape", command: createDrillUp(ZONE_ID), when: "navigating" },
  ]);

  return { page, container, unregisterKeybindings };
}

// ═══════════════════════════════════════════════════════════════
// 1차 분기: Zone=canvas, isEditing=false → 의도=activate
// 2차 분기: level → 커맨드
// ═══════════════════════════════════════════════════════════════

describe("canvas × Enter × !editing → activate", () => {
  let page: OsPage;
  let container: HTMLDivElement;
  let cleanup: () => void;

  beforeEach(() => {
    const setup = setupCanvasPage();
    page = setup.page;
    container = setup.container;
    cleanup = () => {
      setup.unregisterKeybindings();
      page.cleanup();
      container.remove();
    };
  });

  afterEach(() => cleanup());

  // #1: activate × level=section → drillToFirstChild
  it("#1 Enter at section → focuses first child (group)", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "s1" }));
    expect(page.focusedItemId()).toBe("s1");

    page.keyboard.press("Enter");

    expect(page.focusedItemId()).toBe("g1");
  });

  // #2: activate × level=group → drillToFirstChild
  it("#2 Enter at group → focuses first child (item)", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "g1" }));

    page.keyboard.press("Enter");

    expect(page.focusedItemId()).toBe("i1");
  });

  // #3: activate × level=item → startFieldEdit
  it("#3 Enter at item → starts field editing", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "i1" }));

    page.keyboard.press("Enter");

    const zoneState = page.zone(ZONE_ID);
    expect(zoneState?.editingItemId).toBe("i1");
  });
});

// ═══════════════════════════════════════════════════════════════
// 1차 분기: Zone=canvas, isEditing=false → 의도=dismiss
// 2차 분기: level → 커맨드
// ═══════════════════════════════════════════════════════════════

describe("canvas × Escape × !editing → dismiss", () => {
  let page: OsPage;
  let container: HTMLDivElement;
  let cleanup: () => void;

  beforeEach(() => {
    const setup = setupCanvasPage();
    page = setup.page;
    container = setup.container;
    cleanup = () => {
      setup.unregisterKeybindings();
      page.cleanup();
      container.remove();
    };
  });

  afterEach(() => cleanup());

  // #4: dismiss × level=item → drillToParent
  it("#4 Escape at item → focuses parent group", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "i1" }));

    page.keyboard.press("Escape");

    expect(page.focusedItemId()).toBe("g1");
  });

  // #5: dismiss × level=group → drillToParent
  it("#5 Escape at group → focuses parent section", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "g1" }));

    page.keyboard.press("Escape");

    expect(page.focusedItemId()).toBe("s1");
  });

  // #6: dismiss × level=section → forceDeselect
  it("#6 Escape at section → deselects (focusedItemId=null)", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "s1" }));

    page.keyboard.press("Escape");

    expect(page.focusedItemId()).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// 1차 분기: Zone=canvas, \, isEditing=false → 의도=dismiss (keybinding)
// 2차 분기: level → 커맨드 (Escape과 동일)
// ═══════════════════════════════════════════════════════════════

describe("canvas × \\ × !editing → dismiss (keybinding)", () => {
  let page: OsPage;
  let container: HTMLDivElement;
  let cleanup: () => void;

  beforeEach(() => {
    const setup = setupCanvasPage();
    page = setup.page;
    container = setup.container;
    cleanup = () => {
      setup.unregisterKeybindings();
      page.cleanup();
      container.remove();
    };
  });

  afterEach(() => cleanup());

  // #7: dismiss × level=item → drillToParent
  it("#7 \\ at item → focuses parent group", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "i1" }));

    page.keyboard.press("\\");

    expect(page.focusedItemId()).toBe("g1");
  });

  // #8: dismiss × level=group → drillToParent
  it("#8 \\ at group → focuses parent section", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "g1" }));

    page.keyboard.press("\\");

    expect(page.focusedItemId()).toBe("s1");
  });

  // #9: dismiss × level=section → forceDeselect
  it("#9 \\ at section → deselects (focusedItemId=null)", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "s1" }));

    page.keyboard.press("\\");

    expect(page.focusedItemId()).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// 1차 분기: Zone=canvas, isEditing=true → 의도=field_commit / field_cancel
// 2차 분기: 없음 (단일 경로)
// ═══════════════════════════════════════════════════════════════

describe("canvas × Enter/Escape × editing → field_commit / field_cancel", () => {
  let page: OsPage;
  let container: HTMLDivElement;
  let cleanup: () => void;

  beforeEach(() => {
    const setup = setupCanvasPage();
    page = setup.page;
    container = setup.container;
    cleanup = () => {
      setup.unregisterKeybindings();
      page.cleanup();
      container.remove();
    };
  });

  afterEach(() => cleanup());

  // #10: Enter × isEditing=true → field_commit
  // TODO: field commit/cancel headless 파이프라인 구현 후 활성화
  it.todo("#10 Enter while editing → commits field (editingItemId=null)");

  // #11: Escape × isEditing=true → field_cancel
  // TODO: field commit/cancel headless 파이프라인 구현 후 활성화
  it.todo("#11 Escape while editing → cancels field (editingItemId=null)");
});

// ═══════════════════════════════════════════════════════════════
// 경계 케이스
// ═══════════════════════════════════════════════════════════════

describe("canvas — boundary cases", () => {
  let page: OsPage;
  let container: HTMLDivElement;
  let cleanup: () => void;

  beforeEach(() => {
    const setup = setupCanvasPage();
    page = setup.page;
    container = setup.container;
    cleanup = () => {
      setup.unregisterKeybindings();
      page.cleanup();
      container.remove();
    };
  });

  afterEach(() => cleanup());

  // E2: Escape cascade: item → group → section → null
  it("E2 Escape cascade: i1 → g1 → s1 → null", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "i1" }));

    page.keyboard.press("Escape");
    expect(page.focusedItemId()).toBe("g1");

    page.keyboard.press("Escape");
    expect(page.focusedItemId()).toBe("s1");

    page.keyboard.press("Escape");
    expect(page.focusedItemId()).toBeNull();
  });

  // E3: Escape와 \는 같은 결과
  it("E3 Escape and \\ produce identical results from same position", () => {
    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "i1" }));
    page.keyboard.press("Escape");
    const afterEsc = page.focusedItemId();

    page.dispatch(page.OS_FOCUS({ zoneId: ZONE_ID, itemId: "i1" }));
    page.keyboard.press("\\");
    const afterBackslash = page.focusedItemId();

    expect(afterEsc).toBe(afterBackslash);
  });
});
