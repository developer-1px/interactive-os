# toolbar role preset: click inputmap 누락

## 현상
- toolbar role preset (`roleRegistry.ts:244-249`)에 `click` 키가 inputmap에 없음
- `inputmap: { Space: [OS_ACTIVATE()], Enter: [OS_ACTIVATE()] }` — click 빠짐
- radiogroup/checkbox는 `click: [OS_CHECK()]`이 있어서 클릭 동작함

## 영향
- toolbar Zone 내 Item을 클릭해도 OS_ACTIVATE가 발생하지 않음
- `PointerListener.tsx:362`에서 `activateOnClick = clickCommands.length > 0` → false

## 참고
- `activate: { onClick: true }` config는 코드베이스 어디에서도 소비되지 않는 dead config
- feed role도 동일하게 click 키 없음

## 분류
OS 갭 — role preset 보강
