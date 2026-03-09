# Task Map: dispatch-tsx

| # | Task | Before | After | 크기 | 의존 | 검증 |
|---|------|--------|-------|------|------|------|
| 1 | EditorToolbar undo/redo → trigger | `onClick={() => dispatch(undoCommand())}` 2건 (L59,64) | trigger prop-getter from BuilderApp zone | S | — | tsc 0 |
| 2 | BuilderPage loadPagePreset → trigger | `dispatch(loadPagePreset)` onClick 1건 (L136) | trigger prop-getter | S | — | tsc 0 |
| 3 | SectionSidebar addBlock → trigger | `dispatch(addBlock)` onClick 1건 (L325) | trigger prop-getter | S | — | tsc 0 |
| 4 | PropertiesPanel dispatch 3건 → trigger/field/effect | OS_EXPAND(useEffect L96), renameSectionLabel(onChange L320), updateField(onChange L478) | useEffect→app effect, onChange→field binding or trigger | M | — | tsc 0 |
| 5 | DocsSearch dispatch 4건 → zone onAction + overlay | selectDoc+closeSearch onClick/keyboard/backdrop (L67,68,75,97) | Zone onAction + overlay dismiss | M | — | tsc 0 |
| 6 | DocsViewer dispatch 3건 → trigger + effect | selectDoc(useEffect L264), resetDoc(onClick L276,285) | useEffect→app effect, onClick→trigger | M | — | tsc 0 |
| 7 | UnifiedInspector 3건 → trigger + effect | toggleGroup(onClick L93), setScrollState(scroll L148), clearSearchQuery(onClick L226) | trigger + app effect | M | — | tsc 0 |
| 8 | TestBotPanel 1건 → effect | initSuites(useEffect L346) | app effect | S | — | tsc 0 |
| 9 | MeterPattern 1건 → app effect | setInterval os.dispatch(OS_VALUE_CHANGE L200) | MeterShowcaseApp effect | S | — | tsc 0 |
| 10 | 전수 검증 | dispatch-in-tsx > 0 | dispatch-in-tsx == 0 | S | →T1~T9 | grep 0 matches + lint 0 |
