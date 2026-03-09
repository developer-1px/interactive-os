# os.dispatch in .tsx — 잔여 19건 마이그레이션 백로그

> 등록일: 2026-03-09
> 원칙: React(.tsx)에서 os.dispatch 호출은 구조적으로 항상 오류
> lint rule: `pipeline/no-dispatch-in-tsx` ERROR 활성화됨
> 전부 🔴 LLM 실수 (OS gap 0건). Trigger + Zone으로 대체.

## builder pages (5건) — builder-v2 소속

4건은 pre-existing tsc error (`os` not in scope). builder-v2 리팩토링 시 함께 수정.

- `EditorToolbar.tsx:57,62` — undo/redo → trigger prop-getter
- `SectionSidebar.tsx:323` — addBlock → trigger prop-getter
- `BuilderPage.tsx:134` — loadPagePreset → trigger prop-getter
- `PropertiesPanel.tsx:475` — updateField → trigger/field binding

## command-palette (6건) — 별도 프로젝트

전체 앱이 OS Zone 미적용. combobox role Zone 마이그레이션 필요.

- `QuickPick.tsx:196,198` — overlay open/close → zone.overlay()
- `QuickPick.tsx:227` — focus → Zone auto-focus
- `QuickPick.tsx:272` — close → overlay auto-dismiss
- `QuickPick.tsx:309,313` — navigate → Zone built-in keyboard

## docs-viewer (7건) — 별도 프로젝트

전체 앱이 OS Zone 미적용. defineApp + Zone 전환 필요.

- `DocsSearch.tsx:56,57,64,86` — selectDoc/closeSearch → Zone onAction + overlay
- `DocsViewer.tsx:264,276,285` — selectDoc/resetDoc → Zone callback + initial state

## apg-showcase (1건)

- `MeterPattern.tsx:200` — setInterval dispatch → app.ts effect로 이동
