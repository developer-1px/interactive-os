# Builder typingEntry Migration

> 작성일: 2026-03-12
> 출처: zone-typing-entry 프로젝트 T4

## Summary

Builder canvas의 `createTypingEntryKeybindings()` workaround(36개 수동 keybinding)를
`options: { typingEntry: true }` 한 줄로 교체한다.

## 선행 조건

- ✅ `ZoneOptions.typingEntry` 구현 완료 (zone-typing-entry 프로젝트)
- `createZoneConfig`에서 자동 inputmap 주입 작동 중

## 변경 대상

- `src/apps/builder/features/hierarchicalNavigation.ts` — `createTypingEntryKeybindings` 제거
- `src/apps/builder/app.ts` — keybindings에서 spread 제거, options에 typingEntry: true 추가
