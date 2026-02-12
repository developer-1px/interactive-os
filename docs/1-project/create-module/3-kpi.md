# createModule — KPI

## 성공 기준

| 지표 | 현재 값 | 목표 값 | 측정 방법 |
|------|---------|---------|-----------|
| Todo 앱 파일 수 | 22파일 (features/6, bridge/1, selectors/1, widgets/7, model/2, tests/1, logic/1, app.ts, todoKeys.ts) | ≤10파일 (module.ts + widgets/) | `find src/apps/todo -type f \| wc -l` |
| 직접 `@/os-new/` import 수 (앱 내) | 6건 | 0건 | `grep -r "from.*@/os-new" src/apps/` |
| bridge 폴더 존재 | 1개 (mapStateToContext.ts) | 0개 | 디렉토리 확인 |
| 단위 테스트 DOM 의존성 | 필요 (Playwright) | 불필요 (headless) | 테스트 코드에 `render` 호출 유무 |
| 테스트 작성 예제 코드 줄 수 | ~30줄 (setup + render + assertion) | ≤10줄 (create + dispatch + assert) | 가장 단순한 테스트 기준 |
