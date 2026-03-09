# kernel dispatch generic 타입 개선

> 2026-02-18 백로그 등록

## 현황
- `as any` 42개가 OS 코드에 분포 (defineApp계열 25개, 컴포넌트 17개)
- 주 원인: kernel의 `defineCommand`/`processCommand` generic이 defineApp의 dynamic proxy 패턴과 불일치
- 런타임 버그 **없음** — 타입 수준의 문제

## 트리거 조건
- kernel 패키지에 새 기능을 추가할 때 동시에 진행
- `as any`로 인한 실제 런타임 버그가 발생할 때

## 예상 범위
- kernel 패키지의 Command/Payload generic 재설계
- defineApp, Trigger, QuickPick, Field 등의 `as any` 제거
- `@frozen` 해제 필요
