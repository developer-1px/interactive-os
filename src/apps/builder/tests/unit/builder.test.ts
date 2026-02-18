/**
 * Builder unit tests — v5 native defineApp API.
 *
 * Uses BuilderApp.create() for isolated testing (no DOM, no browser).
 * v5 style: app.dispatch(commandFactory(payload)), app.select(brandedSelector)
 */

import {
  BuilderApp,
  INITIAL_STATE,
  allFields,
  selectElement,
  selectedId,
  selectedType,
  updateField,
} from "@apps/builder/app";
import { describe, expect, test } from "vitest";

describe("BuilderApp (v5 native)", () => {
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

      app.dispatch(updateField({ name: "ncp-hero-title", value: "새로운 제목" }));
      expect(app.state.data.fields["ncp-hero-title"]).toBe("새로운 제목");
    });

    test("존재하지 않는 필드도 생성할 수 있다", () => {
      const app = createApp();
      expect(app.state.data.fields["new-field"]).toBeUndefined();

      app.dispatch(updateField({ name: "new-field", value: "Hello" }));
      expect(app.state.data.fields["new-field"]).toBe("Hello");
    });

    test("빈 문자열로 업데이트 가능하다", () => {
      const app = createApp();
      app.dispatch(updateField({ name: "ncp-hero-title", value: "" }));
      expect(app.state.data.fields["ncp-hero-title"]).toBe("");
    });

    test("멀티라인 값을 유지한다", () => {
      const app = createApp();
      const multiline = "첫 줄\n둘째 줄\n셋째 줄";
      app.dispatch(updateField({ name: "ncp-hero-title", value: multiline }));
      expect(app.state.data.fields["ncp-hero-title"]).toBe(multiline);
    });

    test("다른 필드에 영향을 주지 않는다", () => {
      const app = createApp();
      const originalSub = app.state.data.fields["ncp-hero-sub"];

      app.dispatch(
        updateField({ name: "ncp-hero-title", value: "변경된 제목" }),
      );
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

      app.dispatch(selectElement({ id: "ncp-hero-title", type: "text" }));
      expect(app.state.ui.selectedId).toBe("ncp-hero-title");
      expect(app.state.ui.selectedType).toBe("text");
    });

    test("null로 선택 해제할 수 있다", () => {
      const app = createApp();
      app.dispatch(selectElement({ id: "ncp-hero-title", type: "text" }));
      app.dispatch(selectElement({ id: null, type: null }));
      expect(app.state.ui.selectedId).toBeNull();
      expect(app.state.ui.selectedType).toBeNull();
    });

    test("다른 요소로 전환하면 이전 선택이 덮어씌워진다", () => {
      const app = createApp();
      app.dispatch(selectElement({ id: "ncp-hero-title", type: "text" }));
      app.dispatch(selectElement({ id: "ncp-hero-cta", type: "button" }));
      expect(app.state.ui.selectedId).toBe("ncp-hero-cta");
      expect(app.state.ui.selectedType).toBe("button");
    });

    test("section 타입도 선택 가능하다", () => {
      const app = createApp();
      app.dispatch(selectElement({ id: "ncp-hero", type: "section" }));
      expect(app.state.ui.selectedType).toBe("section");
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Selectors (v5 branded)
  // ═══════════════════════════════════════════════════════════════════

  describe("selectors", () => {
    test("selectedId returns null initially", () => {
      const app = createApp();
      expect(app.select(selectedId)).toBeNull();
    });

    test("selectedId reflects selectElement", () => {
      const app = createApp();
      app.dispatch(selectElement({ id: "test-id", type: "text" }));
      expect(app.select(selectedId)).toBe("test-id");
    });

    test("selectedType reflects selectElement", () => {
      const app = createApp();
      expect(app.select(selectedType)).toBeNull();
      app.dispatch(selectElement({ id: "test-id", type: "image" }));
      expect(app.select(selectedType)).toBe("image");
    });

    test("allFields returns the full field map", () => {
      const app = createApp();
      const fields = app.select(allFields);
      expect(fields).toEqual(INITIAL_STATE.data.fields);
    });

    test("allFields reflects updateField changes", () => {
      const app = createApp();
      app.dispatch(
        updateField({ name: "ncp-hero-title", value: "업데이트됨" }),
      );
      expect(app.select(allFields)["ncp-hero-title"]).toBe("업데이트됨");
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 양방향 동기화 증명 — 캔버스 = 패널 = 같은 커맨드
  // ═══════════════════════════════════════════════════════════════════

  describe("양방향 동기화 (캔버스 ↔ 패널)", () => {
    test("캔버스 인라인 편집과 패널 편집은 같은 커맨드를 사용한다", () => {
      const app = createApp();

      // 시나리오: 캔버스에서 인라인 편집 (onCommit → updateField)
      app.dispatch(
        updateField({ name: "ncp-hero-title", value: "캔버스에서 수정" }),
      );
      expect(app.state.data.fields["ncp-hero-title"]).toBe("캔버스에서 수정");

      // 시나리오: 패널에서 같은 필드 편집 (onChange → updateField)
      app.dispatch(
        updateField({ name: "ncp-hero-title", value: "패널에서 수정" }),
      );
      expect(app.state.data.fields["ncp-hero-title"]).toBe("패널에서 수정");
    });

    test("선택 후 해당 필드 값을 읽고 수정할 수 있다", () => {
      const app = createApp();

      // 1. 요소 선택
      app.dispatch(selectElement({ id: "ncp-hero-title", type: "text" }));

      // 2. 선택된 요소의 데이터 읽기 (패널이 하는 일)
      const id = app.select(selectedId)!;
      expect(app.state.data.fields[id]).toBe(
        INITIAL_STATE.data.fields["ncp-hero-title"],
      );

      // 3. 패널에서 수정
      app.dispatch(updateField({ name: id, value: "패널에서 변경" }));

      // 4. 캔버스도 같은 값을 읽는다
      expect(app.state.data.fields["ncp-hero-title"]).toBe("패널에서 변경");
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Reset & initial state
  // ═══════════════════════════════════════════════════════════════════

  describe("reset & initial state", () => {
    test("reset은 초기 상태로 복원한다", () => {
      const app = createApp();
      app.dispatch(
        updateField({ name: "ncp-hero-title", value: "변경됨" }),
      );
      app.dispatch(selectElement({ id: "some-id", type: "text" }));

      app.reset();

      expect(app.state.data.fields["ncp-hero-title"]).toBe(
        INITIAL_STATE.data.fields["ncp-hero-title"],
      );
      expect(app.state.ui.selectedId).toBeNull();
    });

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

      // Services
      expect(fields["ncp-service-title"]).toBeDefined();
      expect(fields["service-title-0"]).toBeDefined();

      // Footer
      expect(fields["footer-brand"]).toBeDefined();
      expect(fields["footer-desc"]).toBeDefined();
    });

    test("초기 선택 상태는 비어 있다", () => {
      const app = createApp();
      expect(app.state.ui.selectedId).toBeNull();
      expect(app.state.ui.selectedType).toBeNull();
    });

    test("패널 시나리오: 선택 → 필드 읽기 → 수정 → 캔버스 반영", () => {
      const app = createApp();

      // 1. 레거시 블록 요소 선택
      app.dispatch(selectElement({ id: "cta-headline", type: "text" }));
      expect(app.select(selectedId)).toBe("cta-headline");
      expect(app.select(selectedType)).toBe("text");

      // 2. 패널에서 현재 값 읽기
      expect(app.state.data.fields["cta-headline"]).toBe(
        "Ready to build something amazing?",
      );

      // 3. 패널에서 수정 (같은 updateField 커맨드)
      app.dispatch(
        updateField({ name: "cta-headline", value: "패널에서 수정됨" }),
      );

      // 4. 캔버스도 같은 값을 읽는다
      expect(app.state.data.fields["cta-headline"]).toBe("패널에서 수정됨");
    });
  });
});
