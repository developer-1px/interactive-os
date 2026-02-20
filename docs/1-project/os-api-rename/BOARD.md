# BOARD — os-api-rename

## 🔴 Now

- [ ] T1: `kernel` → `os` 전체 rename
  - [ ] `src/os/kernel.ts` — `export const os = createKernel<AppState>(...)`
  - [ ] 모든 `import { kernel }` → `import { os }` (앱, 페이지, 테스트)
  - [ ] `window.__kernel` → `window.__os`
  - [ ] tsc clean + 전체 테스트 통과

- [ ] T2: 커맨드 변수명 `OS_` 접두어 통일
  - [ ] 접두어 미적용 21개 rename (`NAVIGATE` → `OS_NAVIGATE` 등)
  - [ ] barrel export `3-commands/index.ts` 갱신
  - [ ] 모든 import site 업데이트
  - [ ] 변수명 = 디버그 문자열 일치 확인
  - [ ] tsc clean + 전체 테스트 통과

- [ ] T3: OS 훅 `os.*` 통합
  - [ ] `useFocusExpansion` → `os.useExpansion()`
  - [ ] `useFieldHooks` → `os.useField()`
  - [ ] 훅 접근 경로 정규화
  - [ ] SectionSidebar 등 기존 사용처 마이그레이션

## 💡 Ideas

- `SELECTION_*` 5개 → `SELECT` 하나로 통합 (OS 내부 리팩토링)
- Navigate에 `role="tree"` 인식 추가 → 앱의 수동 EXPAND keybinding 제거
- CSS `[aria-expanded]::before` 기본 indicator 제공
