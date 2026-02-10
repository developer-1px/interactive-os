# 리팩토링 Import 누락 회고

## 1. 개요 (Overview)

2026-02-10 리팩토링 세션에서 `os/app/debug/`, `os/inspector/`, `os/testBot/` 모듈을 `src/inspector/`로 이동하는 작업 중, **import 경로 불일치로 전 라우트가 마운트 불가** 상태가 발생했다.

스모크 테스트 11/11 실패. 빌드(tsc)는 통과했지만 Vite 런타임에서 크래시.

## 2. 발생한 문제 (4건)

| # | 파일 | 증상 | 원인 |
|---|------|------|------|
| 1 | `vite-plugins/spec-wrapper.ts` | `@/os/testBot/playwright/registry` resolve 실패 | Vite 플러그인 내 하드코딩 경로 미갱신 |
| 2 | `apps/todo/widgets/Sidebar.tsx` | `@inspector/shell/components/Kbd` resolve 실패 | import 경로만 바꾸고 파일 이동 안 함 |
| 3 | `inspector/testbot/widgets/CursorOverlay.tsx` | `./CursorOverlay.css` resolve 실패 | tsx만 이동, CSS 동반 파일 누락 |
| 4 | `inspector/testbot/widgets/StampOverlay.tsx` | `./StampOverlay.css` resolve 실패 | 위와 동일 |

## 3. 근본 원인 분석

### ① TS 빌드 ≠ 런타임 검증

- `tsc --noEmit`은 통과 → **삭제된 파일을 참조하는 코드가 dead code라 TS가 체크 안 함**
- Vite dev 서버는 lazy하게 모든 import를 resolve → **dead code여도 import chain에 걸리면 크래시**
- CSS import, Vite 플러그인이 inject하는 import는 TS가 아예 모름

> **교훈: `tsc` 통과 ≠ 런타임 정상. 파일 이동/삭제 후에는 반드시 스모크 테스트까지.**

### ② 파일 이동 시 "동반 자산" 누락

- `.tsx` 파일만 이동하고 같은 디렉토리의 `.css` 파일을 빠뜨림
- 파일 이동 체크리스트가 없어서, 상대경로 import (`./Something.css`)가 깨짐

> **교훈: 파일 이동 시 같은 디렉토리의 비-TS 자산(CSS, SVG, JSON 등)도 함께 이동해야 함.**

### ③ Import 경로 변경과 파일 이동의 분리

- `Sidebar.tsx`의 import를 `@os/app/debug/components/Kbd` → `@inspector/shell/components/Kbd`로 바꿨지만, 정작 **Kbd.tsx를 그 위치로 이동시키지 않음**
- "import 경로 수정"과 "파일 이동"이 별개 작업으로 처리되어 불일치 발생

> **교훈: import 경로 변경과 파일 이동은 반드시 atomic하게 (하나의 커밋 단위로).**

### ④ Vite 플러그인/config 내 하드코딩 경로

- `spec-wrapper.ts`에 `@/os/testBot/playwright/registry` 경로가 문자열 리터럴로 하드코딩
- grep으로 소스 코드만 검색하면 Vite 플러그인은 검색 범위에서 빠지기 쉬움

> **교훈: 파일 경로 이동 시 `vite-plugins/`, `vite.config.ts`, `playwright.config.ts` 등 인프라 코드도 반드시 검색 범위에 포함.**

## 4. 재발 방지 제안

### 즉시 적용 가능

1. **`/fix` workflow에 스모크 테스트 필수화** — 파일 이동/삭제 작업 후에는 빌드만 하지 말고 스모크 테스트까지 돌리기 (이미 workflow에 있지만, 실제로 스킵되는 경우가 많았음)

2. **파일 이동 workflow 추가** — 파일 이동 시 아래 체크리스트 자동 수행:
   - [ ] 대상 파일의 동반 자산 (CSS, SVG, JSON 등) 함께 이동
   - [ ] import 경로 변경은 파일 이동과 동시에 수행
   - [ ] `vite-plugins/`, `vite.config.ts`, `playwright.config.ts`, `tsconfig.*.json` 내 경로 검색
   - [ ] 스모크 테스트 실행

3. **인프라 경로 상수화** — `spec-wrapper.ts` 같은 플러그인에서 경로를 하드코딩하지 말고, `vite.config.ts`의 alias에서 가져오거나 상수로 관리

### 구조적 개선

4. **Vite alias를 single source of truth로** — `tsconfig.paths`와 `vite.config.ts` alias가 각각 따로 관리되고 있음. 한 곳에서 정의하고 나머지가 참조하는 구조로.

5. **CI에 스모크 테스트 추가** — 커밋 전 스모크 테스트 통과를 강제하는 게이트 추가

## 5. 결론

이번 문제는 "리팩토링 시 검증 범위가 TS 빌드에 한정되어 있었다"는 프로세스 문제. 코드 자체의 버그가 아니라 **이동 작업의 완결성 검증 부재**가 원인이다.

핵심 규칙 하나:

> **파일을 옮기거나 지웠으면, `npm run build` 말고 `npx playwright test e2e/smoke.spec.ts`까지 돌려라.**
