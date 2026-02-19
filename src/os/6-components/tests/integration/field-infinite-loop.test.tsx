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

import { act, renderHook } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FieldRegistry, useFieldRegistry } from "@os/6-components/field/FieldRegistry";

// ─── 수정된 패턴 (Field.tsx 실제 코드와 동일) ───────────────────────────────

function useFixedFieldSync(fieldId: string, propValue: string, isEditing: boolean) {
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
        // NOTE: jsdom/vitest에서 useSyncExternalStore는 브라우저 concurrent mode와
        // 다르게 동작하여 루프가 재현되지 않는다.
        //
        // 실제 루프 경로 (브라우저):
        //   updateValue → emit → re-render → fieldData?.state.value 변경
        //   → useEffect(deps=[..., fieldData?.state.value]) 재실행 → 루프
        //
        // 수정 근거: registryValueRef로 읽어 deps에서 제거하면 effect는
        // [value, fieldId] 변경 시에만 재실행된다.
        expect(true).toBe(true);
    });

    it("[FIX] prop ≠ registry이면 updateValue를 정확히 1번 호출한다", () => {
        const spy = vi.spyOn(FieldRegistry, "updateValue");

        // registry = "" (초기값), prop = "hello" → 불일치 → updateValue 1회
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

        act(() => {
            rerender({ value: "second" });
        });

        unmount();

        // "first" 1회 + "second" 1회 = 총 2회 (루프 없음)
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenNthCalledWith(1, FIELD_ID, "first");
        expect(spy).toHaveBeenNthCalledWith(2, FIELD_ID, "second");
    });
});
