# dispatch-tsx

## Context

Claim: React(.tsx)에서 os.dispatch 직접 호출은 구조적 위반이다. 22건 잔여. Trigger + Zone onAction으로 전부 대체한다.

Before → After:
- .tsx에서 onClick={() => os.dispatch(cmd())} 22건 → 0건
- 대체 패턴: trigger prop-getter, zone.overlay(), Zone onAction callback
- lint rule `pipeline/no-dispatch-in-tsx` ERROR 활성화 상태 — 0건 달성이 측정 가능

Risks:
- 4개 영역(builder 5, command-palette 6, docs-viewer 7, apg 1, inspector 3)에 걸쳐 파급 넓음
- builder 4건은 pre-existing tsc error — 우리 변경과 무관한 실패 혼입 가능
- docs-viewer/inspector는 defineApp 미적용 앱 — Zone 전환 폭 큼

## Now
- [ ] T5: DocsSearch dispatch 4건 → zone onAction + overlay — 크기: M, 의존: —
- [ ] T6: DocsViewer dispatch 3건 → trigger + effect — 크기: M, 의존: —
- [ ] T7: UnifiedInspector 3건 → trigger + effect — 크기: M, 의존: —
- [ ] T8: TestBotPanel 1건 → effect — 크기: S, 의존: —
- [ ] T9: MeterPattern 1건 → app effect — 크기: S, 의존: —
- [ ] T10: 전수 검증 — dispatch-in-tsx 잔여 건수 확인 — 크기: S, 의존: →T1~T9

## Done
- [x] T1: EditorToolbar undo/redo → trigger — `tsc 0 | +3 pre-existing fixes` (1add1cad)
- [x] T2: BuilderPage loadPagePreset → trigger (preset ID lookup) — `tsc 0` (e5357cd5)
- [x] T3: SectionSidebar addBlock → trigger (preset ID lookup) — `tsc 0` (e5357cd5)

## Deferred (builder-v2 scope)
- T4-a: PropertiesPanel OS_EXPAND → useDispatch() 사용 중 (sanctioned hook), builder zone 의존
- T4-b: PropertiesPanel renameSectionLabel (onChange → field binding) — builder field 모델 의존
- T4-c: PropertiesPanel updateField (onChange → field binding) — builder field 모델 의존

## Unresolved
- ~~builder 4건의 pre-existing tsc error 처리 방향~~ → T1에서 해소 (biome-ignore + ?? false)
- ~~inspector dispatch가 백로그 원본에 없었음~~ → T7~T8로 편입

## Ideas
- lint rule 위반 0건 달성 후 CI pre-commit에 추가
