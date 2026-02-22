# BOARD — os-api-rename

## 🔴 Now

- [x] T1: `kernel` → `os` 전체 rename
  - [x] `src/os/kernel.ts` — `export const os = createKernel<AppState>(...)`
  - [x] 모든 `import { kernel }` → `import { os }` (앱, 페이지, 테스트)
  - [x] `window.__kernel` → `window.__os`
  - [x] tsc clean + 전체 테스트 통과

- [x] T2: 커맨드 변수명 `OS_` 접두어 통일
  - [x] 접두어 미적용 21개 rename (`NAVIGATE` → `OS_NAVIGATE` 등)
  - [x] barrel export `3-commands/index.ts` 갱신
  - [x] 모든 import site 업데이트
  - [x] 변수명 = 디버그 문자열 일치 확인
  - [x] tsc clean + 전체 테스트 통과

- [x] T3: OS 훅 통합 + 사이드바 적용
  - [x] `SectionSidebar` — `useExpansion()` 훅 적용 (8줄 → 2줄)
  - [ ] `os.useExpansion()` 형태는 circular import로 보류 → Ideas로 이동
  - [x] tsc clean + 전체 테스트 통과

## 💡 Ideas

- `SELECTION_*` 5개 → `SELECT` 하나로 통합 (OS 내부 리팩토링)
- Navigate에 `role="tree"` 인식 추가 → 앱의 수동 EXPAND keybinding 제거
- CSS `[aria-expanded]::before` 기본 indicator 제공
