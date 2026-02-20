/**
 * Builder unit tests — v5 native defineApp API.
 *
 * Section-scoped field model: fields live inside Block.
 * Uses BuilderApp.create() for isolated testing (no DOM, no browser).
 */

import {
  BuilderApp,
  INITIAL_STATE,
  updateField,
} from "@apps/builder/app";
import { describe, expect, test } from "vitest";

describe("BuilderApp (v5 native)", () => {
  function createApp() {
    return BuilderApp.create();
  }

  /** Helper: read a section's field */
  function getField(
    app: ReturnType<typeof createApp>,
    sectionId: string,
    field: string,
  ): string | undefined {
    return app.state.data.blocks.find((s) => s.id === sectionId)?.fields[
      field
    ];
  }

  // ═══════════════════════════════════════════════════════════════════
  // updateField — sectionId + field 기반
  // ═══════════════════════════════════════════════════════════════════

  describe("updateField command", () => {
    test("기존 필드 값을 변경한다", () => {
      const app = createApp();
      expect(getField(app, "ncp-hero", "title")).toBe(
        INITIAL_STATE.data.blocks[0]!.fields["title"],
      );

      app.dispatch(
        updateField({
          sectionId: "ncp-hero",
          field: "title",
          value: "새로운 제목",
        }),
      );
      expect(getField(app, "ncp-hero", "title")).toBe("새로운 제목");
    });

    test("존재하지 않는 필드도 생성할 수 있다", () => {
      const app = createApp();
      expect(getField(app, "ncp-hero", "new-field")).toBeUndefined();

      app.dispatch(
        updateField({
          sectionId: "ncp-hero",
          field: "new-field",
          value: "Hello",
        }),
      );
      expect(getField(app, "ncp-hero", "new-field")).toBe("Hello");
    });

    test("빈 문자열로 업데이트 가능하다", () => {
      const app = createApp();
      app.dispatch(
        updateField({ sectionId: "ncp-hero", field: "title", value: "" }),
      );
      expect(getField(app, "ncp-hero", "title")).toBe("");
    });

    test("멀티라인 값을 유지한다", () => {
      const app = createApp();
      const multiline = "첫 줄\n둘째 줄\n셋째 줄";
      app.dispatch(
        updateField({
          sectionId: "ncp-hero",
          field: "title",
          value: multiline,
        }),
      );
      expect(getField(app, "ncp-hero", "title")).toBe(multiline);
    });

    test("다른 필드에 영향을 주지 않는다", () => {
      const app = createApp();
      const originalSub = getField(app, "ncp-hero", "sub")!;

      app.dispatch(
        updateField({
          sectionId: "ncp-hero",
          field: "title",
          value: "변경된 제목",
        }),
      );
      expect(getField(app, "ncp-hero", "sub")).toBe(originalSub);
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
          sectionId: "ncp-hero",
          field: "title",
          value: "캔버스에서 수정",
        }),
      );
      expect(getField(app, "ncp-hero", "title")).toBe("캔버스에서 수정");

      // 패널에서 같은 필드 편집
      app.dispatch(
        updateField({
          sectionId: "ncp-hero",
          field: "title",
          value: "패널에서 수정",
        }),
      );
      expect(getField(app, "ncp-hero", "title")).toBe("패널에서 수정");
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Reset & initial state
  // ═══════════════════════════════════════════════════════════════════

  describe("reset & initial state", () => {
    test("reset은 초기 상태로 복원한다", () => {
      const app = createApp();
      app.dispatch(
        updateField({ sectionId: "ncp-hero", field: "title", value: "변경됨" }),
      );

      app.reset();

      expect(getField(app, "ncp-hero", "title")).toBe(
        INITIAL_STATE.data.blocks[0]!.fields["title"],
      );
    });

    test("모든 NCP 블록 필드가 초기값으로 등록되어 있다", () => {
      const app = createApp();
      const sections = app.state.data.blocks;

      // Hero (id="ncp-hero")
      const hero = sections.find((s) => s.id === "ncp-hero")!;
      expect(hero.fields["title"]).toBeDefined();
      expect(hero.fields["sub"]).toBeDefined();
      expect(hero.fields["brand"]).toBeDefined();

      // News (id="ncp-news")
      const news = sections.find((s) => s.id === "ncp-news")!;
      expect(news.fields["title"]).toBeDefined();
      expect(news.fields["item-1-title"]).toBeDefined();

      // Services (id="ncp-services")
      const services = sections.find((s) => s.id === "ncp-services")!;
      expect(services.fields["title"]).toBeDefined();
      expect(services.children![0]!.fields["item-title"]).toBeDefined();

      // Footer (id="ncp-footer")
      const footer = sections.find((s) => s.id === "ncp-footer")!;
      expect(footer.fields["brand"]).toBeDefined();
      expect(footer.fields["desc"]).toBeDefined();
    });

  });

  // ═══════════════════════════════════════════════════════════════════
  // Section co-located fields — paste = deep clone
  // ═══════════════════════════════════════════════════════════════════

  describe("section co-located fields", () => {
    test("각 섹션은 자신만의 fields를 소유한다", () => {
      const app = createApp();
      const hero = app.state.data.blocks.find((s) => s.id === "ncp-hero")!;
      const news = app.state.data.blocks.find((s) => s.id === "ncp-news")!;

      // 서로 다른 title
      expect(hero.fields["title"]).not.toBe(news.fields["title"]);
    });

    test("updateField는 해당 섹션의 필드만 변경한다", () => {
      const app = createApp();
      const originalNewsTitle = app.state.data.blocks.find(
        (s) => s.id === "ncp-news",
      )!.fields["title"];

      app.dispatch(
        updateField({ sectionId: "ncp-hero", field: "title", value: "변경됨" }),
      );

      // Hero changed
      expect(
        app.state.data.blocks.find((s) => s.id === "ncp-hero")!.fields[
        "title"
        ],
      ).toBe("변경됨");
      // News unchanged
      expect(
        app.state.data.blocks.find((s) => s.id === "ncp-news")!.fields[
        "title"
        ],
      ).toBe(originalNewsTitle);
    });
  });
});
