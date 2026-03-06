# Audit: apg-test-fidelity (2026-03-06)

## Scope
8 APG test files converted from synthetic defineApp factories to real showcase App configs.

## Results

**🔴 LLM 실수: 0건**
**🟡 OS 갭: 0건 (신규)**
**⚪ 정당한 예외: 3건**

### ⚪ 정당한 예외

| # | 파일 | 패턴 | 사유 |
|---|------|------|------|
| 1 | button.apg.test.ts:54 | defineApp inline (action button) | ButtonPattern exports ToggleApp only. ActionButton uses Trigger pattern without zone — no showcase App to import |
| 2 | feed.apg.test.ts:132,211 | defineApp inline (multi-zone) | Control+End/Home and Tab exit tests require custom 3-zone arrangement. Single showcase FeedApp cannot express this |
| 3 | tree.apg.test.ts:9 | Comment references defineApp | Dead comment, trivial |

### Pre-existing (out of scope)

4 files (combobox, dropdown-menu, dialog, menu) import `@os-core/` directly — documented in purge-os-core-imports gap report, not changed by this project.

## 0건 규칙 검증

- OS 프리미티브: createPage, page.goto, keyboard.press, click, attrs, focusedItemId, selection — all from @os-devtool/testing
- os.dispatch 직접 호출: 0건
- @os-core facade 위반: 0건 (변경 파일 내)

**→ ✅ PASS**
