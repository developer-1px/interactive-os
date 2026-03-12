# zone-typing-entry — typingEntry Zone 옵션

> **Size**: Light
> **Epic**: os/zift
> **Created**: 2026-03-12

## Context

Builder canvas에서 printable character 입력 시 편집 모드 진입이 필요하다 (Figma/Slides 패턴).
현재 앱이 36개 keybinding을 수동 등록하는 workaround 사용. OS가 zone option으로 자동 처리해야 한다.

### Warrants

- W1. "기존 메커니즘이 있으면 그것을 사용한다" — Keybindings 등록은 이미 존재
- W2. builder가 이미 36개 수동 keybinding으로 동작 증명
- W3. 새 콜백/패턴 발명 없이 ZoneOptions + auto-keybinding으로 해결

### Design (Option A: Auto-Keybinding)

- `ZoneOptions.typingEntry: boolean` 추가
- `typingEntry: true` → a-z, 0-9 keybinding을 자동 등록, 각각 `onAction` 트리거
- 문자 전달: 편집 모드 진입 후 다음 keystroke가 native input으로 전달 (builder 기존 패턴)

## Now

(없음 — T1-T3 완료)

## Unresolved

(없음 — T4는 builder 앱 마이그레이션으로 별도 백로그 위임)

## Done

- [x] T1: `ZoneOptions.typingEntry?: boolean` 추가 — `zoneContext.ts:73` ✅
- [x] T2: `createZoneConfig`에서 typingEntry → inputmap 자동 주입 (A-Z, 0-9, Shift+A-Z) — tsc 0 ✅
- [x] T3: 8 headless tests (DT1-DT8) 전부 GREEN — tsc 0 | +8 tests (735 total) ✅
