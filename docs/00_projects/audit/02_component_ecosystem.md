# 감사 챕터 2: 컴포넌트 생태계 위생 (Component Ecosystem hygiene)
## 프리미티브 & 구조적 "물리학"

**상태**: 🟡 WARNING (경고)
**날짜**: 2026-02-01
**범위**: `src/lib/primitives`, 파일 구조, 스타일링 전략

### 1. "절대 붕괴되지 않는(Never-Collapsing)" 규칙 분석
Project Antigravity 표준은 "절대 붕괴되지 않는" 프랙탈 구조(컴포넌트당 폴더)를 지시합니다.
현재 `src/lib/primitives`의 상태:
```text
Action.tsx
CommandContext.tsx
Field.tsx
FocusZone.tsx
Option.tsx
types.ts
```
**위반 감지**: 이 핵심 컴포넌트들이 플랫(flat) 파일로 존재합니다.
- **이것이 중요한 이유**: 코드 병치(Co-location). `Action.tsx`는 보통 다음을 필요로 합니다:
    - `Action.css.ts` (스타일)
    - `Action.spec.ts` (테스트)
    - `Action.stories.tsx` (문서화)
  이들을 플랫 파일로 유지함으로써, 이러한 병치 자산의 생성을 저해하고 있습니다.

**권고 사항**:
`src/lib/primitives`를 다음과 같이 리팩터링하십시오:
```text
/primitives
  /Action
    index.tsx
    styles.css.ts
  /FocusZone
    index.tsx
    styles.css.ts
  ...
```

### 2. 컨텍스트 오염 및 리팩터링
최근 `CommandContext.tsx`를 메인 `primitives.tsx` 파일에서 분리한 것(최근 작업에서 참조됨)은 매우 큰 성과입니다.
- **전**: 순환 의존성 발생 가능성이 높았습니다.
- **후**: `CommandContext`는 순수 의존성 주입 계층으로 작동합니다.

그러나 `FocusZone`이 `customDispatch`와 `customRegistry` prop을 받는 것은 "제어된(Controlled)" 모드와 "비제어된(Uncontrolled)" 모드의 혼재를 암시합니다.
```tsx
export function FocusZone({ dispatch: customDispatch, ... }) {
    const { dispatch: contextDispatch } = useContext(CommandContext);
    const dispatch = customDispatch || contextDispatch;
}
```
**위험**: 이는 두 개의 진실 공급원(sources of truth)을 생성합니다. 개발자가 `customDispatch`는 전달하지만 `customRegistry`를 잊어버린 경우, 컴포넌트는 레지스트리가 알지 못하는 커맨드를 디스패치할 수 있습니다.
**수정**: "전부 아니면 전무(all-or-nothing)" 오버라이드 패턴을 강제하거나 prop에 대해 더 엄격한 타입을 적용하십시오.

### 3. 스타일링 전략 대 로직
챕터 1에서 언급했듯이, `FocusZone`은 className 문자열 조작을 통해 시각적 스타일(흑백 처리)을 적용합니다.
이상적으로 *프리미티브* 생태계는 "헤드리스(Headless)"이거나 "행동 우선(Behavior-First)"이어야 합니다.
- **현재**: `FocusZone`은 "비활성" 상태가 어떻게 보여야 하는지에 대해 불필요하게 독단적입니다.
- **이상**: `FocusZone`은 단순히 `data-active="true|false"`를 노출하고, 소비하는 앱이 시각적 물리학을 정의하도록 해야 합니다.

### 4. 컴포넌트 합성
`Action` 컴포넌트는 `asChild` (Radix UI 패턴)를 지원합니다.
```tsx
if (asChild && isValidElement(children)) {
    return cloneElement(child, { onClick: ... })
}
```
이것은 **훌륭합니다**. 이를 통해 `Action`은 DOM 구조를 강요하지 않고 *어떤* UI 컴포넌트(버튼, 테이블 행, div)도 감쌀 수 있는 행동 래퍼(behavioral wrapper)로 사용될 수 있습니다. 이는 이 코드베이스의 골드 스탠다드 패턴입니다.
