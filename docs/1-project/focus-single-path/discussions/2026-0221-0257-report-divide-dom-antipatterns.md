# /divide 보고서: DOM API 직접 사용 안티패턴

> 생성: 2026-02-21 02:57
> 갱신: 2026-02-21 03:05
> 상태: ✅ Clear 완료, 🔍 근본 원인 발견

## 배경

`/doubt` 워크플로우로 프로덕션 코드에서 OS를 거치지 않고 DOM API를 직접 사용하는 안티패턴을 전수 조사.
테스트 코드(`*.test.ts`, `*.spec.ts`)와 `inspector/`는 개발 도구이므로 제외.

## ✅ 완료

| ID | 파일 | 변경 | 상태 |
|----|------|------|------|
| C1 | `pages/DocsPage.tsx:52` | `document.querySelector` → `useRef` | ✅ 완료 |
| K1 | `6-components/field/Field.tsx:258` | `useComputed` 내 `document.getElementById` → `useEffect`로 분리 | ✅ 완료 |

## 🔍 근본 원인 발견: Focus Effect 이중 경로

분석 중 **더 근본적인 아키텍처 이슈**를 발견:

### 현재 `.focus()` 호출 경로가 2개 공존

```
경로 A: 커맨드 → { focus: itemId } → 4-effects/focus → el.focus()
경로 B: 커맨드 → { state } → useComputed → FocusItem/useFieldHooks → el.focus()
```

- `FocusItem.tsx:165`와 `4-effects/index.ts:51`가 **동일한 el.focus()를 중복 실행**
- `useFieldHooks.ts:79`는 추가로 커서 복원(`setCaretPosition`)이 필요한 Field 전용 경로

### 이 이중 경로로 인해

1. `useFieldHooks`, `QuickPick`의 `.focus()`를 단순히 제거하면 **커서 복원이 깨짐**
2. `FocusItem`의 `.focus()`를 제거하면 **커맨드가 `focus` effect를 안 반환하는 경우 포커스가 안 옮겨짐**
3. 두 경로를 통합하려면 **모든 커맨드의 effect 반환값을 감사**해야 함

## 다음 단계 (별도 프로젝트 권장)

### Phase 1: Focus Single Path 통합

focus `.focus()` 호출을 한 곳으로 통합:
- 선택지 A: `4-effects/focus`만 사용, `FocusItem`에서 제거 → 모든 커맨드가 focus effect 반환 보장 필요
- 선택지 B: `FocusItem`만 사용, `4-effects/focus` 제거 → Field 커서 복원은 FocusItem에서 처리
- 선택지 C: `4-effects`에 `focusField` effect 추가 (커서 복원 포함), 기존 `focus`는 유지 → 최소 변경

### Phase 2: 나머지 안티패턴

| ID | 파일 | 위반 | 선행 조건 |
|----|------|------|----------|
| X1 | `QuickPick.tsx:219,266` | 직접 `.focus()` | Phase 1 완료 후 combobox virtual focus 패턴 정의 |
| X2 | `useFieldHooks.ts:78-101` | `.focus()/.blur()` | Phase 1 완료 후 Field focus effect 설계 |
| X3 | `QuickPick.tsx:225` | `querySelector` | Phase 1 완료 후 autoFocus race 조건 해결 |
| K2 | `2-contexts/index.ts:163` | `DOM_ZONE_ORDER` 전역 DOM 순회 | ZoneRegistry 순서 정보 설계 |
| K3 | `BuilderCursor.tsx` | `getElementById` + `getBoundingClientRect` | 별도 — 시각 오버레이 전용 DOM 접근 |
| C2 | `aria-showcase` | `.focus()` | showcase 리라이트 시 Trigger 패턴 적용 |

## 판정 요약

| 유형 | 건수 | 결과 |
|------|:----:|------|
| ✅ 해결 | 2건 | C1, K1 |
| 🔍 근본 원인 발견 | 1건 | Focus 이중 경로 → 별도 프로젝트 권장 |
| ⏳ 보류 | 6건 | 근본 원인 해결 후 순차 처리 |
