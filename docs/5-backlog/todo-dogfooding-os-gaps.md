# Todo Dogfooding — OS Gap 발견 목록

> 작성일: 2026-03-06
> 출처: Todo headless interaction 테스트 작성 과정에서 발견

## Gap 1: goto() 후 자동 focus 부재

- **증상**: `page.goto("list")` 후 `page.focusedItemId("list")`가 null
- **원인**: headless `goto()`는 `opts.focusedItemId`를 명시하지 않으면 null로 설정. 브라우저의 FocusGroup.tsx는 마운트 시 첫 item에 자동 focus하지만, headless에는 그 로직 없음
- **영향**: 모든 headless interaction 테스트에서 수동으로 focusedItemId 지정 필요 — Zero Drift 위반
- **수정 방향**: `goto()` 시 `focusedItemId`가 null이고 `getItems()`가 item을 반환하면, 첫 번째 item에 자동 focus

## Gap 2: inputmap이 headless에서 적용 안 됨

- **증상**: Space 키가 `OS_CHECK`가 아닌 `OS_SELECT`로 dispatch
- **원인**: zone.bind의 `options.inputmap: { Space: [OS_CHECK()] }`가 headless 키보드 시뮬레이션에서 무시됨
- **영향**: check/toggle 동작을 headless에서 검증할 수 없음
- **수정 방향**: simulateKeyPress에서 ZoneRegistry의 config.inputmap을 조회하여 매핑된 커맨드 dispatch

## Gap 3: AppPage에 zone() accessor 없음

- **증상**: `page.zone("list")` — TypeError: not a function
- **원인**: `zone()` accessor는 OsPage(createOsPage)에만 존재. AppPage(createPage)에는 `focusedItemId(zoneId)`, `selection(zoneId)` 개별 메서드만 있음
- **영향**: 앱 테스트에서 zone 상태를 편리하게 조회할 수 없음 (OsPage와 API 불일치)
- **수정 방향**: AppPage에도 `zone(zoneId)` accessor 추가 또는, API 통합 검토
