/**
 * Builder unit tests — testing defineApp + createWidget pattern for CMS domain.
 *
 * Uses BuilderApp.create() for isolated testing (no DOM, no browser).
 * Validates: CRUD on flat field map, selection state, selectors, widget separation.
 */

import { BuilderApp, INITIAL_STATE } from "@apps/builder/app";
import { describe, expect, test } from "vitest";

describe("BuilderApp (defineApp + createWidget)", () => {
  function createApp() {
    return BuilderApp.create();
  }

  // ═══════════════════════════════════════════════════════════════════
  // updateField — 핵심 커맨드
  // ═══════════════════════════════════════════════════════════════════

  describe("updateField command", () => {
    test("기존 필드 값을 변경한다", () => {
      const app = createApp();
      expect(app.state.data.fields["ncp-hero-title"]).toBe(
        INITIAL_STATE.data.fields["ncp-hero-title"],
      );

      app.dispatch.updateField({
        name: "ncp-hero-title",
        value: "새로운 제목",
      });
      expect(app.state.data.fields["ncp-hero-title"]).toBe("새로운 제목");
    });

    test("존재하지 않는 필드도 생성할 수 있다", () => {
      const app = createApp();
      expect(app.state.data.fields["new-field"]).toBeUndefined();

      app.dispatch.updateField({ name: "new-field", value: "Hello" });
      expect(app.state.data.fields["new-field"]).toBe("Hello");
    });

    test("빈 문자열로 업데이트 가능하다", () => {
      const app = createApp();
      app.dispatch.updateField({ name: "ncp-hero-title", value: "" });
      expect(app.state.data.fields["ncp-hero-title"]).toBe("");
    });

    test("멀티라인 값을 유지한다", () => {
      const app = createApp();
      const multiline = "첫 줄\n둘째 줄\n셋째 줄";
      app.dispatch.updateField({ name: "ncp-hero-title", value: multiline });
      expect(app.state.data.fields["ncp-hero-title"]).toBe(multiline);
    });

    test("다른 필드에 영향을 주지 않는다", () => {
      const app = createApp();
      const originalSub = app.state.data.fields["ncp-hero-sub"];

      app.dispatch.updateField({
        name: "ncp-hero-title",
        value: "변경된 제목",
      });
      expect(app.state.data.fields["ncp-hero-sub"]).toBe(originalSub);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // selectElement — 선택 상태 관리
  // ═══════════════════════════════════════════════════════════════════

  describe("selectElement command", () => {
    test("요소를 선택하면 ui 상태가 갱신된다", () => {
      const app = createApp();
      expect(app.state.ui.selectedId).toBeNull();
      expect(app.state.ui.selectedType).toBeNull();

      app.dispatch.selectElement({ id: "ncp-hero-title", type: "text" });
      expect(app.state.ui.selectedId).toBe("ncp-hero-title");
      expect(app.state.ui.selectedType).toBe("text");
    });

    test("null로 선택 해제할 수 있다", () => {
      const app = createApp();
      app.dispatch.selectElement({ id: "ncp-hero-title", type: "text" });
      app.dispatch.selectElement({ id: null, type: null });
      expect(app.state.ui.selectedId).toBeNull();
      expect(app.state.ui.selectedType).toBeNull();
    });

    test("다른 요소로 전환하면 이전 선택이 덮어씌워진다", () => {
      const app = createApp();
      app.dispatch.selectElement({ id: "ncp-hero-title", type: "text" });
      app.dispatch.selectElement({ id: "ncp-hero-cta", type: "button" });
      expect(app.state.ui.selectedId).toBe("ncp-hero-cta");
      expect(app.state.ui.selectedType).toBe("button");
    });

    test("section 타입도 선택 가능하다", () => {
      const app = createApp();
      app.dispatch.selectElement({ id: "ncp-hero", type: "section" });
      expect(app.state.ui.selectedType).toBe("section");
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Selectors
  // ═══════════════════════════════════════════════════════════════════

  describe("selectors", () => {
    test("fieldValue는 해당 필드 값을 반환한다", () => {
      const app = createApp();
      expect(app.select.fieldValue("ncp-hero-title")).toBe(
        INITIAL_STATE.data.fields["ncp-hero-title"],
      );
    });

    test("fieldValue는 존재하지 않는 필드에 빈 문자열을 반환한다", () => {
      const app = createApp();
      expect(app.select.fieldValue("non-existent")).toBe("");
    });

    test("fieldValue는 updateField 후 갱신된 값을 반환한다", () => {
      const app = createApp();
      app.dispatch.updateField({
        name: "ncp-hero-title",
        value: "업데이트됨",
      });
      expect(app.select.fieldValue("ncp-hero-title")).toBe("업데이트됨");
    });

    test("selectedId는 현재 선택 상태를 반환한다", () => {
      const app = createApp();
      expect(app.select.selectedId()).toBeNull();
      app.dispatch.selectElement({ id: "test-id", type: "text" });
      expect(app.select.selectedId()).toBe("test-id");
    });

    test("selectedType은 현재 선택 타입을 반환한다", () => {
      const app = createApp();
      expect(app.select.selectedType()).toBeNull();
      app.dispatch.selectElement({ id: "test-id", type: "image" });
      expect(app.select.selectedType()).toBe("image");
    });

    test("allFields는 전체 필드 맵을 반환한다", () => {
      const app = createApp();
      const fields = app.select.allFields();
      expect(fields).toEqual(INITIAL_STATE.data.fields);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 양방향 동기화 증명 — 캔버스 = 패널 = 같은 커맨드
  // ═══════════════════════════════════════════════════════════════════

  describe("양방향 동기화 (캔버스 ↔ 패널)", () => {
    test("캔버스 인라인 편집과 패널 편집은 같은 커맨드를 사용한다", () => {
      const app = createApp();

      // 시나리오: 캔버스에서 인라인 편집 (onCommit → updateField)
      app.dispatch.updateField({
        name: "ncp-hero-title",
        value: "캔버스에서 수정",
      });
      expect(app.select.fieldValue("ncp-hero-title")).toBe("캔버스에서 수정");

      // 시나리오: 패널에서 같은 필드 편집 (onChange → updateField)
      app.dispatch.updateField({
        name: "ncp-hero-title",
        value: "패널에서 수정",
      });
      expect(app.select.fieldValue("ncp-hero-title")).toBe("패널에서 수정");
    });

    test("선택 후 해당 필드 값을 읽고 수정할 수 있다", () => {
      const app = createApp();

      // 1. 요소 선택
      app.dispatch.selectElement({ id: "ncp-hero-title", type: "text" });

      // 2. 선택된 요소의 데이터 읽기 (패널이 하는 일)
      const selectedId = app.select.selectedId();
      const value = app.select.fieldValue(selectedId!);
      expect(value).toBe(INITIAL_STATE.data.fields["ncp-hero-title"]);

      // 3. 패널에서 수정
      app.dispatch.updateField({ name: selectedId!, value: "패널에서 변경" });

      // 4. 캔버스도 같은 값을 읽는다
      expect(app.select.fieldValue("ncp-hero-title")).toBe("패널에서 변경");
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Widget separation & reset
  // ═══════════════════════════════════════════════════════════════════

  describe("widget separation", () => {
    test("모든 위젯 커맨드가 단일 dispatch에서 접근 가능하다", () => {
      const app = createApp();
      expect(typeof app.dispatch.updateField).toBe("function");
      expect(typeof app.dispatch.selectElement).toBe("function");
    });

    test("reset은 초기 상태로 복원한다", () => {
      const app = createApp();
      app.dispatch.updateField({
        name: "ncp-hero-title",
        value: "변경됨",
      });
      app.dispatch.selectElement({ id: "some-id", type: "text" });

      app.reset();

      expect(app.state.data.fields["ncp-hero-title"]).toBe(
        INITIAL_STATE.data.fields["ncp-hero-title"],
      );
      expect(app.state.ui.selectedId).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Initial state integrity
  // ═══════════════════════════════════════════════════════════════════

  describe("initial state", () => {
    test("모든 NCP 블록 필드가 초기값으로 등록되어 있다", () => {
      const app = createApp();
      const fields = app.state.data.fields;

      // Hero
      expect(fields["ncp-hero-title"]).toBeDefined();
      expect(fields["ncp-hero-sub"]).toBeDefined();
      expect(fields["ncp-hero-brand"]).toBeDefined();

      // News
      expect(fields["ncp-news-title"]).toBeDefined();
      expect(fields["news-1-title"]).toBeDefined();
      expect(fields["news-2-title"]).toBeDefined();
      expect(fields["news-3-title"]).toBeDefined();

      // Services
      expect(fields["ncp-service-title"]).toBeDefined();
      expect(fields["service-title-0"]).toBeDefined();
      expect(fields["service-desc-0"]).toBeDefined();

      // Footer
      expect(fields["footer-brand"]).toBeDefined();
      expect(fields["footer-desc"]).toBeDefined();
    });

    test("모든 레거시 블록 필드가 초기값으로 등록되어 있다", () => {
      const app = createApp();
      const fields = app.state.data.fields;

      // HeroBlock
      expect(fields["hero-badge"]).toBeDefined();
      expect(fields["hero-headline"]).toBeDefined();
      expect(fields["hero-subheadline"]).toBeDefined();

      // CTABlock
      expect(fields["cta-headline"]).toBeDefined();
      expect(fields["cta-subtext"]).toBeDefined();
      expect(fields["cta-footer"]).toBeDefined();

      // FeaturesBlock
      expect(fields["features-eyebrow"]).toBeDefined();
      expect(fields["features-title"]).toBeDefined();
      expect(fields["feature-main-title"]).toBeDefined();
      expect(fields["feature-main-desc"]).toBeDefined();
      expect(fields["feature-speed-title"]).toBeDefined();
      expect(fields["feature-security-title"]).toBeDefined();
      expect(fields["feature-analytics-title"]).toBeDefined();
      expect(fields["feature-collab-title"]).toBeDefined();

      // TestimonialsBlock
      expect(fields["testimonials-eyebrow"]).toBeDefined();
      expect(fields["testimonials-title"]).toBeDefined();
      expect(fields["testimonial-1-quote"]).toBeDefined();
      expect(fields["testimonial-1-name"]).toBeDefined();
      expect(fields["testimonial-1-role"]).toBeDefined();
      expect(fields["testimonial-2-quote"]).toBeDefined();
      expect(fields["testimonial-3-quote"]).toBeDefined();
    });

    test("패널 시나리오: 선택 → 필드 읽기 → 수정 → 캔버스 반영", () => {
      const app = createApp();

      // 1. 레거시 블록 요소 선택
      app.dispatch.selectElement({ id: "cta-headline", type: "text" });
      expect(app.select.selectedId()).toBe("cta-headline");
      expect(app.select.selectedType()).toBe("text");

      // 2. 패널에서 현재 값 읽기
      const original = app.select.fieldValue("cta-headline");
      expect(original).toBe("Ready to build something amazing?");

      // 3. 패널에서 수정 (같은 updateField 커맨드)
      app.dispatch.updateField({
        name: "cta-headline",
        value: "패널에서 수정됨",
      });

      // 4. 캔버스도 같은 값을 읽는다
      expect(app.select.fieldValue("cta-headline")).toBe("패널에서 수정됨");
    });

    test("초기 선택 상태는 비어 있다", () => {
      const app = createApp();
      expect(app.state.ui.selectedId).toBeNull();
      expect(app.state.ui.selectedType).toBeNull();
    });
  });
});
