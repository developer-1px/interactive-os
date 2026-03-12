# pit-of-success

| Key | Value |
|-----|-------|
| Claim | `item.field(name)` = unstyled component(data+ARIA 봉인) + entity scope 차단 + `item.when(name)` condition = headless에서 E2E 100% 대체 가능한 pit of success |
| Before | LLM이 entity 직접 참조(`{todo.title}`), ARIA 수동 동기화, headless가 콘텐츠 검증 불가 |
| After | `item.field()` + `item.when()` + `item.trigger()` 세 축이 유일한 데이터 출구. renderToString으로 100% 검증 |
| Size | Heavy |
| Risk | 기존 bind() API 전면 재설계. 25+ showcase 앱 마이그레이션 필요. 디자인 자유도 제약 가능성 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
<!-- /plan이 Task Map으로 채운다 -->

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| 1 | `item.field()`가 반환하는 unstyled component의 정확한 HTML 형태 (boolean→`<input type="checkbox">`, string→`<span>`) | 타입→프리미티브 매핑 테이블 확정 필요 |
| 2 | zone.field() vs zone.items() 경계에서 Field Zone(textbox)과 Collection Zone(listbox) 합성 방식 | combobox, draft+list 패턴에 영향 |
| 3 | `item.when(name)` condition이 item-level 파생 데이터까지 포함하는가 (e.g. `isFirstInCategory`) | Zone iterate 콜백에서 index/prev 접근 방법 |
| 4 | 기존 `<Item>{(state) => JSX}</Item>` render props에서 새 `zone.items((item) => JSX)` 패턴으로의 마이그레이션 경로 | 점진적 전환 vs 일괄 전환 전략 |
| 5 | headless locator 확장 — renderToString HTML에서 콘텐츠(`textContent`) 검증 API | `page.locator("#id").textContent()` 등 Playwright 호환 인터페이스 |
