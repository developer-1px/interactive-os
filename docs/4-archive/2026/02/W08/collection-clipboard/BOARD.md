# BOARD — collection-clipboard

> 목표: createCollectionZone에 copy/cut/paste 자동 생성 추가

## 🔴 Now

(없음)

## ⏳ Done

- [x] T1: Facade에 copy/cut/paste 추가
  - ClipboardConfig: accessor/set/toText/onPaste
  - 38 facade tests all pass
- [x] T2: Todo 마이그레이션
  - 90줄 수동 clipboard → 8줄 config
  - clipboard.todos → clipboard.items (정규화)
  - collectionBindings()가 onCopy/onCut/onPaste 자동 생성
  - 35 todo tests all pass

## 💡 Ideas

- Builder에도 clipboard 기능 추가 (현재 미구현)
- paste 시 FOCUS dispatch 자동화 (onAfterPaste 훅?)
