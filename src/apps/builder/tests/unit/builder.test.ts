/**
 * Builder unit tests — v5 native defineApp API.
 *
 * Section-scoped field model: fields live inside Block.
 * Uses BuilderApp.create() for isolated testing (no DOM, no browser).
 *
 * NOTE: INITIAL_STATE uses GreenEye preset with nested tab structure.
 *   Top-level blocks: ge-hero, ge-tab-nav, ge-related-services, ge-section-footer, ge-footer
 *   Nested blocks (inside tabs): ge-notice, ge-features, ge-detail, ge-usecase, ge-resources
 */

import {
  BuilderApp,
  INITIAL_STATE,
  updateField,
} from "@apps/builder/app";
import { findBlock } from "@apps/builder/model/appState";
import { describe, expect, test } from "vitest";

describe("BuilderApp (v5 native)", () => {
  function createApp() {
    return BuilderApp.create();
  }

  /** Helper: read a block's field (recursive search) */
  function getField(
    app: ReturnType<typeof createApp>,
    sectionId: string,
    field: string,
  ): string | undefined {
    return findBlock(app.state.data.blocks, sectionId)?.fields[field];
  }

  // ═══════════════════════════════════════════════════════════════════
  // updateField — sectionId + field 기반
  // ═══════════════════════════════════════════════════════════════════

  describe("updateField command", () => {
    test("기존 필드 값을 변경한다", () => {
      const app = createApp();
      expect(getField(app, "ge-hero", "service-name")).toBe(
        INITIAL_STATE.data.blocks[0]!.fields["service-name"],
      );

      app.dispatch(
        updateField({
          sectionId: "ge-hero",
          field: "service-name",
          value: "새로운 서비스명",
        }),
      );
      expect(getField(app, "ge-hero", "service-name")).toBe("새로운 서비스명");
    });

    test("존재하지 않는 필드도 생성할 수 있다", () => {
      const app = createApp();
      expect(getField(app, "ge-hero", "new-field")).toBeUndefined();

      app.dispatch(
        updateField({
          sectionId: "ge-hero",
          field: "new-field",
          value: "Hello",
        }),
      );
      expect(getField(app, "ge-hero", "new-field")).toBe("Hello");
    });

    test("빈 문자열로 업데이트 가능하다", () => {
      const app = createApp();
      app.dispatch(
        updateField({ sectionId: "ge-hero", field: "service-name", value: "" }),
      );
      expect(getField(app, "ge-hero", "service-name")).toBe("");
    });

    test("멀티라인 값을 유지한다", () => {
      const app = createApp();
      const multiline = "첫 줄\n둘째 줄\n셋째 줄";
      app.dispatch(
        updateField({
          sectionId: "ge-hero",
          field: "service-name",
          value: multiline,
        }),
      );
      expect(getField(app, "ge-hero", "service-name")).toBe(multiline);
    });

    test("다른 필드에 영향을 주지 않는다", () => {
      const app = createApp();
      const originalDesc = getField(app, "ge-hero", "service-desc")!;

      app.dispatch(
        updateField({
          sectionId: "ge-hero",
          field: "service-name",
          value: "변경된 서비스명",
        }),
      );
      expect(getField(app, "ge-hero", "service-desc")).toBe(originalDesc);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 양방향 동기화 증명 — 캔버스 = 패널 = 같은 커맨드
  // ═══════════════════════════════════════════════════════════════════

  describe("양방향 동기화 (캔버스 ↔ 패널)", () => {
    test("캔버스 인라인 편집과 패널 편집은 같은 커맨드를 사용한다", () => {
      const app = createApp();

      // 캔버스에서 인라인 편집
      app.dispatch(
        updateField({
          sectionId: "ge-hero",
          field: "service-name",
          value: "캔버스에서 수정",
        }),
      );
      expect(getField(app, "ge-hero", "service-name")).toBe("캔버스에서 수정");

      // 패널에서 같은 필드 편집
      app.dispatch(
        updateField({
          sectionId: "ge-hero",
          field: "service-name",
          value: "패널에서 수정",
        }),
      );
      expect(getField(app, "ge-hero", "service-name")).toBe("패널에서 수정");
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Reset & initial state
  // ═══════════════════════════════════════════════════════════════════

  describe("reset & initial state", () => {
    test("reset은 초기 상태로 복원한다", () => {
      const app = createApp();
      app.dispatch(
        updateField({ sectionId: "ge-hero", field: "service-name", value: "변경됨" }),
      );

      app.reset();

      expect(getField(app, "ge-hero", "service-name")).toBe(
        INITIAL_STATE.data.blocks[0]!.fields["service-name"],
      );
    });

    test("모든 GreenEye 블록 필드가 초기값으로 등록되어 있다", () => {
      const app = createApp();
      const blocks = app.state.data.blocks;

      // Hero (top-level, id="ge-hero")
      const hero = findBlock(blocks, "ge-hero")!;
      expect(hero.fields["service-name"]).toBeDefined();
      expect(hero.fields["service-desc"]).toBeDefined();
      expect(hero.fields["cta-primary"]).toBeDefined();

      // Notice (nested in tab, id="ge-notice")
      const notice = findBlock(blocks, "ge-notice")!;
      expect(notice.fields["label"]).toBeDefined();
      expect(notice.fields["text"]).toBeDefined();

      // Features (nested in tab, id="ge-features")
      const features = findBlock(blocks, "ge-features")!;
      expect(features.fields["section-title"]).toBeDefined();
      expect(features.children!.length).toBeGreaterThan(0);

      // Footer (top-level, id="ge-footer")
      const footer = findBlock(blocks, "ge-footer")!;
      expect(footer.fields["brand"]).toBeDefined();
      expect(footer.fields["desc"]).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Section co-located fields — different blocks have independent fields
  // ═══════════════════════════════════════════════════════════════════

  describe("section co-located fields", () => {
    test("각 섹션은 자신만의 fields를 소유한다", () => {
      const app = createApp();
      const hero = findBlock(app.state.data.blocks, "ge-hero")!;
      const footer = findBlock(app.state.data.blocks, "ge-footer")!;

      // Both exist with different field sets
      expect(hero.fields["service-name"]).toBeDefined();
      expect(footer.fields["brand"]).toBeDefined();
      expect(hero.fields["service-name"]).not.toBe(footer.fields["brand"]);
    });

    test("updateField는 해당 섹션의 필드만 변경한다", () => {
      const app = createApp();
      const originalFooterBrand = findBlock(
        app.state.data.blocks,
        "ge-footer",
      )!.fields["brand"];

      app.dispatch(
        updateField({ sectionId: "ge-hero", field: "service-name", value: "변경됨" }),
      );

      // Hero changed
      expect(
        findBlock(app.state.data.blocks, "ge-hero")!.fields["service-name"],
      ).toBe("변경됨");
      // Footer unchanged
      expect(
        findBlock(app.state.data.blocks, "ge-footer")!.fields["brand"],
      ).toBe(originalFooterBrand);
    });
  });
});
