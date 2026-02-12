# Discussion: dispatchToZone 제거 — 결론

> **일시**: 2026-02-12 13:36~13:45

## Why

`dispatchToZone`은 **리스너가 커널을 우회해서 ZoneRegistry를 직접 탐색하고 앱 커맨드를 실행하는 계층 위반**이다. 수정이 아닌 **제거** 대상이다.

## Intent

기존 NAVIGATE/ACTIVATE/ESCAPE가 이미 사용하는 **"Listener → OS Command → 커널이 Zone resolve"** 패턴을 clipboard에도 동일하게 적용한다. 새로운 구조를 발명하는 것이 아니라 **기존 패턴을 따르는 것**이다.

## Warrants

| # | 논거 |
|---|---|
| W1 | Listener = 번역기 — 이벤트 선언만 하고 라우팅에 관여하지 않는다 (rules.md 대원칙 2) |
| W2 | `(entry as any)[propName]` — 직접 레지스트리 접근은 타입 안전성을 깨뜨린다 |
| W3 | dispatchToZone의 두 책임(active zone 조회 + 커맨드 resolve)은 이미 커널이 수행 가능 — 불필요한 중간자 |
| W4 | copy 하나를 올바르게 풀면 cut/paste/undo/redo 모두 동일 패턴으로 해소 |
| W5 | Zone의 onCopy 바인딩 등록 구조는 선언적이므로 유지 |
| W6 | 핵심 대립은 "편의성 vs 원칙" — 커널 우회를 허용하면 선례가 된다 |
| W7 | NAVIGATE/ACTIVATE/ESCAPE가 이미 "OS 커맨드 → zone resolve" 패턴 사용 — Gap 없음 |
| W8 | CLAUDE.md의 레거시 아키텍처 설명이 AI에게 잘못된 컨텍스트를 제공하여 혼동 유발 |

## 한 줄 요약

> **dispatchToZone은 리스너가 커널을 우회하는 불필요한 중간자이며, 기존 NAVIGATE/ACTIVATE 패턴을 clipboard에 동일하게 적용하면 제거된다.**
