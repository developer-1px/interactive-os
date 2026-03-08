# ban-dispatch-tsx

## Context

Claim: React(.tsx)에서 os.dispatch 호출은 구조적으로 항상 오류. Trigger + Zone이 전건 커버.

Before → After: 25건 os.dispatch in .tsx → 11건 즉시 수정 + lint rule + 14건 backlog

Risks: trigger 교체 시 기존 동작 깨질 수 있음. builder Zone 구조 복잡.

## Now
- [ ] T1: lint rule `no-dispatch-in-tsx` — eslint-plugin-pipeline에 추가
- [ ] T2: EditorToolbar.tsx — undo/redo dispatch → trigger prop-getter
- [ ] T3: SectionSidebar.tsx — addBlock dispatch → trigger prop-getter
- [ ] T4: BuilderPage.tsx — loadPagePreset dispatch → trigger prop-getter
- [ ] T5: ToastContainer.tsx — dismiss/action dispatch → trigger prop-getter
- [ ] T6: MeterPattern.tsx — setInterval dispatch → 비-React 코드로 이동
- [ ] T9: backlog 등록 — command-palette 7건 + docs-viewer 7건 + PropertiesPanel 2건

## Done

## Unresolved
- PropertiesPanel useEffect OS_EXPAND: Zone auto-expand 지원 여부 미확인
- PropertiesPanel onChange dispatch: builder-v2 프로젝트 소속 여부

## Ideas
- command-palette → combobox Zone 전환 (별도 프로젝트)
- docs-viewer → defineApp + Zone 전환 (별도 프로젝트)
