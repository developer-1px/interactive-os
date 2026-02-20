# OS Hygiene — Dead Code 제거 & 고아 스키마 정리

## WHY

`/doubt` 분석 결과 `src/os/`에서 다음이 발견됨:

1. **Dead exports** — 정의만 있고 참조 0건인 export 5개
2. **발산된 타입** — `OSState`가 두 곳에서 다른 구조로 정의 (Rule #11 위반)
3. **고아 스키마 파일** — `schemas/` 내 5개 파일이 소비자 없음
4. **비어있는 barrel** — `schemas/index.ts` 68줄이 import 0건

## Goals

- 사용되지 않는 코드를 제거하여 유지보수 부채 감소
- `OSState` Single Source of Truth 확보
- 모든 기존 테스트 통과 유지

## Scope

- `src/os/4-effects/` — dead export 정리
- `src/os/lib/loopGuard.ts` — dead export 정리
- `src/os/schemas/` — 고아 파일 + barrel 정리
- **코드 로직 변경 없음** — 순수 제거 작업
