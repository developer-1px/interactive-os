# Zone typingEntry 옵션

## 문제

Builder canvas에서 printable character 입력 시 편집 모드 진입이 필요하다 (Figma/Slides 패턴).
현재 OS에 "navigating → editing 전환" 개념이 없어서, 앱이 a-z/0-9 = 36개 keybinding을 수동 등록하는 workaround를 사용한다.

## 현재 (workaround)

```ts
// src/apps/builder/features/hierarchicalNavigation.ts
export function createTypingEntryKeybindings(zoneId: string) {
  const drillDown = createDrillDown(zoneId);
  const keys = [...'abcdefghijklmnopqrstuvwxyz0123456789'];
  return keys.map(key => ({ key, command: drillDown }));
}
```

## 목표

```ts
canvasZone.bind({
  role: "grid",
  options: {
    typingEntry: true, // printable char → onAction 자동 트리거
  },
});
```

OS가 navigating 중 printable character를 감지하면:
1. `onAction` 콜백 호출 (= drillDown → FIELD_START_EDIT)
2. 타이핑된 문자를 새로 열린 Field에 전달

## 근거

- "Key는 Command의 속성이다" 원칙과 일관 — 36개 keybinding은 이 원칙에 역행
- Zone config 한 줄로 해결되어야 하는 zone-level behavior
- Figma/Google Slides가 사용하는 보편적 패턴
