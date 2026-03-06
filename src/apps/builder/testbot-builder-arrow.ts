/**
 * Builder Hierarchical Navigation — TestBot Scripts
 *
 * 빌더 캔버스의 계층별(section/group/item) 화살표 이동 + drillDown/Up 진단.
 *
 * 계층 구조 (Green Eye 프리셋):
 *   section: ge-hero, ge-notice, ge-features, ge-usecase, ge-detail, ...
 *   group:   ge-card-1, ge-card-2, ge-card-3 (ge-features의 자식)
 *   item:    ge-card-1-card-title, ge-card-1-card-desc (ge-card-1의 자식)
 *
 * 네비게이션:
 *   Arrow: 같은 레벨 형제 이동 (itemFilter가 data-level로 필터)
 *   Enter: 아래 레벨로 drill down (section→group→item→edit)
 *   \:     위 레벨로 drill up (item→group→section)
 */

import type { TestScript } from "@os-devtool/testing";

export const builderArrowNavScripts: TestScript[] = [
  // ─── §0: DOM Diagnostics ────────────────────────────────
  {
    name: "§0 진단: data-level DOM 속성 덤프",
    async run(page, expect) {
      // ge-features 클릭
      await page.locator("ge-features").click();
      await expect(page.locator("ge-features")).toBeFocused();

      // DOM에서 data-level 속성 직접 읽기
      const zoneEl = document.querySelector("[data-zone='canvas']");
      if (!zoneEl) throw new Error("canvas zone 엘리먼트를 못 찾음!");

      const items = zoneEl.querySelectorAll("[data-item]");
      const dump: string[] = [];
      for (const el of items) {
        const id = el.id;
        const level = el.getAttribute("data-level");
        const closestZone = el
          .closest("[data-zone]")
          ?.getAttribute("data-zone");
        dump.push(`${id}: level=${level}, zone=${closestZone}`);
      }

      // 10개만 보고
      const summary = dump.slice(0, 15).join("\n");
      const levelCounts = {
        section: dump.filter((d) => d.includes("level=section")).length,
        group: dump.filter((d) => d.includes("level=group")).length,
        item: dump.filter((d) => d.includes("level=item")).length,
        null: dump.filter((d) => d.includes("level=null")).length,
      };

      throw new Error(
        `DOM 아이템 ${items.length}개 발견\n` +
          `section=${levelCounts.section}, group=${levelCounts.group}, item=${levelCounts.item}, null=${levelCounts.null}\n` +
          `---\n${summary}`,
      );
    },
  },

  // ─── §0b: itemFilter 결과 진단 ────────────────────────
  {
    name: "§0b 진단: itemFilter 결과 (group 레벨)",
    async run(page, expect) {
      // ge-features 클릭 → Enter (drillDown to group)
      await page.locator("ge-features").click();
      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1")).toBeFocused();

      // 현재 focusedItemId 확인
      const zoneEl = document.querySelector("[data-zone='canvas']");
      if (!zoneEl) throw new Error("canvas zone 엘리먼트를 못 찾음!");

      // ge-card-1의 data-level
      const card1El = zoneEl.querySelector("#ge-card-1");
      const card1Level = card1El?.getAttribute("data-level") ?? "(null)";
      const card1ClosestZone = card1El
        ?.closest("[data-zone]")
        ?.getAttribute("data-zone");

      // 같은 level의 아이템 수
      const allItems = zoneEl.querySelectorAll("[data-item]");
      const sameLevel: string[] = [];
      const canvasDirectItems: string[] = [];
      for (const el of allItems) {
        const id = el.id ?? "";
        const level = el.getAttribute("data-level");
        const zone = el.closest("[data-zone]")?.getAttribute("data-zone");
        if (zone === "canvas") canvasDirectItems.push(`${id}(${level})`);
        if (level === card1Level) sameLevel.push(id);
      }

      throw new Error(
        `ge-card-1: data-level="${card1Level}", closest-zone="${card1ClosestZone}"\n` +
          `같은 level(${card1Level}) 아이템: ${sameLevel.length}개 → [${sameLevel.slice(0, 5).join(", ")}]\n` +
          `canvas 직속 아이템: ${canvasDirectItems.length}개 → [${canvasDirectItems.slice(0, 8).join(", ")}]`,
      );
    },
  },

  // ─── Level 1: Section ───────────────────────────────────
  {
    name: "§1 Section: 화살표 ↓ 이동 (ge-hero → ge-notice)",
    async run(page, expect) {
      await page.locator("ge-hero").click();
      await expect(page.locator("ge-hero")).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(page.locator("ge-hero")).not.toBeFocused();
      await expect(page.locator("ge-notice")).toBeFocused();
    },
  },
  {
    name: "§1 Section: 화살표 ↑ 역이동 (ge-notice → ge-hero)",
    async run(page, expect) {
      await page.locator("ge-notice").click();
      await expect(page.locator("ge-notice")).toBeFocused();

      await page.keyboard.press("ArrowUp");
      await expect(page.locator("ge-hero")).toBeFocused();
    },
  },

  // ─── Drill Down: Section → Group ────────────────────────
  {
    name: "§2 DrillDown: Enter로 section→group (ge-features → ge-card-1)",
    async run(page, expect) {
      await page.locator("ge-features").click();
      await expect(page.locator("ge-features")).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1")).toBeFocused();
    },
  },

  // ─── Level 2: Group ─────────────────────────────────────
  {
    name: "§3 Group: 화살표 ↓ 이동 (ge-card-1 → ge-card-2)",
    async run(page, expect) {
      await page.locator("ge-features").click();
      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1")).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(page.locator("ge-card-1")).not.toBeFocused();
      await expect(page.locator("ge-card-2")).toBeFocused();
    },
  },

  // ─── Drill Up: Group → Section ──────────────────────────
  {
    name: "§4 DrillUp: \\ 로 group→section (ge-card-1 → ge-features)",
    async run(page, expect) {
      await page.locator("ge-features").click();
      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1")).toBeFocused();
      await page.keyboard.press("\\");
      await expect(page.locator("ge-features")).toBeFocused();
    },
  },

  // ─── Drill Down: Group → Item ───────────────────────────
  {
    name: "§5 DrillDown: Enter로 group→item (ge-card-1 → 첫 번째 필드)",
    async run(page, expect) {
      await page.locator("ge-features").click();
      await expect(page.locator("ge-features")).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1")).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1-card-title")).toBeFocused();
    },
  },

  // ─── §0c: itemFilter 결과 진단 (item 레벨) ─────────────────
  {
    name: "§0c 진단: itemFilter 결과 (item 레벨 - ge-card-1-card-title)",
    async run(page, expect) {
      await page.locator("ge-features").click();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1-card-title")).toBeFocused();

      // 현재 focusedItemId 확인
      const zoneEl = document.querySelector("[data-zone='canvas']");
      if (!zoneEl) throw new Error("canvas zone 엘리먼트를 못 찾음!");

      const currentEl = zoneEl.querySelector(
        "#ge-card-1-card-title",
      );
      const currentLevel = currentEl?.getAttribute("data-level") ?? "(null)";
      const currentClosestZone = currentEl
        ?.closest("[data-zone]")
        ?.getAttribute("data-zone");

      const allItems = zoneEl.querySelectorAll("[data-item]");
      const sameLevel: string[] = [];
      const rects: string[] = [];

      for (const el of allItems) {
        const id = el.id ?? "";
        const level = el.getAttribute("data-level");
        const zone = el.closest("[data-zone]")?.getAttribute("data-zone");

        // item 레벨이면서 canvas 소속인 것만
        if (level === currentLevel && zone === "canvas") {
          sameLevel.push(id);
          // ge-card-1 에 속한 item들의 rect 비교 위해
          if (id.startsWith("ge-card-1-card-")) {
            const r = el.getBoundingClientRect();
            rects.push(
              `${id}: top=${Math.round(r.top)}, bottom=${Math.round(r.bottom)}, left=${Math.round(r.left)}, right=${Math.round(r.right)}`,
            );
          }
        }
      }

      throw new Error(
        `ge-card-1-card-title: data-level="${currentLevel}", closest-zone="${currentClosestZone}"\n` +
          `같은 level(${currentLevel}) + canvas 직속 아이템: ${sameLevel.length}개\n` +
          `-- ge-card-1 소속 아이템 Rects --\n${rects.join("\n")}`,
      );
    },
  },

  // ─── Level 3: Item ──────────────────────────────────────
  {
    name: "§6 Item: 화살표 ↓ 이동 (ge-card-1-card-title → desc)",
    async run(page, expect) {
      await page.locator("ge-features").click();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1-card-title")).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(page.locator("ge-card-1-card-title")).not.toBeFocused();
      await expect(page.locator("ge-card-1-card-desc")).toBeFocused();
    },
  },

  // ─── Full Round Trip ────────────────────────────────────
  {
    name: "§7 전체 여정: section→group→item→group→section",
    async run(page, expect) {
      await page.locator("ge-features").click();
      await expect(page.locator("ge-features")).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1")).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(page.locator("ge-card-1")).not.toBeFocused();

      await page.keyboard.press("\\");
      await expect(page.locator("ge-card-1")).toBeFocused();

      await page.keyboard.press("\\");
      await expect(page.locator("ge-features")).toBeFocused();
    },
  },
];
