# OS Core Refactoring — 회고

---

## 2026-02-10 — 리팩토링 Import 누락 사건

### 개요

`os/app/debug/`, `os/inspector/`, `os/testBot/` 모듈을 `src/inspector/`로 이동하는 작업 중, **import 경로 불일치로 전 라우트가 마운트 불가** 상태 발생. 스모크 테스트 11/11 실패.

### 발생한 문제

| # | 파일 | 원인 |
|---|------|------|
| 1 | `vite-plugins/spec-wrapper.ts` | Vite 플러그인 내 하드코딩 경로 미갱신 |
| 2 | `apps/todo/widgets/Sidebar.tsx` | import 경로만 바꾸고 파일 이동 안 함 |
| 3 | `CursorOverlay.tsx` | tsx만 이동, CSS 동반 파일 누락 |
| 4 | `StampOverlay.tsx` | 위와 동일 |

### 근본 원인

1. **TS 빌드 ≠ 런타임 검증** — `tsc` 통과해도 Vite dev 서버는 dead code import도 크래시
2. **동반 자산 누락** — `.tsx`만 이동하고 `.css` 빠뜨림
3. **import 경로 변경 ≠ 파일 이동** — 두 작업이 분리되어 불일치 발생
4. **인프라 코드 검색 범위 누락** — `vite-plugins/`, `vite.config.ts` 등

### 교훈 (Lessons Learned)

> **파일을 옮기거나 지웠으면, `npm run build` 말고 스모크 테스트까지 돌려라.**

- `tsc` 통과 ≠ 런타임 정상
- 파일 이동 시 동반 자산(CSS, SVG, JSON) 함께 이동
- import 경로 변경과 파일 이동은 atomic하게
- 인프라 코드(`vite-plugins/`, config 파일)도 검색 범위에 포함

### 재발 방지

- `/fix` workflow에 스모크 테스트 필수화
- 파일 이동 체크리스트 적용
- Vite alias를 single source of truth로 관리

---

> *원본: [notes/2026-02-10_Refactoring_Import_Breakage_Retrospective.md](file:///Users/user/Desktop/interactive-os/docs/1-project/os-core-refactoring/notes/2026-02-10_Refactoring_Import_Breakage_Retrospective.md)*
