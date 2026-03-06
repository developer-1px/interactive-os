# Todo Dogfooding — OS Gap 발견 목록

> 작성일: 2026-03-06
> 출처: Todo headless interaction 테스트 작성 과정에서 발견

## Gap 1: goto() 후 자동 focus 부재

- **증상**: `page.goto("list")` 후 `page.focusedItemId("list")`가 null
- **원인**: headless `goto()`는 `opts.focusedItemId`를 명시하지 않으면 null로 설정. 브라우저의 FocusGroup.tsx는 마운트 시 첫 item에 자동 focus하지만, headless에는 그 로직 없음
- **영향**: 모든 headless interaction 테스트에서 수동으로 focusedItemId 지정 필요 — Zero Drift 위반
- **수정 방향**: `goto()` 시 `focusedItemId`가 null이고 `getItems()`가 item을 반환하면, 첫 번째 item에 자동 focus

## ~~Gap 2: inputmap이 headless에서 적용 안 됨~~ ✅ RESOLVED

- **결과**: 재검증 결과 inputmap이 정상 동작. `simulateKeyPress`가 `entry?.config?.inputmap`을 읽고 `resolveKeyboard`에 전달함
- **원인**: 초기 테스트 시 오진 (zone 등록 전 테스트했거나, 이후 수정됨)
- **증거**: `Space triggers onCheck (toggleTodo)` 테스트 GREEN (14/14 pass)

## Gap 3: AppPage에 zone() accessor 없음

- **증상**: `page.zone("list")` — TypeError: not a function
- **원인**: `zone()` accessor는 OsPage(createOsPage)에만 존재. AppPage(createPage)에는 `focusedItemId(zoneId)`, `selection(zoneId)` 개별 메서드만 있음
- **영향**: 앱 테스트에서 zone 상태를 편리하게 조회할 수 없음 (OsPage와 API 불일치)
- **수정 방향**: AppPage에도 `zone(zoneId)` accessor 추가 또는, API 통합 검토

## Gap 4: Field without fieldName → headless 등록 누락

- **증상**: `page.goto("edit")` 후 `keyboard.type()`, `keyboard.press("Enter/Escape")` 모두 무반응
- **원인**: `page.ts` goto()는 `field?.fieldName`이 있을 때만 FieldRegistry에 등록. edit zone의 field binding에 fieldName이 없음 (브라우저에서는 `<Field name="...">` JSX prop이 대신 제공)
- **영향**: fieldName 없는 Field zone은 headless에서 완전히 비활성 — Zero Drift 위반
- **수정 방향**:
  - (A) `goto()`에서 fieldName 없을 시 zone 이름을 fallback으로 사용 (e.g., `field.fieldName ?? zoneName`)
  - (B) bind()에 fieldName 필수화 (Pit of Success — 선언 시 누락 방지)

## Gap 5: keyboard.type() 무반응이 silent

- **증상**: `keyboard.type("text")` 후 아무 에러/경고 없이 값이 무시됨
- **원인**: `keyboard.type()` → `FieldRegistry.updateValue(fieldId, text)` — fieldId가 없으면 return (silent)
- **영향**: 디버깅 난이도 상승. field가 미등록인지 알 수 없음
- **수정 방향**: `keyboard.type()` 시 field 미등록이면 console.warn 또는 throw
