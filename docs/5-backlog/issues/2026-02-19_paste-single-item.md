# Copy-Paste 다중 선택 하위호환성 이슈

> Status: Open
> Priority: P1 — 특정 기능 완전 동작 불가
> Date: 2026-02-19

## 증상

- 여러 아이템을 선택(Shift+Arrow 등)한 후 Copy(⌘C) → Paste(⌘V) 시, **선택된 전체가 아닌 1개만** 붙여넣기됨
- "selection 문제 없을 것"이라 했지만 하위호환성 이슈 발생

## 환경

- Todo App (Draft + ListView)
- Keyboard: ⌘C → ⌘V

## 재현 단계

1. Todo 리스트에서 여러 아이템 선택 (Shift+Arrow)
2. ⌘C (Copy)
3. ⌘V (Paste)
4. 기대: 선택된 N개 모두 붙여넣기
5. 실제: 1개만 붙여넣기

## 관련 코드

- `src/os/3-commands/clipboard/` — clipboard commands
- `src/os/3-commands/selection/` — selection commands
- 최근 변경: `Field.tsx` FieldRegistry lifecycle 수정 (test-seam)

## 목표

1. 버그 수정
2. **재발 방지 테스트 발견 방법 확립** — seam test 확장
