# 🐛 Issue: Todo 삭제 다이얼로그 키보드 UX

> Date: 2026-02-22
> Priority: P1 (기능불가)
> Status: [Open — 설계 필요]

## 증상

- 삭제 확인 다이얼로그에서 Enter로 확인 실행 안 됨
- 다이얼로그 내 Tab으로 버튼 간 포커스 이동 안 됨
- keyboard-only 사용자에게 마우스 강제

## 기대 동작

1. 다이얼로그 열리면 Confirm 버튼에 autoFocus
2. Enter → confirmDeleteTodo 실행
3. Tab → Cancel 버튼으로 포커스 이동
4. Escape → cancelDeleteTodo 실행

## 근본 원인

DialogZone에 `onAction`이 없어서 Enter가 무시됨.
각 버튼이 서로 다른 command(confirm vs cancel)를 dispatch하므로,
Zone 레벨의 단일 onAction으로는 해결 불가.

## 올바른 해결 — OS 메커니즘 추가 필요

**A안 (추천)**: FocusItem에 `actionCommand` prop 추가.
- 각 FocusItem이 자기 action command를 선언
- OS가 onAction 시 해당 item의 command를 lookup → dispatch
- TriggerDismiss의 onPress가 자연스럽게 actionCommand가 됨

**금지**: DOM `.click()` 우회 (rules.md 검증 #9 위반)

## Retrospective

- DOM `.click()` 해킹을 시도했다가 /reflect에서 발견 → 되돌림
- rules.md 검증 #9 범위를 OS 전체로 확장
- /self 금지 행동 #9 추가: "기능이 없으니 DOM으로 우회" → 금지
