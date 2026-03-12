# builder-typing-entry-migration

| Key | Value |
|-----|-------|
| Claim | Builder canvas의 36개 수동 keybinding을 `options: { typingEntry: true }` 한 줄로 교체한다 |
| Before | `createTypingEntryKeybindings()` → 36개 keybinding 수동 생성 + spread into canvas zone |
| After | `options.typingEntry: true` → OS가 inputmap 자동 주입 (A-Z, 0-9, Shift+A-Z) |
| Size | Light |
| Risk | Shift+letter가 추가됨 (기존 36개 → 62개). Builder의 Shift+key 동작에 영향 가능 — drillDown이므로 무해 |

### Warrants

- W1. `ZoneOptions.typingEntry` OS 기능 완성 (zone-typing-entry archived)
- W2. `onAction: createDrillDown(CANVAS_ZONE_ID)` 이미 설정 — typingEntry → OS_ACTIVATE → onAction → drillDown
- W3. keybindings(global) → inputmap(zone-scoped) 전환으로 격리 개선

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|

## Unresolved

(없음)
