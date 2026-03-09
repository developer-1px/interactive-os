# os-react 안티패턴 카탈로그

> **작성일**: 2026-03-09
> **출처**: /discussion — "코드가 과설계되었다"
> **Root Cause**: LLM의 Pre-trained React Habit (rules.md 원칙 3 위반)

## 배경

os-react는 **thin projection layer**여야 한다.
headless가 결정한 상태를 DOM 속성으로 투영하고, React 리렌더를 트리거하는 것이 전부다.

현실: os-react **3,210 lines** 중 순수 투영은 ~800줄. 나머지 ~2,400줄은 행동/스타일/래퍼 코드다.

**원인**: LLM은 React가 기본 사고 프레임워크이므로, headless에 넣을 수 있는 코드도 React 컴포넌트에 넣는다.
rules.md에 "넣지 마"라고 써도 다음 세션의 LLM이 같은 실수를 반복한다. 의지가 아니라 구조로 막아야 한다.

---

## 안티패턴 목록

| # | 안티패턴 | 위치 (증거) | 왜 안티패턴인가 | 방지책 | 상태 |
|---|---------|------------|---------------|--------|------|
| AP-1 | **React lifecycle에서 상태 초기화** | `Zone.tsx:160~260` — useLayoutEffect 안에서 초기 selection, expansion, value, autoFocus를 os.setState + produce로 설정 | 상태 초기화는 headless 함수 호출이면 된다. React lifecycle에 넣으면 headless 테스트에서 재현 불가, React 없이 사용 불가 | 초기화 로직을 headless 함수(`initZoneState(zoneId, config)`)로 추출. Zone.tsx는 mount 시 호출만 | ⬜ |
| AP-2 | **행동 로직이 React 컴포넌트 안에 있다** | `Field.tsx:170~400` — commit/cancel 흐름, validation, DOM sync, contentEditable 제어가 모두 React 컴포넌트 내부 | Field의 커밋·취소·검증은 행동(Behavior)이다. React에 갇히면 다른 프레임워크(Vue, Svelte)에서 재사용 불가. headless 테스트도 이 경로를 못 탄다 | Field 행동을 headless로 추출(`fieldBehavior.ts`). React는 DOM 이벤트 → headless 함수 호출만 | ⬜ |
| AP-3 | **스타일링이 행동 인프라에 존재** | `Field.tsx:52~80` — `getFieldClasses()` Tailwind 클래스 조합 | "행동은 형태에 독립"이 비전이다(VISION.md §3). 특정 CSS 프레임워크(Tailwind) 의존은 비전 위반. 사용자가 다른 스타일 시스템을 쓰면 이 코드 전체가 죽은 코드가 된다 | 스타일링을 os-react에서 제거. 상태(`isEditing`, `error`, `isEmpty`)만 노출하고 스타일은 앱이 결정 | ⬜ |
| AP-4 | **외부 컴포넌트 라이브러리 래퍼** | `Dialog.tsx` 259줄 — Radix Dialog API를 ZIFT 위에 재구현 | "컴포넌트 라이브러리가 아니다"가 비전이다(VISION.md §3). Radix 호환 래퍼를 만드는 것은 비전과 정반대 방향. 유지보수 비용만 늘린다 | Dialog.tsx 삭제. overlay는 headless(`zone.overlay()`) + 앱의 포탈로 해결. Radix 호환은 비목표 | ⬜ |
| AP-5 | **과도한 React 패턴 사용** | `Item.tsx` — `forwardRef` + `cloneElement` + `asChild` + ref 머징 (~80줄) | asChild/cloneElement는 Radix의 관용구다. OS가 Radix를 대체하려면서 Radix 패턴을 쓰는 것은 모순. ref 머징 복잡성은 버그 온상이다 | Item은 단순 div + attrs 투영으로 축소. asChild 제거. 필요하면 앱이 `computeItem()` 직접 호출 | ⬜ |
| AP-6 | **React 컴포넌트에서 os.dispatch 직접 호출** | `Zone.tsx:258` — `os.dispatch(OS_FOCUS(...))` in useLayoutEffect | 컴포넌트가 커맨드를 직접 dispatch하면 행동 로직이 React에 결합된다. headless에서 같은 동작을 재현하려면 별도 코드가 필요해진다 | dispatch는 headless 계층(os-core)만 수행. React는 상태 읽기 + DOM 속성 쓰기만 | ⬜ |
| AP-7 | **useEffect/useState로 파생 상태 계산** | `Field.tsx:246~263` — `isParentEditing`을 useState + useLayoutEffect + DOM ancestry check로 계산 | 순수 함수로 계산 가능한 값을 React 상태 + 부수효과로 만들었다. 불필요한 리렌더와 타이밍 버그의 원인 | 파생 상태는 headless의 순수 함수로 계산. React는 결과만 구독 | ⬜ |
| AP-8 | **Field 변형 3개가 각각 행동을 중복 구현** | `Field.tsx`(482) + `FieldInput.tsx`(211) + `FieldTextarea.tsx`(208) = 901줄 | 세 파일이 각각 등록/구독/커밋/취소 로직을 독립 구현한다. DRY 위반이며 버그 수정 시 3곳을 고쳐야 한다 | 공통 행동을 headless `fieldCore.ts`로 추출. 세 컴포넌트는 DOM 요소(div/input/textarea)만 다르게 렌더 | ⬜ |

---

## 방지 구조 (향후 설계)

문서 규칙만으로는 LLM 관성을 막을 수 없다. 아래 구조적 장치를 검토한다:

| 장치 | 설명 | 상태 |
|------|------|------|
| **import 방향 제한** | os-react → os-core는 `3-inject`(읽기 전용)만 허용. `4-command` 직접 import 금지 | ⬜ 검토 |
| **파일 크기 경고** | React 컴포넌트 100줄 초과 시 headless 추출 신호로 간주 | ⬜ 검토 |
| **useEffect/useState 경고** | os-react 내 상태 훅 사용 시 "정말 필요한가?" 리뷰 트리거 | ⬜ 검토 |
| **contract test** | os-react의 각 컴포넌트가 headless 함수의 순수 투영인지 자동 검증 | ⬜ 검토 |

---

## 정량 목표

| 지표 | 현재 | 목표 |
|------|------|------|
| os-react 총 라인 | 3,210 | < 1,000 |
| React 컴포넌트 최대 라인 | 482 (Field.tsx) | < 100 |
| os-react 내 useEffect/useLayoutEffect 수 | 37 | ≤ 3 (listener mount 정도) |
| os-react 내 useState 수 | 2 | 0 |
| os-react → 4-command import 수 | 17 | 0 |
