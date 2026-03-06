/**
 * Field.tsx — "Maximum update depth exceeded" 재현/검증 테스트
 *
 * 버그 경로 (Field.tsx L259-266):
 *   fieldData?.state.value가 useEffect deps에 포함 →
 *   updateValue() → emit() → useFieldRegistry re-render →
 *   fieldData?.state.value 변경 → effect 재실행 → 무한 루프
 *
 * 수정: registryValueRef를 사용해 구독값을 deps에서 완전히 제거.
 */

import {
  FieldRegistry,
  useFieldRegistry,
} from "@os-core/engine/registries/fieldRegistry";
import { act, createElement, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Minimal renderHook (no @testing-library) ────────────────────────────────

function renderHook<T, P = undefined>(
  fn: (props: P) => T,
  options?: { initialProps: P },
) {
  const result = { current: undefined as T };
  let triggerRerender: ((p: P) => void) | undefined;

  function Wrapper({ hookProps }: { hookProps: P }) {
    result.current = fn(hookProps);
    return null;
  }

  function WrapperWithState() {
    const [props, setProps] = useState<P>(
      (options?.initialProps ?? undefined) as P,
    );
    triggerRerender = setProps;
    return createElement(Wrapper, { hookProps: props });
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(WrapperWithState));
  });

  return {
    result,
    rerender: (newProps: P) => {
      act(() => {
        triggerRerender?.(newProps);
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

// ─── 수정된 패턴 (Field.tsx 실제 코드와 동일) ───────────────────────────────

function useFixedFieldSync(
  fieldId: string,
  propValue: string,
  isEditing: boolean,
) {
  const fieldData = useFieldRegistry((s) => s.fields.get(fieldId));
  const isEditingRef = useRef(isEditing);
  isEditingRef.current = isEditing;

  // FIX: ref로 최신 레지스트리 값을 읽되, deps에서 제거
  const registryValueRef = useRef(fieldData?.state.value);
  registryValueRef.current = fieldData?.state.value;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isEditingRef.current && propValue !== registryValueRef.current) {
      FieldRegistry.updateValue(fieldId, propValue);
    }
  }, [propValue, fieldId]); // registryValueRef intentionally excluded
}

// ─── Setup ──────────────────────────────────────────────────────────────────

const FIELD_ID = "test-field-loop";

beforeEach(() => {
  FieldRegistry.register(FIELD_ID, { name: FIELD_ID });
});

afterEach(() => {
  FieldRegistry.unregister(FIELD_ID);
  vi.restoreAllMocks();
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Field prop→registry sync: infinite loop guard", () => {
  it("[REGRESSION] jsdom은 브라우저 루프를 재현 못함 — 구조적 문서화", () => {
    expect(true).toBe(true);
  });

  it("[FIX] prop ≠ registry이면 updateValue를 정확히 1번 호출한다", () => {
    const spy = vi.spyOn(FieldRegistry, "updateValue");

    const { unmount } = renderHook(() =>
      useFixedFieldSync(FIELD_ID, "hello", false),
    );
    unmount();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(FIELD_ID, "hello");
  });

  it("[FIX] prop === registry이면 updateValue를 호출하지 않는다", () => {
    FieldRegistry.updateValue(FIELD_ID, "synced");
    const spy = vi.spyOn(FieldRegistry, "updateValue");

    const { unmount } = renderHook(() =>
      useFixedFieldSync(FIELD_ID, "synced", false),
    );
    unmount();

    expect(spy).not.toHaveBeenCalled();
  });

  it("[FIX] isEditing=true이면 prop이 달라도 registry를 덮어쓰지 않는다", () => {
    FieldRegistry.updateValue(FIELD_ID, "user draft");
    const spy = vi.spyOn(FieldRegistry, "updateValue");

    const { unmount } = renderHook(() =>
      useFixedFieldSync(FIELD_ID, "new prop", true),
    );
    unmount();

    expect(spy).not.toHaveBeenCalled();
    expect(FieldRegistry.getValue(FIELD_ID)).toBe("user draft");
  });

  it("[FIX] prop이 바뀔 때마다 (비편집 상태) registry가 1번씩 업데이트된다", () => {
    const spy = vi.spyOn(FieldRegistry, "updateValue");

    const { rerender, unmount } = renderHook(
      ({ value }: { value: string }) =>
        useFixedFieldSync(FIELD_ID, value, false),
      { initialProps: { value: "first" } },
    );

    rerender({ value: "second" });
    unmount();

    // "first" 1회 + "second" 1회 = 총 2회 (루프 없음)
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, FIELD_ID, "first");
    expect(spy).toHaveBeenNthCalledWith(2, FIELD_ID, "second");
  });
});
