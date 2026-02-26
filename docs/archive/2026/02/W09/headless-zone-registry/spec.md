# Spec — headless-zone-registry

> 한 줄 요약: FocusGroup의 Zone 등록을 DOM-free headless 경로로 전환하여 동일 코드로 브라우저/Vitest 모두 동작하게 한다.

## T1: FocusGroup Zone 논리 등록을 useMemo(render-time)로 이동

### Zone 체크: ❌ Zone 없음 (아키텍처 리팩토링)
이 태스크는 Zone을 만드는 메커니즘 자체의 변경이므로 DT 스킵.

**Story**: OS 개발자로서, FocusGroup의 Zone 등록이 DOM 없이도 동작하길 원한다. 그래야 Vitest headless에서 Zone 생명주기를 완전히 테스트할 수 있기 때문이다.

**Use Case — 주 흐름:**
1. FocusGroup이 마운트된다 (React render)
2. render-time(useMemo)에 ZoneRegistry.register()가 config + callbacks로 호출된다 (element 없음)
3. useLayoutEffect에서 containerRef.current가 존재하면 ZoneRegistry에 element만 바인딩한다
4. Headless 환경에서는 #3이 실행되지 않지만 Zone은 이미 #2에서 등록 완료

**Scenarios (Given/When/Then):**

Scenario 1: Render-time 논리 등록
  Given FocusGroup이 render된다
  When useMemo가 실행된다
  Then ZoneRegistry.has(groupId)가 true이다
  And ZoneEntry.config가 resolveRole 결과와 동일하다
  And ZoneEntry.element는 null이다

Scenario 2: DOM element 지연 바인딩
  Given FocusGroup이 mount된다 (DOM 존재)
  When useLayoutEffect가 실행된다
  Then ZoneRegistry.get(groupId).element가 containerRef.current와 동일하다

Scenario 3: Headless 환경 (DOM 없음)
  Given DOM이 존재하지 않는 headless 환경이다
  When FocusGroup이 render된다
  Then ZoneRegistry.has(groupId)가 true이다
  And ZoneEntry.config에 모든 callbacks가 등록되어 있다
  And ZoneEntry.element는 null이다

Scenario 4: Unmount 시 정리
  Given FocusGroup이 등록된 상태이다
  When FocusGroup이 unmount된다
  Then ZoneRegistry.has(groupId)가 false이다

Scenario 5: Config 변경 시 재등록
  Given FocusGroup이 등록된 상태이다
  When props(role, navigate, callbacks 등)가 변경된다
  Then ZoneRegistry.get(groupId).config가 새 config를 반영한다

Scenario 6: Callbacks 등록 (element 무관)
  Given FocusGroup에 onAction, onDelete, onCopy 콜백이 전달된다
  When render-time 등록이 실행된다
  Then ZoneEntry.onAction, onDelete, onCopy가 모두 등록된다
  And element 존재 여부와 무관하다

## 1. 상태 인벤토리

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| Zone 미등록 | ZoneRegistry에 groupId 없음 | 초기 상태 | useMemo 등록 |
| Zone 논리 등록 | Config + Callbacks 등록, element=null | useMemo 실행 | useLayoutEffect, 또는 unmount |
| Zone 완전 등록 | Config + Callbacks + element 등록 | useLayoutEffect (DOM 존재) | unmount |
| Zone 해제 | ZoneRegistry에서 제거 | unmount | — |

## 2. 범위 밖 (Out of Scope)

- T2 (autoFocus headless 전환) — 별도 태스크
- T3 (FocusItem DOM focus 통합) — 별도 태스크
- T4 (goto() 이중 경로 제거) — T1 완료 후 후속
- T5, T6 (Field DOM 조작) — 별도 태스크
- Zone 등록을 커널 커맨드로 승격 (Ideas 아이템)
- FocusGroup의 autoFocus/autoStack useLayoutEffect 변경 (T2의 범위)

---

## T2: FocusGroup autoFocus를 getItems() headless 경로로 전환

### Zone 체크: ❌ Zone 없음 (아키텍처 리팩토링)

**Story**: OS 개발자로서, autoFocus가 DOM `querySelector` 없이도 첫 번째 아이템을 포커스하길 원한다. 그래야 headless 환경(Vitest)에서 dialog/alertdialog의 autoFocus가 동작하기 때문이다.

**Use Case — 주 흐름:**
1. FocusGroup이 autoFocus=true로 마운트된다
2. ZoneRegistry에서 getItems()를 통해 첫 번째 아이템 ID를 얻는다
3. OS_FOCUS를 dispatch하여 첫 번째 아이템을 포커스한다
4. DOM이 없는 headless 환경에서도 동일하게 동작한다

**Scenarios (Given/When/Then):**

Scenario T2-1: getItems() 경로로 autoFocus
  Given FocusGroup에 autoFocus=true이고 getItems=() => ["a","b","c"]이다
  When FocusGroup이 마운트된다
  Then OS_FOCUS({ zoneId, itemId: "a" })가 dispatch된다

Scenario T2-2: getItems가 없으면 DOM fallback (브라우저)
  Given FocusGroup에 autoFocus=true이고 getItems가 없다
  When FocusGroup이 브라우저 DOM에 마운트된다
  Then 기존 querySelector fallback이 동작한다

Scenario T2-3: getItems가 빈 배열이면 zone만 활성화
  Given FocusGroup에 autoFocus=true이고 getItems=() => []이다
  When FocusGroup이 마운트된다
  Then OS_FOCUS({ zoneId, itemId: null })가 dispatch된다 (zone 활성화만)

Scenario T2-4: headless에서 autoFocus 동작
  Given headless 환경(renderToString)이다
  And FocusGroup에 autoFocus=true, getItems=() => ["x"]이다
  When FocusGroup이 render된다
  Then activeZoneId가 해당 zone으로 설정된다
