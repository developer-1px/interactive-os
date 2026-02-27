# TSX의 역할: React ↔ OS Adapter 계약

| 항목 | 내용 |
|------|------|
| **원문** | tsx의 역할을 1단계 추상적으로 한번 정의해본다면? |
| **내(AI)가 추정한 의도** | |
| 경위 | FocusGroup.tsx /doubt 분석에서 "통로 역할인데 왜 611줄인가?" 발견. |
| 표면 | tsx 파일이 해야 할 일과 하면 안 되는 일을 명확히 정의하고 싶다. |
| 의도 | headless simulator의 시뮬레이션 범위를 최소화하기 위한 아키텍처 원칙 제정. tsx가 얇을수록 시뮬레이션이 필요 없어진다. |
| **날짜** | 2026-02-27 |
| **프로젝트** | headless-simulator |

## 1. 개요

이 OS에서 `.tsx` 파일은 **React와 OS 사이의 adapter**다. Hexagonal Architecture의 Port/Adapter 패턴에서 adapter에 해당한다. 이 역할을 명확히 정의하면:

- tsx가 얇을수록 headless 시뮬레이션 범위가 줄어든다
- tsx에 로직이 있으면 그만큼 vitest에서 재현 불가 영역이 늘어난다
- **tsx의 두께 = 거짓 GREEN의 범위**

## 2. 분석: tsx의 이상적 역할

### Adapter의 책임 (해야 할 일)

```
                ┌─────────────────────────────────┐
                │         TSX = Adapter           │
                │                                 │
  React World ──┤  1. Declare  (선언)             ├── OS World
                │  2. Bind     (바인딩)           │
                │  3. Project  (투영)             │
                │  4. Notify   (알림)             │
                └─────────────────────────────────┘
```

| 책임 | 설명 | 예시 | 얇은 형태 |
|------|------|------|----------|
| **Declare** | Props를 OS에 선언 | role, config, callbacks 등록 | `os.register(id, props)` 1줄 |
| **Bind** | DOM ref를 OS에 전달 | element, containerRef | `os.bindElement(id, ref)` 1줄 |
| **Project** | OS state를 DOM attrs로 투영 | aria-current, tabIndex, data-focused | `{...os.attrs(id)}` spread |
| **Notify** | React lifecycle을 OS에 알림 | mount → init, unmount → cleanup | `useEffect → os.init/cleanup` |

### Adapter가 하면 안 되는 일

| ❌ 하면 안 되는 일 | 현재 FocusGroup | 올바른 장소 |
|-------------------|----------------|------------|
| **Discovery** — 아이템을 찾는 전략 | Phase 2: querySelectorAll → getItems closure (30줄) | OS: ZoneRegistry |
| **Computation** — attrs 계산 | FocusItem: isActiveFocused, tabIndex 계산 | OS: computeAttrs |
| **Decision** — autoFocus 결정 | Phase 2: if(autoFocus && autoGetItems) dispatch | OS: register 시 자동 |
| **Conversion** — Props → Entry 변환 | buildZoneEntry (57줄) | OS: ZoneRegistry.register 내부 |
| **Branching** — headless/browser 분기 | Phase 1(headless) vs Phase 2(browser) | OS: 환경 감지 자동 |

### 한 줄 원칙

> **tsx는 "무엇을(what)" 선언하고, OS가 "어떻게(how)" 결정한다.**

- tsx: "이 zone은 listbox이고 autoFocus이다" (what)
- OS: "그러면 첫 번째 아이템에 focus하겠다" (how)
- tsx: "이 ref가 DOM element이다" (what)
- OS: "그러면 거기서 querySelectorAll로 아이템을 찾겠다" (how)

### 이상적 FocusGroup (목표)

```tsx
function FocusGroup({ id, role, children, className, callbacks, ...config }) {
  const zoneId = useStableId(id);
  
  // Declare: props → OS
  useZoneRegistration(zoneId, { role, callbacks, ...config });
  
  // Bind: DOM ref → OS
  const ref = useRef(null);
  useElementBinding(zoneId, ref);
  
  // Notify: lifecycle → OS  
  useZoneLifecycle(zoneId, config);
  
  // Project: OS state → React context
  return (
    <ZoneContext.Provider value={zoneId}>
      <div ref={ref} data-zone={zoneId} {...os.zoneAttrs(zoneId)}>
        {children}
      </div>
    </ZoneContext.Provider>
  );
}
```

**~20줄**. 현재 311줄(컴포넌트 본체만)에서 ~20줄로.

## 3. 결론 / 제안

### tsx 역할 계약 (Rule 후보)

```
TSX Adapter Contract:
1. DECLARE — Props를 OS에 등록한다. 변환하지 않는다.
2. BIND — DOM ref를 OS에 전달한다. DOM을 조회하지 않는다.
3. PROJECT — OS state를 JSX에 반영한다. 계산하지 않는다.
4. NOTIFY — lifecycle 이벤트를 OS에 알린다. 결정하지 않는다.

위반 지표: tsx 파일에 if/for/switch가 있으면 의심한다.
         tsx 파일에 querySelectorAll이 있으면 확정 위반.
```

### 적용 대상

이 계약은 FocusGroup뿐 아니라 **모든 OS tsx 파일**에 적용:
- `FocusGroup.tsx` — 현재 가장 두꺼운 위반자
- `FocusItem.tsx` — attrs 계산 로직 (computeAttrs ↔ 중복)
- `Zone.tsx` — FocusGroup wrapper
- `Field.tsx`, `FieldInput.tsx`, `FieldTextarea.tsx` — field layer

## 4. Cynefin 도메인 판정

🟡 **Complicated** — "tsx = adapter" 패턴은 Hexagonal Architecture에서 확립된 개념. 적용 방법은 분석하면 답이 좁혀짐. FocusGroup /doubt에서 이미 6개 task로 분해됨.

## 5. 인식 한계

- FocusItem.tsx의 attrs 계산 복잡도를 아직 상세 분석하지 않았다. role 추론, expandable 결정 등 앱-OS 경계의 정보가 필요한 부분이 있을 수 있다.
- "tsx에 if가 있으면 의심"은 heuristic이지 절대 원칙은 아니다. conditional rendering은 React의 정당한 역할.
- 이 계약을 rules.md에 추가할지, 프로젝트 레벨 가이드로 둘지는 사용자 결정 필요.

## 6. 열린 질문

1. 이 "TSX Adapter Contract"을 rules.md에 공식 규칙으로 추가할 것인가?
2. FocusItem.tsx의 attrs 계산도 computeAttrs로 통합할 것인가? (단일 원천)
3. useZoneRegistration, useElementBinding 같은 커스텀 훅으로 추출하는 것이 바람직한가, 아니면 os API 자체를 React-aware하게 만들 것인가?

---

> **tsx = React ↔ OS Adapter. 책임은 Declare, Bind, Project, Notify 4가지뿐.**
> **tsx가 Discovery(찾기), Computation(계산), Decision(결정)을 하면 headless 시뮬레이션 범위가 늘어나고 거짓 GREEN이 생긴다.**
> **FocusGroup은 이 계약의 가장 큰 위반자 — 311줄 → 목표 20줄.**
