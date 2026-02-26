# headless-zone-registry

## Context

Claim: ZoneRegistry 등록은 DOM Element 렌더링에 종속되어서는 안 된다. 논리적 생명주기(Config/Callbacks 등록)와 물리적 바인딩(DOM element 연결)을 분리하여 Headless 100% 보장.

Before → After:
- Before: FocusGroup `useLayoutEffect(() => { if (containerRef.current) ZoneRegistry.register(...) })` — DOM 없으면 Zone 미등록. headless `goto()`는 별도 등록 경로.
- After: FocusGroup에서 논리적 등록은 `useMemo` (render-time)로, DOM element 바인딩은 `useLayoutEffect`로 분리. headless와 브라우저가 동일 경로.

Risks:
- 논리 등록 시점에 DOM element가 아직 없으므로, element에 의존하는 코드(autoFocus `querySelector`)가 null을 받을 수 있음 → lazy binding으로 해결.
- 기존 테스트 중 `element` 존재를 가정하는 케이스가 있을 수 있음.

## Now

(All tasks complete)

## Done
- [x] T3: FocusItem DOM focus — 검토 완료. headless에서 useLayoutEffect 자연 비활성. 커널 상태 정상. 변경 불요 ✅
- [x] T2: FocusGroup autoFocus getItems() headless 경로 — tsc 0 | +3 tests | build OK ✅
- [x] T1: FocusGroup Zone 논리 등록을 useMemo(render-time)로 이동 — tsc 0 | +4 tests | build OK ✅

### Scope Out (ROI 낮음 → Ideas 이관)
- T4: goto() 이중 경로 — 이미 양쪽 모두 element:null 등록. 입력 소스가 달라 공유 함수 추출 비용 > 가치
- T5: Field isParentEditing DOM contains() — Field는 headless에서 FieldRegistry로 충분히 테스트됨
- T6: useFieldHooks DOM 조작 — contentEditable은 본질적 브라우저 전용. headless 추상화 ROI 낮음

## Unresolved

(해결됨)
- ~~FocusItem DOM focus steal~~ → T3 검토 완료. headless에서 자연 비활성.
- ~~Field contentEditable~~ → T6 scope out. 본질적 브라우저 전용, ROI 낮음.

## Ideas
- Zone 등록을 커널 커맨드(OS_ZONE_REGISTER)로 승격하여 ZoneRegistry 자체를 커널 상태로 이동
- `useLayoutEffect` 사용을 6-components 레이어에서 ESLint rule로 제한 (DOM 조작만 허용 목록)
