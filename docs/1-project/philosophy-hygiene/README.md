# philosophy-hygiene — OS 철학 위생 정비

## WHY

2026-02-19 /review + /redteam 분석에서 발견된 철학 위반 사항을 체계적으로 해소한다.
OS는 "에이전트의 시행착오 비용을 줄이는 것"이 목표이므로, **규칙이 soft(rules.md)로만 존재하는 것은 재발을 보장**한다. 발견된 위반을 수정하고, 가드레일을 기계적으로 강화한다.

## Goals

1. `useComputed` 성능 위반 제거 — 객체 반환 패턴을 원시값/파생값으로 전환
2. `useComputed` 성능 규칙 ESLint 자동 강제 — `no-object-return-in-useComputed` 규칙 추가
3. `pages/` 레이어 `useState`/`onClick` 정리 — 커널 state 또는 OS 프리미티브로 이관
4. deprecated API 정리 — `FieldBindings.onSubmit`, `onChange` 완전 제거
5. 잔존 `console.log` 제거

## Scope

- `src/apps/`, `src/pages/builder/`, `src/os/` — 코드 수정
- `eslint-plugin-pipeline/` — 신규 규칙 추가
- 테스트 코드, 인스펙터(`src/inspector/`), 디버그 도구(`KernelLabPage.tsx`)는 scope 외

## Non-Goals

- 아키텍처 변경 (R1 싱글턴, R2 Context DOM, R3 ZoneRegistry 위치 등은 이 프로젝트 scope 외)
- 새 기능 추가

## 근거

- [리뷰 보고서](../../0-inbox/2026-0219-2114-report-os-philosophy-review.md)
