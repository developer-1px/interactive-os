# 2-command

OS의 핵심 비즈니스 로직 — 순수함수로 작성된 커맨드들.

## 구조

각 커맨드는 독립 폴더:
- `command.ts` — OSCommand 진입점
- `behavior.ts` — 설정 가능한 동작들 (trap, escape, flow 등)

## 예시

```
navigate/
  command.ts    ← OSCommand 진입점
  linear.ts     ← 1D 리스트 탐색
  spatial.ts    ← 2D 그리드 탐색
  seamless.ts   ← Zone 경계 넘기
  corner.ts     ← 모서리 처리
  tree.ts       ← 트리 확장/축소

tab/
  command.ts
  trap.ts       ← dialog 순환
  escape.ts     ← 다음 Zone 이동
  flow.ts       ← 자연 흐름
```

## 역할

- **입력:** OSContext (coeffects — state + DOM 쿼리)
- **출력:** OSResult (effects — state 변경 + DOM 효과)
- **순수함수** — state를 직접 읽거나 쓰지 않음. context로 받고 result로 반환.
