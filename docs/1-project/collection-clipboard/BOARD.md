# BOARD — collection-clipboard

> 목표: createCollectionZone에 copy/cut/paste 자동 생성 추가

## 🔴 Now

- [ ] T1: Facade에 copy/cut/paste 추가 — Light
  - copy: 선택 아이템 → clipboard state + clipboardWrite effect
  - cut: copy + remove
  - paste: clipboard → insert after focused item (onPaste 훅)
  - collectionBindings()에 onCopy/onCut/onPaste 추가
  - [ ] Step 1: /ready
  - [ ] Step 5: /tdd — 테스트 먼저
  - [ ] Step 6: /solve — 구현
  - [ ] Step 8: /fix
  - [ ] Step 11: /verify

- [ ] T2: Todo 마이그레이션 — Light
  - 수동 copyTodo/cutTodo/pasteTodo → facade 자동 생성으로 대체
  - [ ] Step 6: /solve
  - [ ] Step 11: /verify

## ⏳ Done

(없음)

## 💡 Ideas

- Builder에도 clipboard 기능 추가 (현재 미구현)
- paste 시 FOCUS dispatch 자동화 (onAfterPaste 훅?)
