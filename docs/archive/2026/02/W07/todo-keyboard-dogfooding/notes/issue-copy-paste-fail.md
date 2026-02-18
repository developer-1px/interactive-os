# 🐛 Meta+C then Meta+V fails to duplicate item in Todo App
> 등록일: 2026-02-13
> 상태: closed
> 심각도: P2

## 원문
Test Scenario: Todo App › Meta+C then Meta+V duplicates item
Status: FAIL
ERROR: Error: Expected 2 elements with text "Complete Interaction OS docs", got 1

## 해석
사용자가 Todo App에서 `Meta+c` (복사) 후 `Meta+v` (붙여넣기)를 시도했으나, 아이템이 복제되지 않음.
기대 동작: 같은 텍스트를 가진 아이템이 하나 더 생겨 총 2개가 되어야 함.
실제 동작: 아이템이 여전히 1개임.

## 첫 감
- **Clipboard API 권한 문제**: Playwright Headless 모드에서 Clipboard API가 차단되었거나 권한 부여가 안 되었을 가능성.
- **포커스 문제**: 붙여넣기 시점에 포커스가 올바른 컨테이너에 없어서 핸들러가 동작하지 않았을 수도 있음.
- **이벤트 핸들링**: `Meta+c`나 `Meta+v` 키보드 이벤트가 OS 레벨에서 캡처되거나 앱 내에서 preventDefault 처리되었을 가능성.

## 해결 요약
- 원인: `playwright.config.ts`에 `clipboard-read`/`clipboard-write` 퍼미션 누락. Headless Chromium에서 네이티브 clipboard 이벤트가 차단됨.
- 수정: `playwright.config.ts` → `use.permissions`에 `["clipboard-read", "clipboard-write"]` 추가
- 검증: 12/12 tests passed (4.6s)
